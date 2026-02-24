import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// @ts-ignore - @ffmpeg-installer/ffmpeg has no types
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import type { AudioSourceInfo } from './types.js';

const ffmpegPath: string = ffmpegInstaller.path;

export interface StitchOptions {
  framesDir: string;
  outputPath: string;
  fps: number;
  codec?: 'mp4' | 'webm';
  crf?: number;
  pixelFormat?: string;
  onProgress?: (progress: number) => void;
  /** Audio sources collected from Audio/Video components */
  audioSources?: AudioSourceInfo[];
  /** Root directory where static files are served from (for resolving audio src URLs) */
  assetsDir?: string;
}

export async function stitchFramesToVideo(options: StitchOptions): Promise<void> {
  const {
    framesDir,
    outputPath,
    fps,
    codec = 'mp4',
    crf = 18,
    pixelFormat = 'yuv420p',
    audioSources = [],
    assetsDir,
  } = options;

  const inputPattern = path.join(framesDir, 'frame-%06d.png');

  // Resolve audio sources to absolute file paths, filtering out missing files
  const resolvedAudio: Array<AudioSourceInfo & { filePath: string }> = [];
  if (assetsDir && audioSources.length > 0) {
    for (const source of audioSources) {
      const cleaned = source.src.startsWith('/') ? source.src.slice(1) : source.src;
      const filePath = path.resolve(assetsDir, cleaned);
      if (fs.existsSync(filePath)) {
        resolvedAudio.push({ ...source, filePath });
      } else {
        console.warn(`[rendiv] Audio source not found: ${filePath} (src: ${source.src})`);
      }
    }
  }

  if (audioSources.length > 0) {
    console.log(`[rendiv] Audio sources collected: ${audioSources.length}, resolved: ${resolvedAudio.length}`);
    for (const a of resolvedAudio) {
      console.log(`[rendiv]   ${a.type} "${a.filePath}" startAt=${a.startAtFrame} dur=${a.durationInFrames} vol=${a.volume}`);
    }
  } else {
    console.log('[rendiv] No audio sources collected from composition');
  }

  const args: string[] = [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
  ];

  // Add each audio source as an input
  for (const audio of resolvedAudio) {
    args.push('-i', audio.filePath);
  }

  // Build filter graph for audio processing
  let filterGraph = '';
  if (resolvedAudio.length > 0) {
    const filterParts: string[] = [];
    const mixInputs: string[] = [];

    for (let i = 0; i < resolvedAudio.length; i++) {
      const audio = resolvedAudio[i];
      const inputIdx = i + 1; // input 0 is the video frames
      const delayMs = Math.round((audio.startAtFrame / fps) * 1000);
      const startFromSec = audio.startFrom / fps;
      const durationSec = audio.durationInFrames / fps;
      const label = `a${i}`;

      // Build per-source filter chain: trim → atempo → adelay → volume
      const filters: string[] = [];

      // Trim: skip into source file and limit duration
      filters.push(`atrim=start=${startFromSec.toFixed(6)}:duration=${durationSec.toFixed(6)}`);
      filters.push('asetpts=PTS-STARTPTS');

      // Playback rate adjustment via atempo (supports 0.5–100, chain for wider range)
      if (audio.playbackRate !== 1) {
        const tempoFilters = buildAtempoChain(audio.playbackRate);
        filters.push(...tempoFilters);
      }

      // Delay: offset audio start position in the timeline
      if (delayMs > 0) {
        filters.push(`adelay=${delayMs}|${delayMs}`);
      }

      // Volume
      if (audio.volume !== 1) {
        filters.push(`volume=${audio.volume.toFixed(4)}`);
      }

      filterParts.push(`[${inputIdx}:a]${filters.join(',')}[${label}]`);
      mixInputs.push(`[${label}]`);
    }

    // Mix all audio tracks together
    if (mixInputs.length === 1) {
      filterGraph = `${filterParts[0].replace(`[${mixInputs[0].slice(1, -1)}]`, '[aout]')}`.replace(
        filterParts[0],
        filterParts[0]
      );
      // Simpler: just rename the output label
      filterGraph = filterParts[0].slice(0, filterParts[0].lastIndexOf('[')) + '[aout]';
    } else {
      filterGraph = filterParts.join(';')
        + `;${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:normalize=0[aout]`;
    }

    args.push('-filter_complex', filterGraph);
    args.push('-map', '0:v', '-map', '[aout]');
  }

  if (codec === 'mp4') {
    args.push(
      '-c:v', 'libx264',
      '-crf', String(crf),
      '-pix_fmt', pixelFormat,
      '-movflags', '+faststart',
    );
    if (resolvedAudio.length > 0) {
      args.push('-c:a', 'aac', '-b:a', '192k');
    }
  } else {
    args.push(
      '-c:v', 'libvpx-vp9',
      '-crf', String(crf),
      '-b:v', '0',
    );
    if (resolvedAudio.length > 0) {
      args.push('-c:a', 'libopus', '-b:a', '128k');
    }
  }

  // Ensure output duration matches the video (don't let audio extend it)
  args.push('-shortest');

  args.push(outputPath);

  console.log(`[rendiv] FFmpeg command: ${ffmpegPath} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderrData = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderrData += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}:\n${stderrData}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
    });
  });
}

/**
 * FFmpeg's atempo filter only supports values in [0.5, 100].
 * For rates outside this range, chain multiple atempo filters.
 */
function buildAtempoChain(rate: number): string[] {
  const filters: string[] = [];
  let remaining = rate;

  if (remaining < 0.5) {
    while (remaining < 0.5) {
      filters.push('atempo=0.5');
      remaining /= 0.5;
    }
  } else if (remaining > 100) {
    while (remaining > 100) {
      filters.push('atempo=100');
      remaining /= 100;
    }
  }

  filters.push(`atempo=${remaining.toFixed(6)}`);
  return filters;
}

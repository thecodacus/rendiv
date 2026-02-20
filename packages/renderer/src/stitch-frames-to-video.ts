import { spawn } from 'node:child_process';
import path from 'node:path';

// @ts-ignore - @ffmpeg-installer/ffmpeg has no types
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const ffmpegPath: string = ffmpegInstaller.path;

export interface StitchOptions {
  framesDir: string;
  outputPath: string;
  fps: number;
  codec?: 'mp4' | 'webm';
  crf?: number;
  pixelFormat?: string;
  onProgress?: (progress: number) => void;
}

export async function stitchFramesToVideo(options: StitchOptions): Promise<void> {
  const {
    framesDir,
    outputPath,
    fps,
    codec = 'mp4',
    crf = 18,
    pixelFormat = 'yuv420p',
  } = options;

  const inputPattern = path.join(framesDir, 'frame-%06d.png');

  const args: string[] = [
    '-y',
    '-framerate', String(fps),
    '-i', inputPattern,
  ];

  if (codec === 'mp4') {
    args.push(
      '-c:v', 'libx264',
      '-crf', String(crf),
      '-pix_fmt', pixelFormat,
      '-movflags', '+faststart',
    );
  } else {
    args.push(
      '-c:v', 'libvpx-vp9',
      '-crf', String(crf),
      '-b:v', '0',
    );
  }

  args.push(outputPath);

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

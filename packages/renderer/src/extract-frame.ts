import { spawn } from 'node:child_process';

import ffmpegStatic from 'ffmpeg-static';

const ffmpegPath: string = ffmpegStatic as unknown as string;

export interface ExtractFrameOptions {
  videoPath: string;
  timeInSeconds: number;
}

/**
 * Extract a single frame from a video file at the given timestamp using FFmpeg.
 * Uses hybrid seeking: fast keyframe seek + decode-accurate sub-seek for precision.
 * Returns the frame as a PNG buffer.
 */
export function extractFrame(options: ExtractFrameOptions): Promise<Buffer> {
  const { videoPath, timeInSeconds } = options;

  // Hybrid seek: fast seek to 1s before, then decode-accurate for the remainder.
  // This gives keyframe-speed performance with frame-accurate results.
  const preSeek = Math.max(0, timeInSeconds - 1);
  const remainder = timeInSeconds - preSeek;

  const args: string[] = [
    '-ss', String(preSeek),       // Fast seek before input
    '-i', videoPath,
    '-ss', String(remainder),     // Accurate seek after input
    '-frames:v', '1',             // Extract exactly 1 frame
    '-f', 'image2pipe',           // Pipe output
    '-vcodec', 'png',             // Output as PNG
    '-',                          // Write to stdout
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const chunks: Buffer[] = [];
    proc.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(new Error(`FFmpeg frame extraction failed (code ${code}): ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
    });
  });
}

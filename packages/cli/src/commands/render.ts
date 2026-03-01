import { Command } from 'commander';
import { bundle } from '@rendiv/bundler';
import { renderMedia, selectComposition, closeBrowser } from '@rendiv/renderer';
import type { GlRenderer, RenderProfile } from '@rendiv/renderer';
import ora from 'ora';
import chalk from 'chalk';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function printProfile(profile: RenderProfile): void {
  const totalPhaseTime = profile.phases.setFrame.avgMs + profile.phases.waitForHolds.avgMs + profile.phases.screenshot.avgMs;

  const phases = [
    { key: 'React render', ...profile.phases.setFrame },
    { key: 'Wait for holds', ...profile.phases.waitForHolds },
    { key: 'Screenshot', ...profile.phases.screenshot },
  ];

  const bottleneckLabels: Record<string, string> = {
    setFrame: 'React render',
    waitForHolds: 'Wait for holds',
    screenshot: 'Screenshot',
  };

  console.log('');
  console.log(chalk.bold('  Profiling summary'));
  console.log(`  ${profile.totalFrames} frames in ${formatDuration(profile.totalTimeMs)} (${profile.framesPerSecond.toFixed(1)} fps)`);
  console.log('');
  console.log('  Phase breakdown (avg per frame):');

  for (const p of phases) {
    const pct = totalPhaseTime > 0 ? Math.round((p.avgMs / totalPhaseTime) * 100) : 0;
    const isBottleneck = p.key === bottleneckLabels[profile.bottleneck];
    const line = `    ${p.key.padEnd(18)} ${String(Math.round(p.avgMs)).padStart(5)}ms  (${String(pct).padStart(2)}%)`;
    if (isBottleneck) {
      console.log(chalk.yellow(`${line}  ← bottleneck`));
    } else {
      console.log(line);
    }
  }
  console.log('');
}

export const renderCommand = new Command('render')
  .description('Render a composition to video')
  .argument('<entry>', 'Entry file (e.g. src/index.tsx)')
  .argument('<compositionId>', 'Composition ID')
  .argument('[output]', 'Output file path', 'out/video.mp4')
  .option('--props <json>', 'Input props as JSON', '{}')
  .option('--codec <codec>', 'Output codec (mp4, webm)', 'mp4')
  .option('--concurrency <n>', 'Parallel browser tabs', '1')
  .option('--frames <range>', 'Frame range (e.g. 0-59)')
  .option('--image-format <format>', 'Intermediate frame format (png, jpeg)', 'png')
  .option('--preset <preset>', 'FFmpeg encoding preset (ultrafast, fast, medium, slow, veryslow)')
  .option('--crf <number>', 'Quality factor 0-51, lower is better', '18')
  .option('--video-encoder <encoder>', 'Video encoder (libx264, h264_videotoolbox, h264_nvenc)')
  .option('--gl <renderer>', 'GL renderer (swiftshader, egl, angle)', 'swiftshader')
  .option('--profiling', 'Enable per-frame profiling')
  .action(async (entry: string, compositionId: string, output: string, options: {
    props: string;
    codec: string;
    concurrency: string;
    frames?: string;
    imageFormat: string;
    preset?: string;
    crf: string;
    videoEncoder?: string;
    gl: string;
    profiling?: boolean;
  }) => {
    const spinner = ora('Bundling project...').start();
    const profiling = options.profiling ?? false;

    try {
      // 1. Bundle
      const bundlePath = await bundle({
        entryPoint: entry,
        onProgress: (p) => {
          if (p < 1) spinner.text = `Bundling... ${Math.round(p * 100)}%`;
        },
      });

      spinner.text = 'Fetching composition metadata...';

      // 2. Get composition info
      const inputProps = JSON.parse(options.props);
      const composition = await selectComposition(bundlePath, compositionId, inputProps);

      const totalFrames = composition.durationInFrames;
      spinner.text = `Rendering ${totalFrames} frames at ${composition.fps}fps (${composition.width}x${composition.height})...`;

      // Parse frame range
      let frameRange: [number, number] | undefined;
      if (options.frames) {
        const [start, end] = options.frames.split('-').map(Number);
        frameRange = [start, end];
      }

      // 3. Render
      const result = await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: options.codec as 'mp4' | 'webm',
        outputLocation: output,
        inputProps,
        concurrency: parseInt(options.concurrency, 10),
        frameRange,
        imageFormat: options.imageFormat as 'png' | 'jpeg',
        encodingPreset: options.preset,
        crf: parseInt(options.crf, 10),
        videoEncoder: options.videoEncoder,
        gl: options.gl as GlRenderer,
        profiling,
        onProgress: ({ progress, renderedFrames, totalFrames, avgFrameTimeMs, estimatedRemainingMs }) => {
          if (progress < 0.9) {
            let text = `Rendering frames... ${renderedFrames}/${totalFrames} (${Math.round(progress * 100)}%)`;
            if (profiling && avgFrameTimeMs != null) {
              text += ` · ~${Math.round(avgFrameTimeMs)}ms/frame`;
            }
            if (profiling && estimatedRemainingMs != null && estimatedRemainingMs > 0) {
              text += ` · ETA ${formatDuration(estimatedRemainingMs)}`;
            }
            spinner.text = text;
          } else if (progress < 1) {
            spinner.text = 'Encoding video with FFmpeg...';
          }
        },
      });

      spinner.succeed(
        `${chalk.green('Done!')} Video rendered to ${chalk.bold(output)} (${totalFrames} frames)`
      );

      if (profiling && result.profile) {
        printProfile(result.profile);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Render failed: ${(error as Error).message}`));
      process.exitCode = 1;
    } finally {
      await closeBrowser();
    }
  });

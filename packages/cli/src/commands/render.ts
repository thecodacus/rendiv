import { Command } from 'commander';
import { bundle } from '@rendiv/bundler';
import { renderMedia, selectComposition, closeBrowser } from '@rendiv/renderer';
import ora from 'ora';
import chalk from 'chalk';

export const renderCommand = new Command('render')
  .description('Render a composition to video')
  .argument('<entry>', 'Entry file (e.g. src/index.tsx)')
  .argument('<compositionId>', 'Composition ID')
  .argument('[output]', 'Output file path', 'out/video.mp4')
  .option('--props <json>', 'Input props as JSON', '{}')
  .option('--codec <codec>', 'Output codec (mp4, webm)', 'mp4')
  .option('--concurrency <n>', 'Parallel browser tabs', '1')
  .option('--frames <range>', 'Frame range (e.g. 0-59)')
  .action(async (entry: string, compositionId: string, output: string, options: {
    props: string;
    codec: string;
    concurrency: string;
    frames?: string;
  }) => {
    const spinner = ora('Bundling project...').start();

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
      await renderMedia({
        composition,
        serveUrl: bundlePath,
        codec: options.codec as 'mp4' | 'webm',
        outputLocation: output,
        inputProps,
        concurrency: parseInt(options.concurrency, 10),
        frameRange,
        onProgress: ({ progress, renderedFrames, totalFrames }) => {
          if (progress < 0.9) {
            spinner.text = `Rendering frames... ${renderedFrames}/${totalFrames} (${Math.round(progress * 100)}%)`;
          } else if (progress < 1) {
            spinner.text = 'Encoding video with FFmpeg...';
          }
        },
      });

      spinner.succeed(
        `${chalk.green('Done!')} Video rendered to ${chalk.bold(output)} (${totalFrames} frames)`
      );
    } catch (error) {
      spinner.fail(chalk.red(`Render failed: ${(error as Error).message}`));
      process.exitCode = 1;
    } finally {
      await closeBrowser();
    }
  });

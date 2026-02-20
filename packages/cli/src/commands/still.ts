import { Command } from 'commander';
import { bundle } from '@rendiv/bundler';
import { renderStill, selectComposition, closeBrowser } from '@rendiv/renderer';
import ora from 'ora';
import chalk from 'chalk';

export const stillCommand = new Command('still')
  .description('Render a single frame to an image')
  .argument('<entry>', 'Entry file (e.g. src/index.tsx)')
  .argument('<compositionId>', 'Composition ID')
  .argument('[output]', 'Output file path', 'out/still.png')
  .option('--props <json>', 'Input props as JSON', '{}')
  .option('--frame <n>', 'Frame number to render', '0')
  .option('--format <format>', 'Image format (png, jpeg)', 'png')
  .option('--quality <n>', 'JPEG quality (1-100)', '80')
  .action(async (entry: string, compositionId: string, output: string, options: {
    props: string;
    frame: string;
    format: string;
    quality: string;
  }) => {
    const spinner = ora('Bundling project...').start();

    try {
      const bundlePath = await bundle({ entryPoint: entry });

      spinner.text = 'Fetching composition metadata...';
      const inputProps = JSON.parse(options.props);
      const composition = await selectComposition(bundlePath, compositionId, inputProps);

      spinner.text = `Rendering frame ${options.frame}...`;

      await renderStill({
        serveUrl: bundlePath,
        composition,
        output,
        frame: parseInt(options.frame, 10),
        inputProps,
        imageFormat: options.format as 'png' | 'jpeg',
        quality: parseInt(options.quality, 10),
      });

      spinner.succeed(
        `${chalk.green('Done!')} Still rendered to ${chalk.bold(output)}`
      );
    } catch (error) {
      spinner.fail(chalk.red(`Render failed: ${(error as Error).message}`));
      process.exitCode = 1;
    } finally {
      await closeBrowser();
    }
  });

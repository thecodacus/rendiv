import { Command } from 'commander';
import { bundle } from '@rendiv/bundler';
import { getCompositions, closeBrowser } from '@rendiv/renderer';
import chalk from 'chalk';

export const compositionsCommand = new Command('compositions')
  .description('List all registered compositions')
  .argument('<entry>', 'Entry file (e.g. src/index.tsx)')
  .action(async (entry: string) => {
    try {
      const bundlePath = await bundle({ entryPoint: entry });
      const compositions = await getCompositions(bundlePath);

      if (compositions.length === 0) {
        console.log(chalk.yellow('No compositions found.'));
        return;
      }

      console.log(chalk.bold(`\nFound ${compositions.length} composition(s):\n`));

      for (const comp of compositions) {
        const duration = (comp.durationInFrames / comp.fps).toFixed(2);
        console.log(
          `  ${chalk.cyan(comp.id)} — ${comp.width}x${comp.height} @ ${comp.fps}fps, ${comp.durationInFrames} frames (${duration}s) [${comp.type}]`
        );
      }
      console.log();
    } catch (error) {
      console.error(chalk.red(`Error: ${(error as Error).message}`));
      process.exitCode = 1;
    } finally {
      await closeBrowser();
    }
  });

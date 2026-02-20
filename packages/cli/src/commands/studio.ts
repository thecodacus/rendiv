import { Command } from 'commander';
import chalk from 'chalk';

export const studioCommand = new Command('studio')
  .description('Start the Rendiv Studio development server')
  .argument('<entry>', 'Entry file (e.g., src/index.tsx)')
  .option('--port <number>', 'Port number', '3000')
  .action(async (entry: string, options: { port: string }) => {
    const { startStudio } = await import('@rendiv/studio');

    console.log(chalk.cyan('\n  Starting Rendiv Studio...\n'));

    const { url, close } = await startStudio({
      entryPoint: entry,
      port: parseInt(options.port, 10),
    });

    console.log(chalk.green(`  Rendiv Studio running at ${chalk.bold(url)}\n`));
    console.log(chalk.gray('  Press Ctrl+C to stop\n'));

    const shutdown = async () => {
      console.log(chalk.gray('\n  Shutting down...\n'));
      await close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

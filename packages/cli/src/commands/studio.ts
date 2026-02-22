import { Command } from 'commander';
import chalk from 'chalk';

export const studioCommand = new Command('studio')
  .description('Start the Rendiv Studio development server')
  .argument('[entry]', 'Entry file (e.g., src/index.tsx)', 'src/index.tsx')
  .option('--port <number>', 'Port number', '3000')
  .option('--host <address>', 'Host address to bind to (e.g., 0.0.0.0 for Docker)')
  .option('--workspace <path>', 'Enable workspace mode with the given root directory')
  .action(async (entry: string, options: { port: string; host?: string; workspace?: string }) => {
    const port = parseInt(options.port, 10);

    if (options.workspace) {
      // Workspace mode — manage multiple projects from the browser
      const path = await import('node:path');
      const workspaceDir = path.default.resolve(options.workspace);

      const { startStudioWorkspace } = await import('@rendiv/studio');

      console.log(chalk.cyan('\n  Starting Rendiv Studio (workspace mode)...\n'));

      const { url, close } = await startStudioWorkspace({
        workspaceDir,
        port,
        host: options.host,
      });

      console.log(chalk.green(`  Rendiv Studio running at ${chalk.bold(url)}\n`));
      console.log(chalk.gray(`  Workspace: ${workspaceDir}\n`));
      console.log(chalk.gray('  Press Ctrl+C to stop\n'));

      const shutdown = async () => {
        console.log(chalk.gray('\n  Shutting down...\n'));
        await close();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } else {
      // Single-project mode (existing behavior)
      const { startStudio } = await import('@rendiv/studio');

      console.log(chalk.cyan('\n  Starting Rendiv Studio...\n'));

      const { url, close } = await startStudio({
        entryPoint: entry,
        port,
        host: options.host,
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
    }
  });

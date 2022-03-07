import { Command } from 'commander';
import { join } from 'path';

const program = new Command();

export const run = async () => {
  program.name('elfo').description('elfo protocol CLI').version('0.1.0');

  program
    .command('config', 'configure elfo node', {
      executableFile: join(__dirname, 'commands', 'config.js'),
    })
    .command('register', 'register node', {
      executableFile: join(__dirname, 'commands', 'register.js'),
    })
    .command('monitor', 'monitor subscription', {
      executableFile: join(__dirname, 'commands', 'monitor', 'command.js'),
    })
    .command('init', 'init protocol', {
      executableFile: join(__dirname, 'commands', 'init.js'),
      hidden: true,
    });

  program.parse();
};

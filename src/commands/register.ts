import { Command } from 'commander';
import { configPathExists } from '../config/index';
import Listr from 'listr';
import { getConfig } from '../config/index';
import { NodeConfig } from '../config/index';
import { writeConfig } from '../config/index';
import { register } from '../connection/index';

const program = new Command();
program.description('register elfo node');
program.option('-d, --debug', 'output extra debugging');
program.option('-f, --force', 'force re-register');

const options = program.opts();

const tasks = new Listr([
  {
    title: 'Checking configuration file',
    task: async (ctx) => {
      const configExists = configPathExists();
      if (!configExists)
        throw new Error(
          'Elfo is not configured. Please run `elfo config` first.',
        );
      ctx.config = await getConfig();
    },
  },
  {
    title: 'Checking for existing node registration.',
    enabled: (ctx) => ctx.config,
    skip: options.force,
    task: (ctx) => {
      if (ctx.config.nodeAccount !== '')
        throw new Error(
          'Looks like you are already registered.\nTo override, run with `--force` flag.',
        );
      ctx.register = true;
    },
  },
  {
    title: 'Registering node',
    enabled: (ctx) => ctx.register,
    task: async (ctx) => {
      const cnf = ctx.config as NodeConfig;
      const node = await register(cnf);
      cnf.nodeAccount = node.toBase58();
      await writeConfig(cnf);
    },
  },
]);

const action = async () => {
  await tasks.run();
};
program
  .action(() => {
    action()
      .then(() => {
        console.log('Registration successful. ');
        console.log(
          'You can now monitor subscription plans, trigger payments and earn fees.',
        );
      })
      .catch((e) => {
        console.log('An error occurred.');
        if (options.debug) {
          console.error(e);
        }
      });
  })
  .parse();

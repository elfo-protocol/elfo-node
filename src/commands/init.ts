import { Command } from 'commander';
import { configPathExists } from '../config/index';
import Listr from 'listr';
import { getConfig } from '../config/index';
import { NodeConfig } from '../config/index';
import { init } from '../connection/index';

const program = new Command();

program.option('-d, --debug', 'output extra debugging');

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
    title: 'Initializing',
    enabled: (ctx) => ctx.config,
    task: async (ctx) => {
      const cnf = ctx.config as NodeConfig;
      await init(cnf);
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
        console.log('Init successful.');
      })
      .catch((e) => {
        console.log('An error occurred.');
        if (options.debug) {
          console.error(e);
        }
      });
  })
  .parse();

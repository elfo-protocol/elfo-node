import { Command } from 'commander';
import { configPathExists } from '../../config/index';
import Listr from 'listr';
import { getConfig } from '../../config/index';
import { NodeConfig } from '../../config/index';
import { prompt } from 'inquirer';
import { ListrTask } from 'listr';
import { PublicKey } from '@solana/web3.js';
import { monitorSubscriptionPlanTask } from './controller';
import { getSubscriptionPlanList } from './controller';

const program = new Command();
program.description('monitor subscription plans and trigger payments');
program.option(
  '-l, --list <type>',
  'a txt file with a list of subscription plan account public keys',
);
program.option('-s, --single <type>', 'a subscription plan account public key');
program.option('-, --debug', 'output extra debugging');
const options = program.opts();
const debug: boolean = options.debug;

const preTasks = new Listr([
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
    title: 'Checking if node is registered',
    enabled: (ctx) => ctx.config,
    task: async (ctx) => {
      if (ctx.config.nodeAccount === '') {
        throw new Error(
          'Your node is not registered. Please run `register` command first.',
        );
      }
      ctx.registered = true;
    },
  },
]);

const monitorTasks = new Listr([
  {
    title: 'Getting subscription list to monitor',
    task: async (ctx) => {
      ctx.list = await getSubscriptionPlanList(
        options.single ? 'single' : options.list ? 'list' : 'all',
        options.single ? options.single : options.list,
      );
    },
  },
  {
    title: 'Monitoring subscriptions',
    enabled: (ctx) => ctx.list,
    task: async (ctx, task) => {
      const subscriptionPlanList = ctx.list as PublicKey[];
      if (subscriptionPlanList.length === 0) {
        task.skip('Subscription list is empty');
      }
      const nodeConfig = ctx.config as NodeConfig;
      const subscriptionPlanTaskList: ListrTask[] = subscriptionPlanList.map(
        (subscriptionPlan) =>
          monitorSubscriptionPlanTask(subscriptionPlan, nodeConfig, debug),
      );
      return new Listr(subscriptionPlanTaskList);
    },
  },
]);

const action = async () => {
  if (options.list && options.single) {
    console.log('use only one of the --list or --single flags');
    return;
  }

  if (!options.list && !options.single) {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'all',
        message:
          'No --list --single flags given. Monitor all subscription plans?',
        default: false,
      },
    ]);

    if (!answer.all) {
      return;
    }
  }
  await preTasks.run();

  // monitor subscriptions continuously
  const monitor = async () => {
    await monitorTasks.run();
    setTimeout(await monitor, 5000);
  };
  await monitor();
};
program
  .action(() => {
    action().catch((e) => {
      console.log('An error occurred.');
      if (debug) {
        console.error(e);
      }
    });
  })
  .parse();

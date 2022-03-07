import { Command } from 'commander';
import { configPathExists } from '../config/index';
import { prompt } from 'inquirer';
import { runConfiguration } from '../config/index';

const program = new Command();
program.description('configure elfo node');
program.option('-d, --debug', 'output extra debugging');
const options = program.opts();

const action = async () => {
  const configExists = configPathExists();

  if (configExists) {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'rerun',
        message:
          'Config file already exists. Do you want to re-run configuration?',
        default: false,
      },
    ]);
    if (answer.rerun) {
      await runConfiguration();
    }
  } else {
    await runConfiguration();
  }
};

program
  .action(() => {
    action()
      .then(() => {
        console.log(
          'Configuration success. Run `elfo register` to register the node.',
        );
      })
      .catch((e) => {
        console.error('An error occurred.');
        if (options.debug) console.error(e);
      });
  })
  .parse();

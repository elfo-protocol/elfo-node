import {Command} from '@oclif/core'
import {configPathExists} from '../config/index'
import {prompt} from 'inquirer'
import {runConfiguration} from '../config/index'

export default class Config extends Command {
  static description = 'configure subrina node'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {}
  static args = []

  public async run(): Promise<void> {
    const configDir = this.config.configDir
    const configExists = configPathExists(configDir)

    if (configExists) {
      const answer = await prompt([
        {
          type: 'confirm',
          name: 'rerun',
          message:
            'Config file already exists. Do you want to re-run configuration?',
          default: false,
        },
      ])
      if (answer.rerun) {
        await runConfiguration(configDir)
      }
    } else {
      await runConfiguration(configDir)
    }
  }
}

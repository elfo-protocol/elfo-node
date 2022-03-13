import {Command, Flags} from '@oclif/core'
import {configPathExists, NodeConfig} from '../config/index'
import {getConfig} from '../config/index'
import {writeConfig} from '../config/index'
import {register} from '../connection/index'
import {loading} from '../utils/index'
import {error} from '../utils/index'
import {success} from '../utils/index'
import draftLog from '@elfo/draftlog'

export default class Register extends Command {
  static description = 'register subrina node'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --force',
  ]

  static flags = {
    force: Flags.boolean({char: 'f', description: 'force re-register'}),
    debug: Flags.boolean({
      char: 'd',
      hidden: true,
      description: 'show debug info',
    }),
  }

  static args = []

  nodeConfig: NodeConfig | undefined = undefined;

  public async run(): Promise<void> {
    draftLog(console)
    const {flags} = await this.parse(Register)

    const configFileCheckLog = console.draft(loading(2, 'Checking configuration file.'))
    const configDir = this.config.configDir
    const configExists = configPathExists(configDir)
    if (!configExists) {
      configFileCheckLog(
        error(2, 'Elfo is not configured. Please run `elfo config` first.'),
      )
      return
    }

    this.nodeConfig = await getConfig(configDir)
    configFileCheckLog(success(2, 'Configuration file found.'))

    const registerCheckLog = console.draft(loading(2, 'Checking if node is already registered.'))
    if (this.nodeConfig.nodeAccount !== '' && !flags.force) {
      registerCheckLog(error(2,
        'Looks like you are already registered.\nTo override, run with `--force` flag.',
      ))
      return
    }

    registerCheckLog(loading(2,
      'Registereing node.',
    ))
    registerCheckLog(loading(2,
      'Registering node.',
    ))

    register(this.nodeConfig)
    .then(node => {
      this.nodeConfig!.nodeAccount = node
      return writeConfig(this.nodeConfig!)
    }).then(() => {
      registerCheckLog(success(2,
        'Node registered successfully.\nYou can now moniter subscription plans, trigger payments and earn fees.',
      ))
    }).catch(error_ => {
      let errorMsg = 'Error occurred trying to register node'
      if (flags.debug) errorMsg += (`\n ${error_}`)
      registerCheckLog(error(2,
        errorMsg,
      ))
    })
  }
}

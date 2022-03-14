import {Command, Flags} from '@oclif/core'
import {configPathExists} from '../config/index'
import {getConfig} from '../config/index'
import * as fs from 'fs-extra'
import {prompt} from 'inquirer'
import randomColor from 'randomcolor'
import {NodeConfig} from '../config/index'
import {getProtocolState} from '../connection/index'
import {getSubscriptionPlan} from '../connection/index'
import {getSubscription} from '../connection/index'
import {triggerPayment} from '../connection/index'
import draftLog from '@elfo/draftlog'
import {error} from '../utils/index'
import {success} from '../utils/index'
import {skip} from '../utils/index'
import {loading} from '../utils/index'
import chalk from 'chalk'
import {indent} from '../utils/index'
import {LOG_SKIP_SYMBOL} from '../utils/index'
import {LOG_ERROR_SYMBOL} from '../utils/index'
import {LOG_LOADING_SYMBOL} from '../utils/index'
import {SubscriptionPlan} from '@elfo/sdk'
import {shorten} from '../utils/index'
import {LOG_SUCCESS_SYMBOL} from '../utils/index'

export default class Monitor extends Command {
  static description = 'monitor subscription plans and trigger payments'

  static examples = [
    '<%= config.bin %> <%= command.id %> --list ~/subscriptin-plans-to-monitor.txt',
    '<%= config.bin %> <%= command.id %> --single BJwb4SgNxDL9se5ZzZJ58ub9Adcj2XNfRs8GgVXKybyu',
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    list: Flags.string({
      char: 'l',
      description: 'a txt file with a list of subscription plan account public keys',
    }),

    single: Flags.string({
      char: 's',
      description: 'a subscription plan account public key',
    }),

    debug: Flags.boolean({
      char: 'd',
      hidden: true,
      description: 'show debug info',
    }),
  }

  static args = []

  subscriptionPlanList: string[] | undefined = undefined;
  nodeConfig: NodeConfig | undefined = undefined;

  public async run(): Promise<void> {
    draftLog(console)
    const {flags} = await this.parse(Monitor)

    if (flags.list && flags.single) {
      console.log(error(0, 'use only one of the --list or --single flags'))
      return
    }

    if (!flags.list && !flags.single) {
      const answer = await prompt([
        {
          type: 'confirm',
          name: 'all',
          message:
            'No --list --single flags given. Monitor all subscription plans?',
          default: false,
        },
      ])

      if (!answer.all) {
        return
      }
    }

    if (!await this.checkPreConditions()) return

    const monitorPlans = async () => {
      await this.runMonitorTasks(flags)
      setTimeout(monitorPlans, 5000)
    }

    await monitorPlans()
  }

  private async checkPreConditions(): Promise<boolean> {
    const configFileCheckLog = console.draft(loading(2, 'Checking configuration file.'))
    const configDir = this.config.configDir
    const configExists = configPathExists(configDir)
    if (!configExists) {
      configFileCheckLog(
        error(2, 'Elfo is not configured. Please run `elfo config` first.'),
      )
      return false
    }

    this.nodeConfig = await getConfig(configDir)
    configFileCheckLog(success(2, 'Configuration file found.'))

    const registerCheckLog = console.draft(loading(2, 'Checking if node is registered.'))

    if (this.nodeConfig!.nodeAccount === '') {
      registerCheckLog(
        error(2, 'Your node is not registered. Please run `register` command first.'),
      )
      return false
    }

    registerCheckLog(success(2, 'Node is registered.'))
    return true
  }

  private async runMonitorTasks(flags: { list: string | undefined; single: string | undefined; debug: boolean } & { json: boolean | undefined }): Promise<void> {
    const gettingSubscriptionListLog = console.draft(loading(2, 'Getting subscription list.'))
    this.getSubscriptionPlanList(
      flags.single ? 'single' : (flags.list ? 'list' : 'all'),
      flags.single ? flags.single : flags.list,
    ).then(list => {
      if (list.length === 0) {
        gettingSubscriptionListLog(error(2, 'Subscription plan list is empty.'))
      } else {
        gettingSubscriptionListLog(loading(2, 'Monitoring subscriptions.'))
      }

      for (const subscriptionPlan of list)  this.monitorSubscriptionPlan(subscriptionPlan, flags.debug)
    })
  }

  private async getSubscriptionPlanList(
    type: 'single' | 'list' | 'all',
    value: string | undefined,
  ): Promise<string[]> {
    if (this.subscriptionPlanList && type !== 'all') return this.subscriptionPlanList

    if (type === 'single') {
      this.subscriptionPlanList = [value as string]
    } else if (type === 'list') {
      const fileExists = await fs.pathExists(value as string)
      if (!fileExists) throw new Error(`File ${value} does not exist.`)
      this.subscriptionPlanList = fs
      .readFileSync(value as string)
      .toString().trim()
      .split('\n')
      .map(key => key)
    } else {
      const protocol = await getProtocolState(this.nodeConfig as NodeConfig)
      this.subscriptionPlanList = protocol.subscriptionPlanAccounts
    }

    return this.subscriptionPlanList
  }

  private monitorSubscriptionPlan(subscriptionPlanKey: string, debug: boolean) {
    const color = randomColor({
      luminosity: 'dark',
    })
    const nodeConfig = this.nodeConfig as NodeConfig

    getSubscriptionPlan(
      nodeConfig,
      subscriptionPlanKey,
    ).then(subscriptionPlanAccount => {
      const subscriptionList = subscriptionPlanAccount.subscriptionAccounts
      if (subscriptionList.length === 0) {
        console.log(
          skip(4, `Plan: ${shorten(subscriptionPlanKey)} (${subscriptionPlanAccount!.planName}) - No subscriptions in plan, Skipping.`),
        )
        return
      }

      for (const subscription of subscriptionList)  this.monitorSubscription(subscription, subscriptionPlanAccount, debug, color)
    }).catch(error_ => {
      let errorMsg = `Plan: ${shorten(subscriptionPlanKey)} - Error occurred trying to retrieve subscription plan`
      if (debug) errorMsg += (`\n ${error_}`)
      console.log(error(4, errorMsg))
    })
  }

  private monitorSubscription(subscriptionKey: string, subscriptionPlanAccount: SubscriptionPlan, debug: boolean, color: string) {
    const preText = (symbol: string) => chalk.hex(color)(`${symbol} Plan: ${shorten(subscriptionPlanAccount.publicKey)} (${subscriptionPlanAccount.planName}) - `)
    const nodeConfig = this.nodeConfig as NodeConfig
    const subscriptionLog = console.draft(indent(4, preText(LOG_LOADING_SYMBOL) + (`Subscription: ${shorten(subscriptionKey)}`)))

    getSubscription(
      nodeConfig,
      subscriptionKey,
    ).then(subscriptionAccount => {
      if (!subscriptionAccount!.isActive) {
        subscriptionLog(indent(4, preText(LOG_SKIP_SYMBOL) + (chalk.gray(`Subscription: ${shorten(subscriptionKey)} - INACTIVE, skipping`))))
        return
      }

      const currentTimestamp = Math.round(Date.now() / 1000)
      if (subscriptionAccount!.nextPaymentTimestamp > currentTimestamp) {
        subscriptionLog(indent(4, preText(LOG_SKIP_SYMBOL) + (chalk.gray(`Subscription: ${shorten(subscriptionKey)} - Next Billing not reached.`))))
        return
      }

      triggerPayment(nodeConfig, subscriptionKey)
      .then(() => {
        subscriptionLog(indent(4, preText(LOG_SUCCESS_SYMBOL) + (chalk.green(`Subscription: ${shorten(subscriptionKey)} - SUCCESS.`))))
      }).catch(error_ => {
        let errorMsg = `Subscription: ${shorten(subscriptionKey)} - Error occurred trying to trigger payment.}`
        if (debug) errorMsg += (`\n ${error_}`)
        subscriptionLog(indent(4, preText(LOG_ERROR_SYMBOL) + (chalk.red(`${errorMsg}`))))
      })
    }).catch(error_ => {
      let errorMsg = `Subscription: ${shorten(subscriptionKey)} - Error occurred trying to retrieve subscription account}`
      if (debug) errorMsg += (`\n ${error_}`)
      subscriptionLog(indent(4, preText(LOG_ERROR_SYMBOL) + (chalk.red(`${errorMsg}`))))
    })
  }
}

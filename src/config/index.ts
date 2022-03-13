import {homedir} from 'node:os'
import {join} from 'node:path'
import * as fs from 'fs-extra'
import {Question, prompt} from 'inquirer'
import * as anchor from '@project-serum/anchor'
import path from 'node:path'

const {Keypair} = anchor.web3

export interface NodeConfig {
  keyPairPath: string;
  rewardAccount: string;
  nodeAccount: string;
}

export const getConfigPath = (): string => {
  return join(homedir(), '.config', 'elfo', 'config.json')
}

export const configPathExists = (configDir: string): boolean => {
  return fs.pathExistsSync(join(configDir, 'config.json'))
}

export const getConfig = async (configDir: string): Promise<NodeConfig> => {
  return (await fs.readJSON(path.join(configDir, 'config.json'))) as NodeConfig
}

export const writeConfig = async (config: NodeConfig): Promise<void> => {
  const configPath = getConfigPath()
  const dirExists = await fs.pathExists(configPath)

  if (!dirExists) {
    fs.mkdirpSync(join(configPath, '..'))
  }

  fs.writeJSONSync(configPath, config)
}

export const runConfiguration = async (configDir: string): Promise<void> => {
  const solanaDefaultKeyPairPath = path.join(configDir, '..', 'solana/id.json')
  const solanaDefaultKeyPairExists = await fs.pathExists(solanaDefaultKeyPairPath)

  const questions: Question[] = [
    {
      type: 'input',
      name: 'keyPairPath',
      message: "What's the location of the solana keypair?",
      validate(path) {
        return fs.pathExists(path)
      },
      default: () => {
        if (solanaDefaultKeyPairExists) {
          return solanaDefaultKeyPairPath
        }

        return ''
      },
    },
    {
      type: 'input',
      name: 'rewardWallet',
      message: "What's the wallet address to recieve (USDC) rewards?",
      default: async (answers: { keyPairPath: string }) => {
        const id = await fs.readJSON(answers.keyPairPath)
        const bytes = Uint8Array.from(id)
        const keyPair = Keypair.fromSecretKey(bytes)
        return keyPair.publicKey
      },
    },
  ]

  const answers = await prompt(questions)

  const config: NodeConfig = {
    keyPairPath: answers.keyPairPath,
    nodeAccount: '',
    rewardAccount: answers.rewardWallet,
  }

  await writeConfig(config)
}

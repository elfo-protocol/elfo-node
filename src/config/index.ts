import { homedir } from 'os';
import { join } from 'path';
import * as fs from 'fs-extra';
import { Question, prompt } from 'inquirer';
import { Keypair } from '@solana/web3.js';

export interface NodeConfig {
  keyPairPath: string;
  rewardAccount: string;
  nodeAccount: string;
}

export const getConfigPath = () => {
  return join(homedir(), '.config', 'subrina', 'config.json');
};

export const configPathExists = () => {
  return fs.pathExistsSync(getConfigPath());
};

export const getConfig = async (): Promise<NodeConfig> => {
  return (await fs.readJSON(getConfigPath())) as NodeConfig;
};

export const writeConfig = async (config: NodeConfig): Promise<void> => {
  const configPath = getConfigPath();
  const dirExists = await fs.pathExists(configPath);

  if (!dirExists) {
    fs.mkdirpSync(join(configPath, '..'));
  }

  fs.writeJSONSync(configPath, config);
};

export const runConfiguration = async (): Promise<void> => {
  const solanaDefaultKeyPairPath = join(
    homedir(),
    '.config',
    'solana',
    'id.json',
  );
  const solanaDefaultKeyPairExists = await fs.pathExists(
    solanaDefaultKeyPairPath,
  );

  const questions: Question[] = [
    {
      type: 'input',
      name: 'keyPairPath',
      message: "What's the location of the solana keypair?",
      validate(path) {
        // todo: more validation
        return fs.pathExists(path);
      },
      default: () => {
        if (solanaDefaultKeyPairExists) {
          return solanaDefaultKeyPairPath;
        }
        return '';
      },
    },
    {
      type: 'input',
      name: 'rewardWallet',
      message: "What's the wallet address to recieve (USDC) rewards?",
      default: async (answers: { keyPairPath: string }) => {
        const id = await fs.readJSON(answers.keyPairPath);
        const bytes = Uint8Array.from(id);
        const keyPair = Keypair.fromSecretKey(bytes);
        return keyPair.publicKey;
      },
    },
  ];

  const answers = await prompt(questions);

  const config: NodeConfig = {
    keyPairPath: answers.keyPairPath,
    nodeAccount: '',
    rewardAccount: answers.rewardWallet,
  };

  await writeConfig(config);
};

import * as fs from 'fs-extra'
import {Provider, Wallet} from '@project-serum/anchor'
import {NodeConfig} from '../config/index'
import {ENDPOINT} from './constants'
import {registerNode, triggerPayment as trigger} from '@elfo/sdk'
import {Subscription} from '@elfo/sdk'
import {SubscriptionPlan} from '@elfo/sdk'
import {ProtocolState} from '@elfo/sdk'
import * as anchor from '@project-serum/anchor'
const {Connection, Keypair} = anchor.web3

let _provider: Provider | undefined
let _keyPair: anchor.web3.Keypair

export const getProvider = async (config: NodeConfig): Promise<Provider> => {
  if (_provider) return _provider
  const keyPair = await getKeyPair(config)
  _provider = new Provider(
    new Connection(ENDPOINT),
    new Wallet(keyPair),
    Provider.defaultOptions(),
  )
  return _provider
}

export const getKeyPair = async (config: NodeConfig): Promise<anchor.web3.Keypair> => {
  if (_keyPair) return _keyPair
  const id = await fs.readJSON(config.keyPairPath)
  const bytes = Uint8Array.from(id)
  _keyPair = Keypair.fromSecretKey(bytes)
  return _keyPair
}

export const register = async (config: NodeConfig): Promise<string> => {
  const provider = await getProvider(config)
  return registerNode(provider, config.rewardAccount)
}

export const getSubscriptionPlan = async (
  config: NodeConfig,
  subscriptinPlan: string,
): Promise<SubscriptionPlan> => {
  const provider = await getProvider(config)
  return SubscriptionPlan.from(subscriptinPlan, provider)
}

export const getSubscription = async (
  config: NodeConfig,
  subscriptinPlan: string,
): Promise<Subscription> => {
  const provider = await getProvider(config)
  return Subscription.from(subscriptinPlan, provider)
}

export const getProtocolState = async (
  config: NodeConfig,
): Promise<ProtocolState> => {
  const provider = await getProvider(config)
  return ProtocolState.fetch(provider)
}

export const triggerPayment = async (
  config: NodeConfig,
  subscriptin: string,
): Promise<void> => {
  const provider = await getProvider(config)
  await trigger(provider, subscriptin)
}

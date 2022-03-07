import { PublicKey } from '@solana/web3.js';
import { ListrContext } from 'listr';
import { ListrTaskWrapper } from 'listr';
import { getSubscription } from '../../connection/index';
import { NodeConfig } from '../../config/index';
import { triggerPayment } from '../../connection/index';
import { ListrTask } from 'listr';
import { Subscription } from '@elfo/sdk';
import { getSubscriptionPlan } from '../../connection/index';
import { SubscriptionPlan } from '@elfo/sdk';

export const monitorSubscriptionPlanTask = (
  subscriptionPlanKey: PublicKey,
  nodeConfig: NodeConfig,
  debug: boolean,
) => {
  const task: ListrTask = {
    title: `Plan: ${subscriptionPlanKey.toBase58()}`,
    task: async (
      _subscriptionPlanContext: ListrContext,
      subscriptionPlanTask: ListrTaskWrapper,
    ) => {
      let subscriptionPlanAccount: SubscriptionPlan;
      try {
        subscriptionPlanAccount = await getSubscriptionPlan(
          nodeConfig,
          subscriptionPlanKey,
        );
      } catch (e) {
        const errorMsg = `Error occurred trying to retrieve subscription plan: ${subscriptionPlanKey.toBase58()}`;
        subscriptionPlanTask.skip(
          debug ? errorMsg.concat(`\n ${e}`) : errorMsg,
        );
      }
      const subscriptionList = subscriptionPlanAccount.subscriptionAccounts;
      if (subscriptionList.length == 0) {
        subscriptionPlanTask.skip(
          `No subscriptions in plan: ${subscriptionPlanKey.toBase58()}, (${
            subscriptionPlanAccount.planName
          })`,
        );
      }

      const subscriptionTaskList: ListrTask[] = subscriptionList.map(
        (subscriptionKey) =>
          monitorSubscriptionTask(subscriptionKey, nodeConfig, debug),
      );

      return subscriptionTaskList;
    },
  };
  return task;
};

export const monitorSubscriptionTask = (
  subscriptionKey: PublicKey,
  nodeConfig: NodeConfig,
  debug: boolean,
) => {
  const task: ListrTask = {
    title: `Subscription: ${subscriptionKey.toBase58()}`,
    task: async (
      _subscriptionContext: ListrContext,
      subscriptionTask: ListrTaskWrapper,
    ) => {
      let subscriptionAccount: Subscription;
      try {
        subscriptionAccount = await getSubscription(
          nodeConfig,
          subscriptionKey,
        );
      } catch (e) {
        const errorMsg = `Error occurred trying to retrieve subscription: ${subscriptionKey.toBase58()}`;
        subscriptionTask.skip(debug ? errorMsg.concat(`\n ${e}`) : errorMsg);
      }

      if (!subscriptionAccount.isActive) {
        subscriptionTask.skip('Subscription inactive. Skipping.');
      }

      const currentTimestamp = Math.round(Date.now() / 1000);
      if (subscriptionAccount.nextPaymentTimestamp > currentTimestamp) {
        subscriptionTask.skip(
          'Next billing timestamp is not reached. Skipping.',
        );
      }

      return triggerPayment(nodeConfig, subscriptionKey).catch((error) =>
        subscriptionTask.skip(`Error occurred: ${error}`),
      );
    },
  };

  return task;
};

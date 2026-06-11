import { InjectionToken, ModuleMetadata } from '@nestjs/common';
import { EmitterWebhookEventName } from '@octokit/webhooks';
import { HandlerFunction } from '@octokit/webhooks/types';

export const WebhookHandler = Symbol('WebhookHandler');
// eslint-disable-next-line no-redeclare
export interface WebhookHandler {
  on<E extends EmitterWebhookEventName>(
    event: E,
    callback: HandlerFunction<E, unknown>,
  ): void;
}

export const WebhookConfig = Symbol('WebhookConfig');
// eslint-disable-next-line no-redeclare
export interface WebhookConfig {
  webhookSecret: string;
}

export const WebhookModuleOptions = Symbol('WebhookModuleOptions');
// eslint-disable-next-line no-redeclare
export interface WebhookModuleOptions {
  webhookConfig: WebhookConfig;
}

export interface WebhookModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[];
  useFactory: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<WebhookModuleOptions> | WebhookModuleOptions;
}

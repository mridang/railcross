/**
 * @file Injection tokens, configuration types and the handler contract for GitHub webhooks.
 */
import type { InjectionToken, ModuleMetadata } from '@nestjs/common';
import type { EmitterWebhookEventName } from '@octokit/webhooks';
import type { HandlerFunction } from '@octokit/webhooks/types';

const WebhookHandlerToken = Symbol('WebhookHandler');
export { WebhookHandlerToken as WebhookHandler };
export interface WebhookHandler {
  on<E extends EmitterWebhookEventName>(
    event: E,
    handler: HandlerFunction<E>,
  ): void;
}

const WebhookConfigToken = Symbol('WebhookConfig');
export { WebhookConfigToken as WebhookConfig };
export interface WebhookConfig {
  webhookSecret: string;
}

const WebhookModuleOptionsToken = Symbol('WebhookModuleOptions');
export { WebhookModuleOptionsToken as WebhookModuleOptions };
export interface WebhookModuleOptions {
  webhookConfig: WebhookConfig;
}

export interface WebhookModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: InjectionToken[];
  useFactory: (
    ...args: never[]
  ) => Promise<WebhookModuleOptions> | WebhookModuleOptions;
}

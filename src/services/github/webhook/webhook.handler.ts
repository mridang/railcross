/**
 * @file Default webhook handler that verifies signatures with the app secret and registers event callbacks.
 */
import { EmitterWebhookEventName, Webhooks } from '@octokit/webhooks';
import { WebhookConfig, WebhookHandler } from './webhook.interfaces.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { HandlerFunction } from '@octokit/webhooks/types';

@Injectable()
export class DefaultWebhookHandler implements WebhookHandler {
  private readonly logger = new Logger(DefaultWebhookHandler.name);
  readonly webhooks: Webhooks;

  constructor(@Inject(WebhookConfig) readonly webhookConfig: WebhookConfig) {
    this.webhooks = new Webhooks({ secret: webhookConfig.webhookSecret });
  }

  /**
   * Registers a handler for one kind of GitHub webhook event.
   * @param event - The webhook event name, such as `push`.
   * @param handler - The function to run when that event arrives.
   * @example
   * ```ts
   * handler.on('installation', async ({ payload }) => {
   *   console.log(payload.action);
   * });
   * ```
   */
  on<E extends EmitterWebhookEventName>(
    event: E,
    handler: HandlerFunction<E, unknown>,
  ) {
    this.logger.log(`Registered handler for ${event}`);
    this.webhooks.on(event, handler);
  }
}

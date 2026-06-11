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

  on<E extends EmitterWebhookEventName>(
    event: E,
    callback: HandlerFunction<E, unknown>,
  ) {
    this.logger.log(`Registered handler for ${event}`);
    this.webhooks.on(event, callback);
  }
}

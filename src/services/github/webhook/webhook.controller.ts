import {
  BadRequestException,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from '@mridang/nestjs-defaults';
import { WebhookEventName } from '@octokit/webhooks-types';
import { WebhookConfig, WebhookHandler } from './webhook.interfaces.js';
import { Webhooks } from '@octokit/webhooks';

@Controller('hook')
export class WebhookController {
  private readonly logger: Logger = new Logger(WebhookController.name);

  constructor(
    @Inject(WebhookConfig)
    readonly webhookConfig: WebhookConfig,
    @Inject(WebhookHandler)
    private readonly webhookHandler: WebhookHandler & { webhooks: Webhooks },
  ) {
    //
  }

  private static getPayload(request: Request): Promise<string> | null {
    if ('body' in request) {
      if (
        typeof request.body === 'object' &&
        'rawBody' in request &&
        request.rawBody instanceof Buffer
      ) {
        return Promise.resolve(request.rawBody.toString('utf8'));
      } else {
        return Promise.resolve(request.body);
      }
    } else {
      return null;
    }
  }

  @Post()
  async handleWebhook(@Req() request: RawBodyRequest<Request>) {
    const id = request.headers['x-github-delivery'];
    if (id !== null && id !== undefined) {
      const name = request.headers['x-github-event'];
      if (name !== null && name !== undefined) {
        const signature =
          ([] as string[])
            .concat(
              request.headers['x-hub-signature-256'] ||
                request.headers['x-hub-signature'] ||
                [],
            )
            .join('|') || null;
        if (signature !== null && signature !== undefined) {
          const payload = await WebhookController.getPayload(request);
          if (payload !== null && payload !== undefined) {
            if (await this.webhookHandler.webhooks.verify(payload, signature)) {
              this.logger.log(`Received a webhook for event ${name}`);
              await this.webhookHandler.webhooks.verifyAndReceive({
                id: Array.isArray(id) ? id.join('|') : id,
                signature: signature,
                payload,
                name: name as WebhookEventName,
              });
            } else {
              throw new BadRequestException('Invalid signature or payload');
            }
          } else {
            throw new BadRequestException('Missing webhook request body');
          }
        } else {
          throw new BadRequestException('Missing x-hub-signature-256 header');
        }
      } else {
        throw new BadRequestException('Missing x-github-event header');
      }
    } else {
      throw new BadRequestException('Missing x-github-delivery header');
    }
  }
}

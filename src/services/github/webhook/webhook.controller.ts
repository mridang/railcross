/**
 * @file HTTP entry point that verifies and dispatches GitHub webhook deliveries.
 */
import {
  BadRequestException,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { WebhookEventName } from '@octokit/webhooks-types';
import { Webhooks } from '@octokit/webhooks';
import { setErrorContext } from '../../../utils/observability/context.js';
import { WebhookConfig, WebhookHandler } from './webhook.interfaces.js';
import type { Request } from '@mridang/nestjs-defaults';
import type { RawBodyRequest } from '@nestjs/common';

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
      return typeof request.body === 'object' &&
        'rawBody' in request &&
        request.rawBody instanceof Buffer
        ? Promise.resolve(request.rawBody.toString('utf8'))
        : Promise.resolve(request.body);
    }
    return null;
  }

  /**
   * Reads the numeric id at `payload[key].id`, if the payload has one.
   *
   * Invalid JSON, a missing property and a non-numeric id all give `undefined`.
   * @param payload - The raw JSON text of the webhook payload.
   * @param key - The top-level payload property to read, such as `installation`.
   * @returns The numeric id, or `undefined` when the payload has none.
   * @example
   * ```ts
   * WebhookController.numericId('{"installation":{"id":42}}', 'installation'); // 42
   * ```
   */
  private static numericId(payload: string, key: string): number | undefined {
    try {
      const id = (JSON.parse(payload) as Record<string, { id?: unknown }>)[key]
        ?.id;
      return typeof id === 'number' ? id : undefined;
    } catch {
      return undefined;
    }
  }

  @Post()
  async handleWebhook(@Req() request: RawBodyRequest<Request>) {
    const id = request.headers['x-github-delivery'];
    if (id === undefined) {
      throw new BadRequestException('Missing x-github-delivery header');
    }
    const name = request.headers['x-github-event'];
    if (name === undefined) {
      throw new BadRequestException('Missing x-github-event header');
    }
    await setErrorContext({
      'webhook.event': Array.isArray(name) ? name.join('|') : name,
      'webhook.delivery_id': Array.isArray(id) ? id.join('|') : id,
    });
    const rawSignature =
      request.headers['x-hub-signature-256'] ||
      request.headers['x-hub-signature'] ||
      [];
    const signatureParts = Array.isArray(rawSignature)
      ? rawSignature
      : [rawSignature];
    const signature = signatureParts.join('|') || null;
    if (signature === null) {
      throw new BadRequestException('Missing x-hub-signature-256 header');
    }
    const payload = await WebhookController.getPayload(request);
    // eslint-disable-next-line sonarjs/different-types-comparison -- the body can be undefined at runtime although its type says string
    if (payload === null || payload === undefined) {
      throw new BadRequestException('Missing webhook request body');
    }
    if (!(await this.webhookHandler.webhooks.verify(payload, signature))) {
      throw new BadRequestException('Invalid signature or payload');
    }
    await setErrorContext({
      'github.installation_id': WebhookController.numericId(
        payload,
        'installation',
      ),
      'github.repository_id': WebhookController.numericId(
        payload,
        'repository',
      ),
    });
    this.logger.log(`Received a webhook for event ${String(name)}`);
    await this.webhookHandler.webhooks.verifyAndReceive({
      id: Array.isArray(id) ? id.join('|') : id,
      signature,
      payload,
      name: name as WebhookEventName,
    });
  }
}

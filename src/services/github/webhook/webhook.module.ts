import { DynamicModule, Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller.js';
import {
  WebhookConfig,
  WebhookHandler,
  WebhookModuleAsyncOptions,
  WebhookModuleOptions,
} from './webhook.interfaces.js';
import { DefaultWebhookHandler } from './webhook.handler.js';

@Module({})
export class WebhookModule {
  static registerAsync(options: WebhookModuleAsyncOptions): DynamicModule {
    return {
      module: WebhookModule,
      imports: [
        //
      ],
      controllers: [WebhookController],
      providers: [
        {
          provide: WebhookModuleOptions,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        DefaultWebhookHandler,
        {
          provide: WebhookHandler,
          useExisting: DefaultWebhookHandler,
        },
        {
          provide: WebhookConfig,
          useFactory: (_: WebhookModuleOptions) => _.webhookConfig,
          inject: [WebhookModuleOptions],
        },
      ],
      exports: [WebhookHandler],
    };
  }
}

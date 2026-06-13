import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './authen/auth.module.js';
import { OctokitModule } from './octokit/octokit.module.js';
import { WebhookModule } from './webhook/webhook.module.js';

@Module({
  controllers: [
    //
  ],
  providers: [
    //
  ],
  imports: [
    OctokitModule,
    AuthModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          authConfig: {
            clientId: configService.getOrThrow('GITHUB_CLIENT_ID'),
            clientSecret: configService.getOrThrow('GITHUB_CLIENT_SECRET'),
          },
          authTTL: 60 * 60,
        };
      },
      inject: [ConfigService],
    }),
    WebhookModule.registerAsync({
      useFactory: async (configService: ConfigService, webhookHandler) => {
        return {
          webhookConfig: {
            webhookSecret: configService.getOrThrow('GITHUB_WEBHOOK_SECRET'),
          },
          webhookHandler,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [WebhookModule],
})
export class GithubModule {
  //
}

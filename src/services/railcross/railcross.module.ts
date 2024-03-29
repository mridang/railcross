import { HttpStatus, Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import ProtectionService from './protection.service';
import SchedulerService from './scheduler.service';
import { roleName, scheduleGroup, secretName } from '../../constants';
import { createProbot } from 'probot';
import RailcrossProbot from './probot.handler';
import ProbotHandler from './probot.handler';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { SetupController } from './setup.controller';
import RailcrossService from './railcross.service';
import { retry } from '@octokit/plugin-retry';
import path from 'path';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import GithubConfig from '../github/github.config';
import { GithubModule } from '../github/github.module';

const MyOctokit = Octokit.plugin(retry);

@Module({
  controllers: [WebhookController, SetupController],
  providers: [
    ProtectionService,
    SchedulerService,
    RailcrossService,
    RailcrossProbot,
    {
      provide: 'ENV_PATH',
      useValue: process.env.ENV_PATH || path.resolve(process.cwd(), '.env'),
    },
    {
      provide: 'SECRETS_MANAGER_CLIENT',
      useFactory: () => {
        return new SecretsManagerClient();
      },
    },
    {
      inject: [GithubConfig, ProbotHandler],
      provide: 'PROBOT',
      useFactory: async (
        githubConfig: GithubConfig,
        probotHandler: ProbotHandler,
      ) => {
        const secret = await githubConfig.getSecret(secretName);

        const probot = createProbot({
          overrides: {
            ...secret,
          },
        });

        await probot.load(probotHandler.init());

        return probot;
      },
    },
    {
      provide: 'SCHEDULER_CLIENT',
      useFactory: () => {
        return new SchedulerClient({
          maxAttempts: 10,
        });
      },
    },
    {
      provide: 'SCHEDULER_GROUP',
      useFactory: () => {
        return scheduleGroup;
      },
    },
    {
      provide: 'SCHEDULER_ROLE',
      useFactory: () => {
        return `arn:aws:iam::${process.env.ACCOUNT_ID}:role/${roleName}`;
      },
    },
    {
      inject: [GithubConfig],
      provide: 'GITHUB_FN',
      useFactory: async (githubConfig: GithubConfig) => {
        const secret = await githubConfig.getSecret(secretName);

        return (installationId: number) => {
          return new MyOctokit({
            authStrategy: createAppAuth,
            auth: {
              appId: secret.appId,
              privateKey: secret.privateKey,
              installationId: installationId,
            },
            retry: {
              doNotRetry: [
                HttpStatus.BAD_REQUEST,
                HttpStatus.UNAUTHORIZED,
                HttpStatus.FORBIDDEN,
                HttpStatus.NOT_FOUND,
                HttpStatus.UNPROCESSABLE_ENTITY,
                HttpStatus.TOO_MANY_REQUESTS,
              ],
            },
          });
        };
      },
    },
  ],
  imports: [GithubModule],
  exports: [
    //
  ],
})
export class RailcrossModule {
  //
}

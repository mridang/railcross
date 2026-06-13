import { FetchImpl } from '@mridang/nestjs-defaults';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { Module } from '@nestjs/common';
import { retry } from '@octokit/plugin-retry';
import { OctokitImpl } from './types.js';

@Module({
  controllers: [
    //
  ],
  providers: [
    {
      provide: OctokitImpl,
      useFactory: async (
        configService: ConfigService,
        fetchImpl: typeof FetchImpl,
      ) => {
        return (accessTokenOrInstallationId: string | number) => {
          return new (Octokit.plugin(retry))(
            typeof accessTokenOrInstallationId === 'string'
              ? {
                  auth: accessTokenOrInstallationId,
                  request: {
                    fetch: fetchImpl,
                  },
                }
              : {
                  authStrategy: createAppAuth,
                  auth: {
                    appId: configService.getOrThrow('GITHUB_APP_ID'),
                    privateKey: configService
                      .getOrThrow('GITHUB_PRIVATE_KEY')
                      .replaceAll('&', '\n'),
                    installationId: accessTokenOrInstallationId,
                  },
                  request: {
                    fetch: fetchImpl,
                  },
                },
          );
        };
      },
      inject: [ConfigService, FetchImpl],
    },
  ],
  imports: [ConfigModule],
  exports: [OctokitImpl],
})
export class OctokitModule {
  //
}

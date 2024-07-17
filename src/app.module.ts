import {
  Global,
  HttpException,
  HttpStatus,
  MiddlewareConsumer,
  Module,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import path, { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HttpModule } from '@nestjs/axios';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import getSecret from './utils/secrets';
import { secretName } from './constants';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RailcrossModule } from './services/railcross/railcross.module';
import { GithubModule } from './services/github/github.module';
import { ClsModule } from 'nestjs-cls';
import { TimingInterceptor } from './timing.interceptor';
import { BetterLogger } from './logger';
import { RequestIdMiddleware } from './correlation.middleware';

@Global()
@Module({
  imports: [
    GithubModule,
    RailcrossModule,
    ClsModule.forRoot({
      global: true,
    }),
    HttpModule,
    SentryModule.forRootAsync({
      useFactory: async (secretsManagerClient: SecretsManagerClient) => {
        if (process.env.SENTRY_DSN) {
          return {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            enabled: !['development', 'test'].includes(
              process.env.NODE_ENV || '',
            ),
            logLevels: ['debug'],
          };
        } else {
          const secretValue = await getSecret(secretName, secretsManagerClient);
          const sentryDSN = JSON.parse(secretValue) as { SENTRY_DSN: string };
          return {
            dsn: new URL(sentryDSN.SENTRY_DSN).toString(),
            environment: process.env.NODE_ENV || 'development',
            enabled: !['development', 'test'].includes(
              process.env.NODE_ENV || '',
            ),
            logLevels: ['debug'],
          };
        }
      },
      inject: ['SECRETS_MANAGER_CLIENT'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    BetterLogger,
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
      provide: APP_INTERCEPTOR,
      useClass: TimingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) =>
                HttpStatus.INTERNAL_SERVER_ERROR > exception.getStatus(),
            },
          ],
        }),
    },
  ],
  exports: ['ENV_PATH', 'SECRETS_MANAGER_CLIENT'],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

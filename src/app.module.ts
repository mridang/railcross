import { Global, Module } from '@nestjs/common';
import { secretName } from './constants.js';
import { RailcrossModule } from './services/railcross/railcross.module.js';
import { GithubModule } from './services/github/github.module.js';
import { DefaultsModule } from '@mridang/nestjs-defaults';
import { HomeController } from './home/home.controller.js';

@Global()
@Module({
  imports: [
    DefaultsModule.register({
      configName: secretName,
      // On Workers, config comes from the Worker env (populated into
      // process.env by nodejs_compat), never AWS Secrets Manager.
      secrets: {},
      assets: false,
      sentry: false,
    }),
    GithubModule,
    RailcrossModule,
  ],
  controllers: [HomeController],
  providers: [
    //
  ],
  exports: [
    //
  ],
})
export class AppModule {
  //
}

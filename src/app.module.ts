import { Global, Module } from '@nestjs/common';
import { RailcrossModule } from './services/railcross/railcross.module.js';
import { GithubModule } from './services/github/github.module.js';
import { DefaultsModule } from '@mridang/nestjs-defaults';
import { HomeController } from './home/home.controller.js';

@Global()
@Module({
  imports: [
    // On Workers, config comes from the Worker env (populated into process.env
    // by nodejs_compat), so the default env-backed secrets source is correct.
    DefaultsModule.register({
      assets: false,
      sentry: true,
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

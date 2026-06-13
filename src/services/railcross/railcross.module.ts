import { Module } from '@nestjs/common';
import { env } from 'cloudflare:workers';
import ProtectionService from './protection.service.js';
import SchedulerService from './scheduler.service.js';
import { SetupController } from './setup.controller.js';
import RailcrossService from './railcross.service.js';
import { GithubModule } from '../github/github.module.js';
import { OctokitModule } from '../github/octokit/octokit.module.js';
import ProbotHandler from './probot.handler.js';

@Module({
  controllers: [SetupController],
  providers: [
    ProbotHandler,
    ProtectionService,
    SchedulerService,
    RailcrossService,
    {
      provide: 'SCHEDULES_KV',
      useFactory: () => env.SCHEDULES,
    },
    {
      provide: 'SCHEDULE_ALARMS',
      useFactory: () => env.SCHEDULE_ALARMS,
    },
  ],
  imports: [OctokitModule, GithubModule],
  exports: [
    //
  ],
})
export class RailcrossModule {
  //
}

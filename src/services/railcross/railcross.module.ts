import { Module } from '@nestjs/common';
import ProtectionService from './protection.service';
import SchedulerService from './scheduler.service';
import { roleName, scheduleGroup } from '../../constants';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { SetupController } from './setup.controller';
import RailcrossService from './railcross.service';
import { GithubModule } from '../github/github.module';
import { OctokitModule } from '../github/octokit/octokit.module';
import ProbotHandler from './probot.handler';

@Module({
  controllers: [SetupController],
  providers: [
    ProbotHandler,
    ProtectionService,
    SchedulerService,
    RailcrossService,
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
  ],
  imports: [OctokitModule, GithubModule],
  exports: [
    //
  ],
})
export class RailcrossModule {
  //
}

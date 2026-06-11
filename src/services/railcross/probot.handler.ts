import { WebhookHandler } from '../github/webhook/webhook.interfaces.js';
import SchedulerService from './scheduler.service.js';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export default class ProbotHandler {
  constructor(
    readonly schedulerService: SchedulerService,
    @Inject(WebhookHandler)
    readonly webhookHandler: WebhookHandler,
  ) {
    const logger = new Logger(ProbotHandler.name);

    this.webhookHandler.on(
      'installation_repositories.removed',
      async (context) => {
        const { id: installationId, account } = context.payload.installation;
        const owner =
          account && 'login' in account
            ? account.login
            : (account?.slug ?? 'unknown');
        logger.log(`Some repositories removed on @${owner}`);

        for (const repo of context.payload?.repositories_removed || []) {
          logger.log(`Removing schedules and rules for ${repo.full_name}`);
          await schedulerService.deleteSchedules(installationId, repo.id);
        }
      },
    );

    this.webhookHandler.on('installation.deleted', async (context) => {
      const { id: installationId, account } = context.payload.installation;
      const owner =
        account && 'login' in account
          ? account.login
          : (account?.slug ?? 'unknown');
      logger.log(`Some repositories removed on @${owner}`);

      logger.log(`Uninstalling schedules and rules for ${installationId}`);
      await schedulerService.deleteSchedules(installationId);
    });
  }
}

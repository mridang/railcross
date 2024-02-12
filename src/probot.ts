import { Probot } from 'probot';
import pino from 'pino';
import ProtectionService from './protection.service';
import SchedulerService from './scheduler.service';

const logger = pino({
  level: 'info',
});

const railcrossService = new ProtectionService();
const schedulerService = new SchedulerService();

export default (app: Probot) => {
  app.on('installation.created', async (context) => {
    const { id, account } = context.payload.installation;
    logger.info(`New app installation for @${account.login}`);

    for (const repo of context.payload?.repositories || []) {
      logger.info(`Configuring schedules and rules for ${repo.full_name}`)
      await schedulerService.addLockSchedules(repo.full_name, id);
      await railcrossService.toggleProtection(
        repo.full_name,
        context.octokit as any,
        true,
      );
    }
  });

  app.on('installation_repositories.added', async (context) => {
    const { id, account } = context.payload.installation;
    logger.info(`Some repositories added on @${account.login}`);

    for (const repo of context.payload?.repositories_added || []) {
      logger.info(`Adding schedules and rules for ${repo.full_name}`)
      await schedulerService.addLockSchedules(repo.full_name, id);
      await railcrossService.toggleProtection(
        repo.full_name,
        context.octokit as any,
        true,
      );
    }
  });

  app.on('installation_repositories.removed', async (context) => {
    const { id, account } = context.payload.installation;
    logger.info(`Some repositories removed on @${account.login}`);

    for (const repo of context.payload?.repositories_removed || []) {
      logger.info(`Removing schedules and rules for ${repo.full_name}`)
      await schedulerService.deleteSchedules(repo.full_name);
    }
  });

  app.on('installation.deleted', async (context) => {
    const { id, account } = context.payload.installation;
    logger.info(`Some repositories removed on @${account.login}`);

    for (const repo of context.payload?.repositories || []) {
      logger.info(`Uninstalling schedules and rules for ${repo.full_name}`)
      await schedulerService.deleteSchedules(repo.full_name);
    }
  });
};

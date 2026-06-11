import { DurableObject } from 'cloudflare:workers';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import ProtectionService from '../services/railcross/protection.service.js';
import { ScheduleConfig, nextOccurrence } from './schedule-utils.js';

/**
 * A Durable Object that fires a single lock or unlock task at a precise time.
 *
 * Each schedule (a `${installationId}.${repoId}.${taskName}` key) maps to its
 * own object via {@link DurableObjectNamespace.idFromName}, so a repository has
 * one instance for locking and one for unlocking — a Durable Object holds only
 * a single alarm. The object is the Cloudflare-native replacement for the AWS
 * EventBridge schedule that previously invoked the lock/unlock Lambdas.
 */
export class ScheduleAlarm extends DurableObject {
  /**
   * Arm the alarm to fire at a given instant for a given schedule.
   *
   * @param fireAtMs The instant to fire at, in epoch milliseconds.
   * @param config The schedule this object should act on when it fires.
   */
  async arm(fireAtMs: number, config: ScheduleConfig): Promise<void> {
    await this.ctx.storage.put('config', config);
    await this.ctx.storage.setAlarm(fireAtMs);
  }

  /**
   * Cancel any pending alarm and drop the stored schedule.
   */
  async disarm(): Promise<void> {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  /**
   * Apply the stored schedule, then re-arm for its next occurrence.
   *
   * Boots a minimal Nest application so the branch-protection toggle reuses
   * {@link ProtectionService} rather than duplicating the GitHub logic. The
   * re-arm is a backstop in case the daily cron that normally re-registers
   * alarms is ever missed.
   */
  async alarm(): Promise<void> {
    const config = await this.ctx.storage.get<ScheduleConfig>('config');
    if (!config) {
      return;
    }

    const app = await NestFactory.create(AppModule, { logger: false });
    try {
      const protection = app.get(ProtectionService);
      await protection.toggleProtection(
        config.repoName,
        config.installationId,
        config.taskName === 'locker',
      );
    } finally {
      await app.close();
    }

    await this.ctx.storage.setAlarm(
      nextOccurrence(config.hour, config.timeZone, Date.now()),
    );
  }
}

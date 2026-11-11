/**
 * @file Stores lock and unlock schedules in Workers KV and arms a Durable Object alarm for each.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  KVNamespace,
  KVNamespaceListResult,
  DurableObjectNamespace,
} from '@cloudflare/workers-types';
import { nextOccurrence } from '../../scheduler/schedule-utils.js';
import type { ScheduleConfig } from '../../scheduler/schedule-utils.js';
import { setErrorContext } from '../../utils/observability/context.js';
import type { ScheduleAlarm } from '../../scheduler/schedule-alarm.js';

/**
 * The display shape returned by {@link SchedulerService.getSchedule}.
 *
 * It mirrors the fields the setup UI previously read off an AWS schedule, so
 * the rest of the application is unchanged by the move to Cloudflare.
 */
interface ScheduleSummary {
  ScheduleExpression: string;
  ScheduleExpressionTimezone: string;
}

/**
 * Stores lock/unlock schedules in Workers KV and arms a Durable Object alarm
 * for each.
 */
@Injectable()
export default class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject('SCHEDULES_KV')
    private readonly kv: KVNamespace,
    @Inject('SCHEDULE_ALARMS')
    private readonly alarms: DurableObjectNamespace<ScheduleAlarm>,
  ) {
    //
  }

  /**
   * Builds the canonical KV key for a schedule.
   * @param installationId - The GitHub App installation id.
   * @param repoId - The repository id.
   * @param taskName - Either `locker` or `unlocker`.
   * @returns The `${installationId}.${repoId}.${taskName}` key.
   * @example
   * ```ts
   * this.keyFor(12, 34, 'locker'); // '12.34.locker'
   * ```
   */
  private keyFor(
    installationId: number,
    repoId: number,
    taskName: string,
  ): string {
    return `${installationId}.${repoId}.${taskName}`;
  }

  /**
   * Looks up a single schedule.
   * @param installationId - The GitHub App installation id.
   * @param repoId - The repository id.
   * @param taskName - Either `locker` or `unlocker`.
   * @returns The schedule summary, or `null` when none is configured.
   * @example
   * ```ts
   * const summary = await scheduler.getSchedule(12, 34, 'locker');
   * // { ScheduleExpression: 'cron(0 7 ? * * *)', ScheduleExpressionTimezone: 'Europe/London' }
   * ```
   */
  async getSchedule(
    installationId: number,
    repoId: number,
    taskName: string,
  ): Promise<ScheduleSummary | null> {
    const config = await this.kv.get<ScheduleConfig>(
      this.keyFor(installationId, repoId, taskName),
      'json',
    );
    if (!config) {
      return null;
    }
    return {
      ScheduleExpression: `cron(0 ${config.hour} ? * * *)`,
      ScheduleExpressionTimezone: config.timeZone,
    };
  }

  /**
   * Persists a schedule and arms its Durable Object alarm.
   * @param installationId - The GitHub App installation id.
   * @param repoId - The repository id.
   * @param repoName - The repository's full name (`owner/repo`).
   * @param hour - The local hour-of-day (0–23) the task fires at.
   * @param timeZone - The IANA timezone the hour is expressed in.
   * @param taskName - Either `locker` or `unlocker`.
   * @example
   * ```ts
   * await scheduler.createSchedule(12, 34, 'octo/repo', 7, 'Europe/London', 'locker');
   * ```
   */
  async createSchedule(
    installationId: number,
    repoId: number,
    repoName: string,
    hour: number,
    timeZone: string,
    taskName: string,
  ): Promise<void> {
    const config: ScheduleConfig = {
      installationId,
      repoId,
      repoName,
      hour,
      timeZone,
      taskName,
    };
    const key = this.keyFor(installationId, repoId, taskName);
    await this.kv.put(key, JSON.stringify(config));
    await this.arm(key, config);
  }

  /**
   * Deletes every schedule under an installation, optionally scoped to a repo.
   * @param installationId - The GitHub App installation id.
   * @param repoId - When given, only that repository's schedules are removed.
   * @example
   * ```ts
   * await scheduler.deleteSchedules(12, 34);
   * ```
   */
  async deleteSchedules(
    installationId: number,
    repoId?: number,
  ): Promise<void> {
    const repoPart = repoId === undefined ? '' : `${repoId}.`;
    const prefix = `${installationId}.${repoPart}`;
    let cursor: string | undefined;
    do {
      const page: KVNamespaceListResult<unknown, string> = await this.kv.list({
        prefix,
        cursor,
      });
      for (const entry of page.keys) {
        this.logger.log(`Deleting schedule "${entry.name}"`);
        await this.kv.delete(entry.name);
        await this.disarm(entry.name);
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  /**
   * Re-arms every stored schedule from KV.
   *
   * Invoked by the daily cron so alarms always reflect the current configuration.
   * @example
   * ```ts
   * await scheduler.reRegisterAll();
   * ```
   */
  async reRegisterAll(): Promise<void> {
    await setErrorContext({ 'job.name': 'schedule.reregister' });
    let cursor: string | undefined;
    do {
      const page: KVNamespaceListResult<unknown, string> = await this.kv.list({
        cursor,
      });
      for (const entry of page.keys) {
        const config = await this.kv.get<ScheduleConfig>(entry.name, 'json');
        if (config) {
          await this.arm(entry.name, config);
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  /**
   * Arms the Durable Object alarm for a schedule at its next occurrence.
   * @param key - The schedule key, used as the Durable Object name.
   * @param config - The schedule to act on.
   * @example
   * ```ts
   * await this.arm('12.34.locker', config);
   * ```
   */
  private async arm(key: string, config: ScheduleConfig): Promise<void> {
    const fireAt = nextOccurrence(config.hour, config.timeZone, Date.now());
    const stub = this.alarms.get(this.alarms.idFromName(key));
    await stub.arm(fireAt, config);
  }

  /**
   * Cancels the Durable Object alarm for a schedule.
   * @param key - The schedule key, used as the Durable Object name.
   * @example
   * ```ts
   * await this.disarm('12.34.locker');
   * ```
   */
  private async disarm(key: string): Promise<void> {
    const stub = this.alarms.get(this.alarms.idFromName(key));
    await stub.disarm();
  }
}

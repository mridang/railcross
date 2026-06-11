import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  KVNamespace,
  KVNamespaceListResult,
  DurableObjectNamespace,
} from '@cloudflare/workers-types';
import { nextOccurrence } from '../../scheduler/schedule-utils.js';
import type { ScheduleConfig } from '../../scheduler/schedule-utils.js';
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
 * for each, replacing the AWS EventBridge scheduler.
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
   * Build the canonical key for a schedule.
   *
   * @param installationId The GitHub App installation id.
   * @param repoId The repository id.
   * @param taskName Either `locker` or `unlocker`.
   * @returns The `${installationId}.${repoId}.${taskName}` key.
   */
  private keyFor(
    installationId: number,
    repoId: number,
    taskName: string,
  ): string {
    return `${installationId}.${repoId}.${taskName}`;
  }

  /**
   * Look up a single schedule.
   *
   * @param installationId The GitHub App installation id.
   * @param repoId The repository id.
   * @param taskName Either `locker` or `unlocker`.
   * @returns The schedule summary, or `null` when none is configured.
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
   * Persist a schedule and arm its Durable Object alarm.
   *
   * @param installationId The GitHub App installation id.
   * @param repoId The repository id.
   * @param repoName The repository's full name (`owner/repo`).
   * @param hour The local hour-of-day (0–23) the task fires at.
   * @param timeZone The IANA timezone the hour is expressed in.
   * @param taskName Either `locker` or `unlocker`.
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
   * Delete every schedule under an installation, optionally scoped to a repo.
   *
   * @param installationId The GitHub App installation id.
   * @param repoId When given, only that repository's schedules are removed.
   */
  async deleteSchedules(
    installationId: number,
    repoId?: number,
  ): Promise<void> {
    const prefix = `${installationId}.${repoId === undefined ? '' : `${repoId}.`}`;
    let cursor: string | undefined = undefined;
    do {
      const page: KVNamespaceListResult<unknown, string> =
        await this.kv.list({ prefix, cursor });
      for (const entry of page.keys) {
        this.logger.log(`Deleting schedule "${entry.name}"`);
        await this.kv.delete(entry.name);
        await this.disarm(entry.name);
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  /**
   * Re-arm every stored schedule from KV. Invoked by the daily cron so alarms
   * always reflect the current configuration.
   */
  async reRegisterAll(): Promise<void> {
    let cursor: string | undefined = undefined;
    do {
      const page: KVNamespaceListResult<unknown, string> =
        await this.kv.list({ cursor });
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
   * Arm the Durable Object alarm for a schedule at its next occurrence.
   *
   * @param key The schedule key, used as the Durable Object name.
   * @param config The schedule to act on.
   */
  private async arm(key: string, config: ScheduleConfig): Promise<void> {
    const fireAt = nextOccurrence(config.hour, config.timeZone, Date.now());
    const stub = this.alarms.get(this.alarms.idFromName(key));
    await stub.arm(fireAt, config);
  }

  /**
   * Cancel the Durable Object alarm for a schedule.
   *
   * @param key The schedule key, used as the Durable Object name.
   */
  private async disarm(key: string): Promise<void> {
    const stub = this.alarms.get(this.alarms.idFromName(key));
    await stub.disarm();
  }
}

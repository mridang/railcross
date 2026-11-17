/**
 * @file Tests for the schedule storage service.
 */
import { expect, describe, test, beforeEach } from '@jest/globals';
import { installFakeTracing } from '../../utils/observability/fake-tracing.js';
import SchedulerService from '../../../src/services/railcross/scheduler.service.js';
import type {
  KVNamespace,
  DurableObjectNamespace,
} from '@cloudflare/workers-types';
import type { ScheduleAlarm } from '../../../src/scheduler/schedule-alarm.js';

const fake = installFakeTracing();

class FakeKv {
  readonly store = new Map<string, string>();

  async get(key: string, type?: string): Promise<string | object | null> {
    const value = this.store.get(key);
    if (value === undefined) {
      return null;
    }
    if (type !== 'json') {
      return value;
    }
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' ? parsed : null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list({ prefix }: { prefix?: string } = {}): Promise<{
    keys: { name: string }[];
    list_complete: true;
  }> {
    const keys = [...this.store.keys()].flatMap((name) =>
      !prefix || name.startsWith(prefix) ? [{ name }] : [],
    );
    return { keys, list_complete: true };
  }
}

/** Orders schedule names the way localeCompare does by default. */
const collator = new Intl.Collator();

describe('SchedulerService (KV + Durable Object alarms)', () => {
  let kv: FakeKv;
  let armed: { name: string; fireAt: number; config: { hour: number } }[];
  let disarmed: string[];
  let alarms: DurableObjectNamespace<ScheduleAlarm>;
  let service: SchedulerService;

  beforeEach(() => {
    kv = new FakeKv();
    armed = [];
    disarmed = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DurableObjectNamespace is a Workers runtime binding with a large overloaded surface, so the fake implements only idFromName, get, arm and disarm, which is all the service calls
    alarms = {
      idFromName: (name: string) => name,
      get: (name: string) => ({
        arm: async (fireAt: number, config: { hour: number }) => {
          armed.push({ name, fireAt, config });
        },
        disarm: async () => {
          disarmed.push(name);
        },
      }),
    } as unknown as DurableObjectNamespace<ScheduleAlarm>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- KVNamespace is a Workers runtime binding with generic overloads of get, so the in-memory fake implements only the calls the service makes
    service = new SchedulerService(kv as unknown as KVNamespace, alarms);
  });

  test('createSchedule persists config and arms the alarm', async () => {
    await service.createSchedule(
      1,
      2,
      'org/repo',
      9,
      'Europe/London',
      'locker',
    );

    expect(kv.store.get('1.2.locker')).toBe(
      JSON.stringify({
        installationId: 1,
        repoId: 2,
        repoName: 'org/repo',
        hour: 9,
        timeZone: 'Europe/London',
        taskName: 'locker',
      }),
    );
    expect(armed).toHaveLength(1);
    expect(armed[0].name).toBe('1.2.locker');
    expect(armed[0].fireAt).toBeGreaterThan(Date.now());
    expect(armed[0].config.hour).toBe(9);
  });

  test('getSchedule returns the display shape or null', async () => {
    expect(await service.getSchedule(1, 2, 'locker')).toBeNull();

    await service.createSchedule(
      1,
      2,
      'org/repo',
      18,
      'America/New_York',
      'unlocker',
    );
    expect(await service.getSchedule(1, 2, 'unlocker')).toEqual({
      ScheduleExpression: 'cron(0 18 ? * * *)',
      ScheduleExpressionTimezone: 'America/New_York',
    });
  });

  test('deleteSchedules removes and disarms by prefix', async () => {
    await service.createSchedule(1, 2, 'org/a', 9, 'UTC', 'locker');
    await service.createSchedule(1, 2, 'org/a', 17, 'UTC', 'unlocker');
    await service.createSchedule(1, 3, 'org/b', 9, 'UTC', 'locker');

    await service.deleteSchedules(1, 2);

    expect(kv.store.has('1.2.locker')).toBe(false);
    expect(kv.store.has('1.2.unlocker')).toBe(false);
    expect(kv.store.has('1.3.locker')).toBe(true);
    expect(disarmed.toSorted((x, y) => collator.compare(x, y))).toEqual([
      '1.2.locker',
      '1.2.unlocker',
    ]);
  });

  test('deleting non-existent schedules is a no-op', async () => {
    await expect(service.deleteSchedules(99)).resolves.toBeUndefined();
    expect(disarmed).toHaveLength(0);
  });

  test('reRegisterAll re-arms every stored schedule', async () => {
    await service.createSchedule(1, 2, 'org/a', 9, 'UTC', 'locker');
    await service.createSchedule(1, 3, 'org/b', 17, 'UTC', 'unlocker');
    armed.length = 0;

    await service.reRegisterAll();

    expect(
      armed.map((a) => a.name).toSorted((x, y) => collator.compare(x, y)),
    ).toEqual(['1.2.locker', '1.3.unlocker']);
  });

  test('reRegisterAll names the job on the span', async () => {
    delete fake.attributes['job.name'];

    await service.reRegisterAll();

    expect(fake.attributes['job.name']).toBe('schedule.reregister');
  });
});

import { expect, jest, describe, test, beforeEach } from '@jest/globals';
import type {
  KVNamespace,
  DurableObjectNamespace,
} from '@cloudflare/workers-types';
import SchedulerService from '../../../src/services/railcross/scheduler.service.js';
import type { ScheduleAlarm } from '../../../src/scheduler/schedule-alarm.js';

class FakeKv {
  readonly store = new Map<string, string>();

  async get(key: string, type?: string): Promise<unknown> {
    const value = this.store.get(key);
    if (value === undefined) {
      return null;
    }
    return type === 'json' ? JSON.parse(value) : value;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list({
    prefix,
  }: { prefix?: string } = {}): Promise<{
    keys: { name: string }[];
    list_complete: true;
  }> {
    const keys = [...this.store.keys()]
      .filter((key) => !prefix || key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true };
  }
}

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
    service = new SchedulerService(
      kv as unknown as KVNamespace,
      alarms,
    );
  });

  test('createSchedule persists config and arms the alarm', async () => {
    await service.createSchedule(1, 2, 'org/repo', 9, 'Europe/London', 'locker');

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

    await service.createSchedule(1, 2, 'org/repo', 18, 'America/New_York', 'unlocker');
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
    expect(disarmed.sort()).toEqual(['1.2.locker', '1.2.unlocker']);
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

    expect(armed.map((a) => a.name).sort()).toEqual(['1.2.locker', '1.3.unlocker']);
  });
});

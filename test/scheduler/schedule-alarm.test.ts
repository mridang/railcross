import { expect, describe, test } from '@jest/globals';
import { cloudflareWorkersStub } from '../helpers/cloudflare-workers-stub.js';
import { installFakeTracing } from '../utils/observability/fake-tracing.js';

const fake = installFakeTracing(cloudflareWorkersStub);
const { ScheduleAlarm } = await import('../../src/scheduler/schedule-alarm.js');

describe('ScheduleAlarm', () => {
  test('alarm names the job on the span', async () => {
    const ctx = { storage: { get: async () => undefined } };
    const alarm = new ScheduleAlarm(ctx as never, {} as never);

    await alarm.alarm();

    expect(fake.attributes['job.name']).toBe('schedule.alarm');
  });
});

import { expect } from '@jest/globals';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import SchedulerService from '../../../src/services/railcross/scheduler.service';

describe('scheduler.service test', () => {
  test('that schedules are added"', async () => {
    const schedulerService = new SchedulerService(
      new SchedulerClient({
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
        tls: false,
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
      }),
      'default',
    );

    await schedulerService.deleteSchedules('foo/bar');
    expect(await schedulerService.listSchedules('foo/bar')).toMatchObject([]);

    await schedulerService.addLockSchedules('foo/bar', 1);
    expect(await schedulerService.listSchedules('foo/bar')).toMatchObject([
      {
        Arn: 'arn:aws:scheduler:us-east-1:000000000000:schedule/default/foo--bar-unlock',
        GroupName: 'default',
        Name: 'foo--bar-unlock',
        State: 'ENABLED',
        Target: {
          Arn: 'arn:aws:lambda:us-east-1:188628773952:function:railcross-test-unlocker',
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        ScheduleExpression: 'cron(0 8 ? * * *)',
        ScheduleExpressionTimezone: 'UTC',
      },
      {
        Arn: 'arn:aws:scheduler:us-east-1:000000000000:schedule/default/foo--bar-lock',
        GroupName: 'default',
        Name: 'foo--bar-lock',
        State: 'ENABLED',
        Target: {
          Arn: 'arn:aws:lambda:us-east-1:188628773952:function:railcross-test-locker',
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        ScheduleExpression: 'cron(0 16 ? * * *)',
        ScheduleExpressionTimezone: 'UTC',
      },
    ]);

    await schedulerService.updateSchedules(
      0,
      'foo/bar',
      22,
      6,
      'Europe/Helsinki',
    );
    expect(await schedulerService.listSchedules('foo/bar')).toMatchObject([
      {
        Arn: 'arn:aws:scheduler:us-east-1:000000000000:schedule/default/foo--bar-unlock',
        GroupName: 'default',
        Name: 'foo--bar-unlock',
        Target: {
          Arn: 'arn:aws:lambda:us-east-1:188628773952:function:railcross-test-unlocker',
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        ScheduleExpression: 'cron(0 6 ? * * *)',
        ScheduleExpressionTimezone: 'Europe/Helsinki',
      },
      {
        Arn: 'arn:aws:scheduler:us-east-1:000000000000:schedule/default/foo--bar-lock',
        GroupName: 'default',
        Name: 'foo--bar-lock',
        Target: {
          Arn: 'arn:aws:lambda:us-east-1:188628773952:function:railcross-test-locker',
        },
        FlexibleTimeWindow: { Mode: 'OFF' },
        ScheduleExpression: 'cron(0 22 ? * * *)',
        ScheduleExpressionTimezone: 'Europe/Helsinki',
      },
    ]);

    await schedulerService.deleteSchedules('foo/bar');
    expect(await schedulerService.listSchedules('foo/bar')).toMatchObject([]);
  });
});

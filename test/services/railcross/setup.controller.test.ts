import { jest, expect } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { cloudflareWorkersStub } from '../../helpers/cloudflare-workers-stub.js';

jest.unstable_mockModule('cloudflare:workers', cloudflareWorkersStub, {
  virtual: true,
});

const { End2EndModule } = await import('../../e2e.module.js');
const { AppModule } = await import('../../../src/app.module.js');
const { default: RailcrossService } =
  await import('../../../src/services/railcross/railcross.service.js');

const railcrossServiceMock = {
  updateSchedules: jest.fn(),
  listSchedules: jest.fn(),
};

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
    },
  ],
});

describe('setup.controller test', () => {
  beforeEach(() => {
    railcrossServiceMock.updateSchedules.mockClear();
  });

  beforeAll(async () => {
    await testModule.beforeAll((testModule) =>
      testModule
        .overrideProvider(RailcrossService)
        .useValue(railcrossServiceMock),
    );
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  test('that the setup page renders correctly', async () => {
    const jwtService = testModule.app.get(JwtService);
    railcrossServiceMock.listSchedules.mockResolvedValue([] as never);

    await request(testModule.app.getHttpServer())
      .get('/app')
      .set(
        'Cookie',
        `jwt=${jwtService.sign(
          {
            installationIds: [1, 2],
            accessToken: 'token',
          },
          {
            subject: 'mridang',
            issuer: 'jest',
            audience: ['mridang/testing'],
          },
        )}`,
      )
      .expect(HttpStatus.OK);
  });

  test('/POST setup should create schedule and invoke updateSchedules', async () => {
    const jwtService = testModule.app.get(JwtService);
    const scheduleDto = {
      lock_time: 22,
      unlock_time: 2,
      timezone: 'Asia/Bangkok',
    };
    railcrossServiceMock.updateSchedules.mockResolvedValue(null as never); // Assuming updateSchedules doesn't return anything

    await request(testModule.app.getHttpServer())
      .post('/app/setup')
      .set(
        'Cookie',
        `jwt=${jwtService.sign(
          {
            installationIds: [1, 2],
            accessToken: 'token',
          },
          {
            subject: 'mridang',
            issuer: 'jest',
            audience: ['mridang/testing'],
          },
        )}`,
      )
      .send(scheduleDto)
      .expect(HttpStatus.FOUND)
      .expect('Location', '/app');

    expect(railcrossServiceMock.updateSchedules).toHaveBeenCalledTimes(1);
    expect(railcrossServiceMock.updateSchedules).toHaveBeenCalledWith(
      expect.any(Object),
      undefined,
      scheduleDto.lock_time,
      scheduleDto.unlock_time,
      scheduleDto.timezone,
    );
  });

  test('/POST setup with invalid body should return bad request and not invoke updateSchedules', async () => {
    const jwtService = testModule.app.get(JwtService);
    const scheduleDto = {
      lock_time: 2,
      unlock_time: 22,
      timezone: 'X',
    };

    await request(testModule.app.getHttpServer())
      .post('/app/setup')
      .set(
        'Cookie',
        `jwt=${jwtService.sign(
          {
            installationIds: [1, 2],
            accessToken: 'token',
          },
          {
            subject: 'mridang',
            issuer: 'jest',
            audience: ['mridang/testing'],
          },
        )}`,
      )
      .send(scheduleDto)
      .expect(HttpStatus.BAD_REQUEST);

    expect(railcrossServiceMock.updateSchedules).not.toHaveBeenCalled();
  });
});

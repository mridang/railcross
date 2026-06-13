import { jest, expect } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import { End2EndModule } from '../../e2e.module.js';
import { AppModule } from '../../../src/app.module.js';
import RailcrossService from '../../../src/services/railcross/railcross.service.js';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

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
    railcrossServiceMock.listSchedules.mockResolvedValue([]);

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
    railcrossServiceMock.updateSchedules.mockResolvedValue(null); // Assuming updateSchedules doesn't return anything

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

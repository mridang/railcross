import { End2EndModule } from '../../../e2e.module';
import { AppModule } from '../../../../src/app.module';
import nock from 'nock';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { buildAxiosFetch } from '@lifeomic/axios-fetch';
import axios from 'axios';
import { CryptoImpl, FetchImpl } from '@mridang/nestjs-defaults';

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      providers: [],
    },
  ],
});

describe('auth.controller tests', () => {
  beforeAll(async () => {
    await testModule.beforeAll((testModule) => {
      testModule
        .overrideProvider(CryptoImpl)
        .useValue({
          randomUUID: () => '00000000-0000-0000-0000-000000000000',
          getRandomValues: crypto.getRandomValues,
        })
        .overrideProvider(FetchImpl)
        .useValue(buildAxiosFetch(axios.create()));

      return testModule;
    });
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  beforeEach(() => {
    nock('https://api.github.com')
      .persist()
      .get('/user/installations?per_page=100')
      .reply(200, [{ id: 123 }, { id: 456 }])
      .get('/user')
      .reply(200, {
        login: 'testuser',
      })
      .get('/user/repos?per_page=100')
      .reply(200, [
        { full_name: 'testuser/repo1', archived: false },
        { full_name: 'testuser/repo2', archived: true },
      ]);

    nock('https://github.com')
      .persist()
      .post('/login/oauth/access_token')
      .reply(200, {
        access_token: 'test_access_token',
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('responds with 400 Bad Request when `code` query parameter is missing', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth')
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('responds with 400 Bad Request when `code` query parameter is invalid', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth?code=invalidCode')
      .expect(HttpStatus.BAD_REQUEST);
  });

  test('handles GitHub OAuth callback successfully', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth?code=foofoofoofoofoofoofoo&state=barbarbarbarbarbarbar')
      .set('Cookie', 'nonce=barbarbarbarbarbarbar')
      .expect(HttpStatus.FOUND)
      .expect(
        'Set-Cookie',
        /^nonce=; Path=\/; Expires=.* GMT,jwt=.*\..*\..*; Max-Age=3600; Path=\/; Expires=.* GMT; HttpOnly; Secure; SameSite=Strict$/,
      );
  });

  test('clears jwt cookie and redirects on logout', () => {
    return request(testModule.app.getHttpServer())
      .get('/auth/logout')
      .expect(HttpStatus.FOUND)
      .expect('Set-Cookie', /jwt=;/);
  });
});

/**
 * @file Tests for the Railcross module wiring.
 */
import { afterAll, beforeAll, jest, expect } from '@jest/globals';
import { cloudflareWorkersStub } from '../../helpers/cloudflare-workers-stub.js';

// eslint-disable-next-line tslop/no-module-mocking -- `cloudflare:workers` exists only inside the Workers runtime, so a virtual module mock is the only seam
jest.unstable_mockModule('cloudflare:workers', cloudflareWorkersStub, {
  virtual: true,
});

const { default: ProbotHandler } =
  await import('../../../src/services/railcross/probot.handler.js');
const { End2EndModule } = await import('../../end-to-end.module.js');
const { AppModule } = await import('../../../src/app.module.js');

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      providers: [],
    },
  ],
});

describe('railcross.module tests', () => {
  beforeAll(async () => {
    await testModule.beforeAll();
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  test('that the webhook hander is registered', async () => {
    expect(testModule.app.get(ProbotHandler)).toBeDefined();
  });
});

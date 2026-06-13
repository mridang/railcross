import { expect } from '@jest/globals';
import ProbotHandler from '../../../src/services/railcross/probot.handler.js';
import { End2EndModule } from '../../e2e.module.js';
import { AppModule } from '../../../src/app.module.js';

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
    expect(await testModule.app.get(ProbotHandler)).toBeDefined();
  });
});

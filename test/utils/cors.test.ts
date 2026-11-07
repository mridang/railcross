import { expect } from '@jest/globals';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { corsOptions } from '../../src/utils/cors.js';

describe('corsOptions', () => {
  test('never allows credentials', () => {
    expect(corsOptions.credentials).toBe(false);
  });

  test('does not echo or allow any origin', async () => {
    const adapter = new CloudflareAdapter();
    adapter.enableCors({ credentials: true });
    adapter.enableCors({ ...corsOptions });
    adapter.get('/', (_req: unknown, res: { send: (b: string) => void }) =>
      res.send('ok'),
    );
    const response = await adapter.handle(
      new Request('https://railcross.apps.mrida.ng/', {
        headers: { origin: 'https://evil.example' },
      }),
    );
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });
});

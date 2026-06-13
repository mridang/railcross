/**
 * Shared stub factory for the `cloudflare:workers` runtime module, which only
 * exists inside the Workers runtime. Each test file still calls
 * `jest.unstable_mockModule('cloudflare:workers', cloudflareWorkersStub)`
 * itself, because module mocks register per-test under ESM.
 */

const kvStore = new Map<string, string>();

const SCHEDULES = {
  async get(key: string, type?: string): Promise<unknown> {
    const value = kvStore.get(key);
    if (value === undefined) {
      return null;
    }
    return type === 'json' ? JSON.parse(value) : value;
  },
  async put(key: string, value: string): Promise<void> {
    kvStore.set(key, value);
  },
  async delete(key: string): Promise<void> {
    kvStore.delete(key);
  },
  async list({ prefix }: { prefix?: string } = {}): Promise<{
    keys: { name: string }[];
    list_complete: true;
  }> {
    const keys = [...kvStore.keys()]
      .filter((key) => !prefix || key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, list_complete: true };
  },
};

const SCHEDULE_ALARMS = {
  idFromName: (name: string) => name,
  get: () => ({
    async arm(): Promise<void> {},
    async disarm(): Promise<void> {},
  }),
};

class DurableObject {
  constructor(
    protected ctx: unknown,
    protected env: unknown,
  ) {}
}

const env: Record<string, unknown> = { SCHEDULES, SCHEDULE_ALARMS };

/**
 * Factory passed to `jest.unstable_mockModule('cloudflare:workers', ...)`.
 */
export const cloudflareWorkersStub = (): {
  env: Record<string, unknown>;
  DurableObject: typeof DurableObject;
} => ({ env, DurableObject });

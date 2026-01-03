import { expect } from '@jest/globals';
import { scheduleSchema } from '@/lib/schemas/schedule';

describe('schedule schema validation', () => {
  test('should validate valid schedule data', () => {
    const validData = {
      lock_time: '9',
      unlock_time: '17',
      timezone: 'America/New_York',
      repo_ids: ['123', '456'],
    };

    const result = scheduleSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lock_time).toBe(9);
      expect(result.data.unlock_time).toBe(17);
      expect(result.data.timezone).toBe('America/New_York');
      expect(result.data.repo_ids).toEqual([123, 456]);
    }
  });

  test('should reject invalid lock time', () => {
    const invalidData = {
      lock_time: '25',
      unlock_time: '17',
      timezone: 'America/New_York',
    };

    const result = scheduleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should reject negative lock time', () => {
    const invalidData = {
      lock_time: '-1',
      unlock_time: '17',
      timezone: 'America/New_York',
    };

    const result = scheduleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should reject invalid timezone', () => {
    const invalidData = {
      lock_time: '9',
      unlock_time: '17',
      timezone: 'Invalid/Timezone',
    };

    const result = scheduleSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should allow empty repo_ids', () => {
    const validData = {
      lock_time: '9',
      unlock_time: '17',
      timezone: 'UTC',
    };

    const result = scheduleSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.repo_ids).toEqual([]);
    }
  });

  test('should coerce string numbers to integers', () => {
    const validData = {
      lock_time: '9',
      unlock_time: '17',
      timezone: 'UTC',
      repo_ids: ['123'],
    };

    const result = scheduleSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.lock_time).toBe('number');
      expect(typeof result.data.unlock_time).toBe('number');
    }
  });
});

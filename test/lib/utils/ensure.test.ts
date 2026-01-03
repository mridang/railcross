import { expect } from '@jest/globals';
import { ensure } from '@/lib/utils/ensure';

describe('ensure function tests', () => {
  test('should return the value if it is not null or undefined', () => {
    const testValue = 'test';
    const result = ensure(testValue);
    expect(result).toBe(testValue);
  });

  test('should throw an error for null input', () => {
    expect(() => ensure(null)).toThrow('Value is null or undefined');
  });

  test('should throw an error for undefined input', () => {
    expect(() => ensure(undefined)).toThrow('Value is null or undefined');
  });

  test('should return zero if value is zero', () => {
    const result = ensure(0);
    expect(result).toBe(0);
  });

  test('should return empty string if value is empty string', () => {
    const result = ensure('');
    expect(result).toBe('');
  });

  test('should return false if value is false', () => {
    const result = ensure(false);
    expect(result).toBe(false);
  });
});

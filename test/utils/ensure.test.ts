import { expect } from '@jest/globals';
import { ensure } from '../../src/utils/ensure.js';

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
});

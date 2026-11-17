/**
 * @file Tests for the Permissions-Policy header middleware.
 */
import { expect, jest } from '@jest/globals';

import {
  PERMISSIONS_POLICY,
  permissionsPolicy,
} from '../../src/utils/permissions-policy.js';
// eslint-disable-next-line e18e/ban-dependencies -- type-only import of Express request types, erased at build time, so nothing ships
import type { NextFunction, Response } from 'express';

describe('permissionsPolicy', () => {
  test('sets the full policy and continues', () => {
    const setHeader = jest.fn<Response['setHeader']>();
    const next: NextFunction = jest.fn();
    permissionsPolicy({}, { setHeader }, next);
    expect(setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      PERMISSIONS_POLICY,
    );
    expect(next).toHaveBeenCalled();
  });

  test('disables every listed feature, including clipboard-write and interest-cohort', () => {
    const features = PERMISSIONS_POLICY.split(', ').filter((member) =>
      member.endsWith('=()'),
    );
    expect(features).toHaveLength(29);
    expect(features).toContain('clipboard-write=()');
    expect(features).toContain('interest-cohort=()');
    expect(PERMISSIONS_POLICY.split(', ')).toContain('sync-xhr=()');
  });
});

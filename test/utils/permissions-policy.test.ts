/**
 * @file Tests for the Permissions-Policy header middleware.
 */
import { expect, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';
import {
  PERMISSIONS_POLICY,
  permissionsPolicy,
} from '../../src/utils/permissions-policy.js';

describe('permissionsPolicy', () => {
  test('sets the full policy and continues', () => {
    const setHeader = jest.fn();
    const next = jest.fn();
    permissionsPolicy(
      {} as Request,
      { setHeader } as unknown as Response,
      next as NextFunction,
    );
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
    expect(PERMISSIONS_POLICY).toContain('sync-xhr=()');
  });
});

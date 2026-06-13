import { expect } from '@jest/globals';
import { AuthGuard } from '../../../../src/services/github/authen/auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import murmurhash from 'murmurhash';
import {
  ContextType,
  HttpArgumentsHost,
  RpcArgumentsHost,
  Type,
  WsArgumentsHost,
} from '@nestjs/common/interfaces';
import type { Request } from '@mridang/nestjs-defaults';

describe('auth.guard tests', () => {
  class MockExecutionContext implements ExecutionContext {
    constructor(private readonly reqVal: Partial<Request>) {
      //
    }

    getClass<T>(): Type<T> {
      throw new Error('Method not implemented.');
    }

    getHandler(): () => void {
      throw new Error('Method not implemented.');
    }

    getArgs<T extends Array<unknown> = []>(): T {
      throw new Error('Method not implemented.');
    }

    getArgByIndex<T>(): T {
      throw new Error('Method not implemented.');
    }

    switchToRpc(): RpcArgumentsHost {
      throw new Error('Method not implemented.');
    }

    switchToWs(): WsArgumentsHost {
      throw new Error('Method not implemented.');
    }

    getType<TContext extends string = ContextType>(): TContext {
      throw new Error('Method not implemented.');
    }

    switchToHttp(): HttpArgumentsHost {
      const request = this.reqVal;
      return {
        getRequest<T = Request>(): T {
          return request as T;
        },

        getResponse<T>(): T {
          return {} as T;
        },

        getNext<T>(): T {
          return {} as T;
        },
      };
    }
  }

  const jwtService = new JwtService({ secret: 'test' });
  const authGuard = new AuthGuard(jwtService);

  test('should disallow access when no cookies are present', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access when the cookie is not present', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: { foo: 'bar' },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access with a malformed JWT token', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: { jwt: 'jwt' },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access with a valid JWT token but missing aud', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: { jwt: jwtService.sign({}) },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access with a valid JWT token but incorrect aud', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: {
        jwt: jwtService.sign(
          {},
          {
            audience: 'foobar',
          },
        ),
      },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access with a valid JWT token but incorrect aud', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: {
        jwt: jwtService.sign(
          {},
          {
            audience: ['foo/bar'],
          },
        ),
      },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should disallow access with a valid JWT token and incorrect aud', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: {
        jwt: jwtService.sign(
          {},
          {
            audience: ['foo/bar', 'testOrg/testRepo'],
          },
        ),
      },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(false);
  });

  test('should sallow access with a valid JWT token and correct aud', () => {
    const fakeContext: ExecutionContext = new MockExecutionContext({
      cookies: {
        jwt: jwtService.sign(
          {},
          {
            audience: [
              `${murmurhash.v3('foo/bar')}`,
              `${murmurhash.v3('testOrg/testRepo')}`,
            ],
          },
        ),
      },
      params: {
        orgName: 'testOrg',
        repoName: 'testRepo',
      },
    });

    expect(authGuard.canActivate(fakeContext)).toBe(true);
  });
});

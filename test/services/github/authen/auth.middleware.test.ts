/**
 * @file Tests for the authentication middleware.
 */
import { jest, expect } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthMiddleware } from '../../../../src/services/github/authen/auth.middleware.js';
import type { NextFunction, Request } from '@mridang/nestjs-defaults';

function createMockResponse() {
  return {
    redirect: jest.fn<(url: string) => void>(),
  };
}

describe('auth.middleware tests', () => {
  const jwtService = new JwtService({ secret: 'test' });
  const middleware = new AuthMiddleware(jwtService);

  test('should redirect if no JWT cookie found', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Pick<Request, 'cookies'> & { user?: object } = {
      cookies: {
        //
      },
    };

    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockResponse.redirect).toHaveBeenCalledWith(`/auth/reauthenticate`);
  });

  test('should call next if valid JWT token is provided', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Pick<Request, 'cookies'> & { user?: object } = {
      cookies: {
        jwt: jwtService.sign({ id: 'user123' }),
      },
    };

    middleware.use(mockRequest, mockResponse, nextFunction);
    expect(mockRequest).toHaveProperty('user.id', 'user123');
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should return 401 if invalid JWT token is provided', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Pick<Request, 'cookies'> & { user?: object } = {
      cookies: {
        jwt: 'invalidToken',
      },
    };

    expect(() => {
      middleware.use(mockRequest, mockResponse, nextFunction);
    }).toThrow(new UnauthorizedException('Invalid token.'));
  });
});

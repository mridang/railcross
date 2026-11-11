/**
 * @file Tests for the authentication middleware.
 */
import { jest, expect } from '@jest/globals';
import type { NextFunction, Request, Response } from '@mridang/nestjs-defaults';
import { AuthMiddleware } from '../../../../src/services/github/authen/auth.middleware.js';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

function createMockResponse(): Partial<Response> {
  return {
    redirect: jest.fn<(statusOrUrl: number | string, url?: string) => void>(),
    status: jest.fn<Response['status']>().mockReturnThis(), // For chaining .send()
    send: jest.fn<Response['send']>(),
    cookie: jest.fn<Response['cookie']>(),
  };
}

describe('auth.middleware tests', () => {
  const jwtService = new JwtService({ secret: 'test' });
  const middleware = new AuthMiddleware(jwtService);

  test('should redirect if no JWT cookie found', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Partial<Request> = {
      cookies: {
        //
      },
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );
    expect(mockResponse.redirect).toHaveBeenCalledWith(`/auth/reauthenticate`);
  });

  test('should call next if valid JWT token is provided', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Partial<Request> = {
      cookies: {
        jwt: jwtService.sign({ id: 'user123' }),
      },
    };

    middleware.use(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should return 401 if invalid JWT token is provided', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse = createMockResponse();
    const mockRequest: Partial<Request> = {
      cookies: {
        jwt: 'invalidToken',
      },
    };

    expect(() => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );
    }).toThrow(new UnauthorizedException('Invalid token.'));
  });
});

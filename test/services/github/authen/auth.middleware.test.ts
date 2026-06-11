import { jest } from '@jest/globals';
import { expect } from '@jest/globals';
import type { NextFunction, Request, Response } from '@mridang/nestjs-defaults';
import { AuthMiddleware } from '../../../../src/services/github/authen/auth.middleware.js';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('auth.middleware tests', () => {
  const jwtService = new JwtService({ secret: 'test' });
  const middleware = new AuthMiddleware(jwtService);

  test('should redirect if no JWT cookie found', () => {
    const nextFunction: NextFunction = jest.fn();
    const mockResponse: Partial<Response> = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(), // For chaining .send()
      send: jest.fn(),
      cookie: jest.fn(),
    };
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
    const mockResponse: Partial<Response> = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(), // For chaining .send()
      send: jest.fn(),
      cookie: jest.fn(),
    };
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
    const mockResponse: Partial<Response> = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(), // For chaining .send()
      send: jest.fn(),
      cookie: jest.fn(),
    };
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

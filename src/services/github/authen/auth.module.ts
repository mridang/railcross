import { Module, DynamicModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthMiddleware } from './auth.middleware.js';
import {
  AuthConfig,
  AuthModuleAsyncOptions,
  AuthModuleOptions,
} from './auth.interfaces.js';
import { AuthService } from './auth.service.js';

@Module({})
export class AuthModule {
  static registerAsync<T>(options: AuthModuleAsyncOptions<T>): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        //
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: JwtService,
          useFactory: (authOptions: AuthModuleOptions) => {
            return new JwtService({
              secret: authOptions.authConfig.clientSecret,
              signOptions: { expiresIn: authOptions.authTTL || 60 * 60 },
            });
          },
          inject: [AuthModuleOptions],
        },
        {
          provide: AuthModuleOptions,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: AuthConfig,
          useFactory: (_: AuthModuleOptions) => _.authConfig,
          inject: [AuthModuleOptions],
        },
        AuthGuard,
        AuthMiddleware,
        AuthService,
      ],
      exports: [AuthGuard, JwtService],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('app');
  }
}

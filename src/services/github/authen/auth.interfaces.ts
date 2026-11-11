/**
 * @file Configuration types and injection tokens for the GitHub authentication module.
 */
import { InjectionToken, ModuleMetadata } from '@nestjs/common';

export const AuthConfig = Symbol('AuthConfig');
// eslint-disable-next-line no-redeclare -- the injection token and the interface share one name by design
export interface AuthConfig {
  clientSecret: string;
  clientId: string;
}

export const AuthModuleOptions = Symbol('AuthModuleOptions');
// eslint-disable-next-line no-redeclare -- the injection token and the interface share one name by design
export interface AuthModuleOptions {
  authConfig: AuthConfig;
  authTTL: number;
}

export interface AuthModuleAsyncOptions<T> extends Pick<
  ModuleMetadata,
  'imports'
> {
  inject?: InjectionToken[];
  useFactory: (...args: T[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
}

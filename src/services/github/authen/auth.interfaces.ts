/**
 * @file Configuration types and injection tokens for the GitHub authentication module.
 */
import { InjectionToken, ModuleMetadata } from '@nestjs/common';

const AuthConfigToken = Symbol('AuthConfig');
export { AuthConfigToken as AuthConfig };
export interface AuthConfig {
  clientSecret: string;
  clientId: string;
}

const AuthModuleOptionsToken = Symbol('AuthModuleOptions');
export { AuthModuleOptionsToken as AuthModuleOptions };
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

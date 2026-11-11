/**
 * @file Nest guard that allows a request only when its JWT cookie grants access to the repository in the route.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import murmurhash from 'murmurhash';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger: Logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) {
    //
  }

  /**
   * Decides whether the request may reach the route.
   *
   * The JWT must be present and its audience must list the murmur hash of the
   * `org/repo` named in the route parameters.
   * @param context - The execution context of the incoming request.
   * @returns `true` when the request is allowed, otherwise `false`.
   * @example
   * ```ts
   * @UseGuards(AuthGuard)
   * @Get(':orgName/:repoName')
   * show() {}
   * ```
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies ? request.cookies['jwt'] : undefined;

    if (!token) {
      this.logger.log(`No JWT cookie found.`);
      return false;
    }
    const { orgName, repoName } = request.params;
    if (!orgName || !repoName) {
      this.logger.error(`Unable to deduce org/repo from the request`);
      return false;
    }
    try {
      const decoded = this.jwtService.verify(token) as { aud: string[] };
      const fullName = `${orgName}/${repoName}`;
      if (decoded.aud.includes(`${murmurhash.v3(fullName)}`)) {
        return true;
      }
      this.logger.log(`${fullName} is not allowed in allowed audiences`);
      return false;
    } catch {
      return false; // Token verification failed
    }
  }
}

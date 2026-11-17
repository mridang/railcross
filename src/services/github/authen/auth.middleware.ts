/**
 * @file Nest middleware that loads the JWT cookie into the request user or redirects to re-authentication.
 */
import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request } from '@mridang/nestjs-defaults';

@Injectable()
export class AuthMiddleware implements NestMiddleware<
  Pick<Request, 'cookies'> & { user?: object },
  { redirect(url: string): void }
> {
  private readonly logger: Logger = new Logger(AuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {
    //
  }

  /**
   * Verifies the JWT cookie, sets it as the request user and passes control on.
   *
   * A request without a cookie is redirected to the re-authentication page, and a
   * tampered token is rejected as unauthorized.
   * @param request - The incoming request, carrying the cookies.
   * @param response - The response, used to redirect when there is no token.
   * @param next - Callback that hands the request to the next handler.
   * @throws {UnauthorizedException} When the JWT cookie fails verification.
   * @example
   * ```ts
   * app.use('/app', (req, res, next) => middleware.use(req, res, next));
   * ```
   */
  use(
    request: Pick<Request, 'cookies'> & { user?: object },
    response: { redirect(url: string): void },
    next: NextFunction,
  ) {
    const cookies: unknown = request.cookies;
    const jwt: unknown =
      typeof cookies === 'object' && cookies !== null && 'jwt' in cookies
        ? cookies.jwt
        : undefined;
    const token = typeof jwt === 'string' ? jwt : undefined;

    if (token) {
      try {
        // eslint-disable-next-line functional/immutable-data -- attaching the verified user to the request is the contract with the handlers that follow
        request.user = this.jwtService.verify(token);
        next();
        // eslint-disable-next-line no-useless-return -- n/callback-return requires a return after the callback and reports its absence, while this rule reports the return, so the two disagree and the callback's own rule wins
        return;
      } catch {
        this.logger.error(`Tampered JWT with value ${token} found`);
        throw new UnauthorizedException('Invalid token.');
      }
    } else {
      this.logger.log(`No JWT cookie found.`);
      response.redirect('/auth/reauthenticate');
    }
  }
}

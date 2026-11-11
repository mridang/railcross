/**
 * @file Nest middleware that loads the JWT cookie into the request user or redirects to re-authentication.
 */
import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from '@mridang/nestjs-defaults';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware<
  Request & { user?: object },
  Response
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
   * @returns The result of `next` or of the redirect.
   * @throws {UnauthorizedException} When the JWT cookie fails verification.
   * @example
   * ```ts
   * app.use('/app', (req, res, next) => middleware.use(req, res, next));
   * ```
   */
  use(
    request: Request & { user?: object },
    response: Response,
    next: NextFunction,
  ) {
    const token = request.cookies ? request.cookies['jwt'] : undefined;

    if (token) {
      try {
        request.user = this.jwtService.verify(token);
        return next();
      } catch {
        this.logger.error(`Tampered JWT with value ${token} found`);
        throw new UnauthorizedException('Invalid token.');
      }
    } else {
      this.logger.log(`No JWT cookie found.`);
      return response.redirect('/auth/reauthenticate');
    }
  }
}

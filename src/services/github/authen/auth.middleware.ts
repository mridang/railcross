import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from '@mridang/nestjs-defaults';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware
  implements NestMiddleware<Request & { user?: object }, Response>
{
  private readonly logger: Logger = new Logger(AuthMiddleware.name);

  constructor(private readonly jwtService: JwtService) {
    //
  }

  use(
    request: Request & { user?: object },
    response: Response,
    next: NextFunction,
  ) {
    const token = request.cookies ? request.cookies['jwt'] : undefined;

    if (!token) {
      this.logger.log(`No JWT cookie found.`);
      return response.redirect('/auth/reauthenticate');
    } else {
      try {
        request.user = this.jwtService.verify(token);
        next();
      } catch {
        this.logger.error(`Tampered JWT with value ${token} found`);
        throw new UnauthorizedException('Invalid token.');
      }
    }
  }
}

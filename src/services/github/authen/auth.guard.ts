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

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies ? request.cookies['jwt'] : undefined;

    if (token) {
      const orgName = request.params.orgName;
      const repoName = request.params.repoName;
      if (!orgName || !repoName) {
        this.logger.error(`Unable to deduce org/repo from the request`);
        return false;
      } else {
        try {
          const decoded = this.jwtService.verify(token) as { aud: string[] };
          const fullName = `${orgName}/${repoName}`;
          if (decoded.aud.includes(`${murmurhash.v3(fullName)}`)) {
            return true;
          } else {
            this.logger.log(`${fullName} is not allowed in allowed audiences`);
            return false;
          }
        } catch {
          return false; // Token verification failed
        }
      }
    } else {
      this.logger.log(`No JWT cookie found.`);
      return false;
    }
  }
}

import {
  Controller,
  Get,
  Header,
  Inject,
  Optional,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Octokit } from '@octokit/rest';
import { IsString, Length } from 'class-validator';
import murmurhash from 'murmurhash';
import { ensure } from '../../../utils/ensure.js';
import { type Fetch } from '@octokit/types';
import { AuthConfig } from './auth.interfaces.js';
import { from, forkJoin, map, switchMap, lastValueFrom, toArray } from 'rxjs';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { CryptoImpl, FetchImpl } from '@mridang/nestjs-defaults';
import type { Request, Response } from '@mridang/nestjs-defaults';
import { doPaginate } from '../octokit/utils/paginate.js';
import expiredView from './expired.view.js';

class CallbackDto {
  @IsString()
  @Length(20)
  code?: string;

  @IsString()
  @Length(20)
  state?: string;
}

@Controller('auth')
export class AuthController {
  private readonly redirectFn: (request: Request) => {
    nonce: string;
    uri: string;
  };

  constructor(
    @Inject(AuthConfig)
    private readonly authConfig: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(FetchImpl)
    private readonly fetchImpl: Fetch = fetch,
    @Optional()
    @Inject(CryptoImpl)
    private readonly cryptoFn: Omit<typeof crypto, 'subtle'> = crypto,
    @Inject()
    @Optional()
    private readonly cookieName: string = 'nonce',
  ) {
    this.redirectFn = () => {
      const state = this.cryptoFn.randomUUID();
      const redirect = `https://${this.configService.getOrThrow('DOMAIN_NAME')}/auth`;
      return {
        nonce: state,
        uri: `https://github.com/login/oauth/authorize?client_id=${this.authConfig.clientId}&redirect_uri=${redirect}&state=${state}&scope=repo`,
      };
    };
  }

  @Get('/reauthenticate')
  @Header('Content-Type', 'text/html; charset=utf-8')
  expired() {
    return expiredView();
  }

  @Post('/reauthenticate')
  authenticate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const redirect = this.redirectFn(request);

    response.cookie(this.cookieName, redirect.nonce, {
      maxAge: 2 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    response.redirect(redirect.uri);
  }

  @Get('/logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt', {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
    });

    response.redirect('/app');
  }

  @Get('/')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleGitHubCallback(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Query() dto: CallbackDto,
  ) {
    if (request.cookies[this.cookieName] !== dto.state) {
      throw new UnauthorizedException('Invalid state parameter or nonce.');
    } else {
      response.clearCookie(this.cookieName);
    }

    const results = ensure(
      await lastValueFrom(
        from(
          this.authService.exchangeCodeForAccessToken(
            this.authConfig,
            ensure(dto.code),
          ),
        ).pipe(
          switchMap((accessToken) => {
            const octokit = new Octokit({
              auth: accessToken,
              request: { fetch: this.fetchImpl },
            });

            return forkJoin({
              user: from(octokit.rest.users.getAuthenticated()).pipe(
                map((response) => response.data),
              ),
              repositories: from(
                octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
                  per_page: 100,
                }),
              ),
              current: doPaginate(async (page: number) => {
                const response =
                  await octokit.rest.apps.listInstallationsForAuthenticatedUser(
                    {
                      per_page: 100,
                      page,
                    },
                  );
                return {
                  totalRows: response.data.total_count,
                  resultItems: response.data.installations,
                };
              }).pipe(toArray()),
            }).pipe(
              map(({ user, repositories, current }) => ({
                accessToken,
                user,
                repositories,
                current,
              })),
            );
          }),
        ),
      ),
    );

    const sessionToken = this.jwtService.sign(
      {
        accessToken: results.accessToken,
        installationIds: results?.current.map((item) => item.id),
      },
      {
        subject: results?.user.login,
        issuer: ensure(process.env.SERVICE_NAME),
        audience: results?.repositories
          .filter((repo) => !repo.archived)
          .map((repo) => murmurhash.v3(repo.full_name).toString()),
      },
    );

    response.cookie('jwt', sessionToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000,
    });

    response.redirect('/app');
  }
}

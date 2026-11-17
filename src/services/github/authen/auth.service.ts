/**
 * @file Service that exchanges GitHub OAuth codes for tokens and reads the signed-in user.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FetchImpl } from '@mridang/nestjs-defaults';
import { AuthConfig } from './auth.interfaces.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(FetchImpl) private readonly fetchImpl: typeof fetch) {
    //
  }

  async exchangeCodeForAccessToken(
    authConfig: AuthConfig,
    code: string,
  ): Promise<string> {
    const response = await this.fetchImpl(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: authConfig.clientId,
          client_secret: authConfig.clientSecret,
          code,
        }),
      },
    );

    if (response.ok) {
      const tokenData = await response.json<{ access_token?: string }>();

      if (tokenData.access_token) {
        return tokenData.access_token;
      }
      throw new Error(
        'Response received, but access token is missing or invalid.',
      );
    } else {
      const errorText = await response.text();
      throw new Error(
        `Failed to obtain access token. Status: ${response.status} - ${response.statusText}. Details: ${errorText}`,
      );
    }
  }
}

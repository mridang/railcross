import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Fetch } from '@octokit/types';
import { AuthConfig } from './auth.interfaces.js';
import { FetchImpl } from '@mridang/nestjs-defaults';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(FetchImpl) private readonly fetchImpl: Fetch) {
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
          code: code,
        }),
      },
    );

    if (response.ok) {
      const tokenData = await response.json();

      if (tokenData.access_token) {
        return tokenData.access_token;
      } else {
        throw new Error(
          'Response received, but access token is missing or invalid.',
        );
      }
    } else {
      const errorText = await response.text();
      throw new Error(
        `Failed to obtain access token. Status: ${response.status} - ${response.statusText}. Details: ${errorText}`,
      );
    }
  }
}

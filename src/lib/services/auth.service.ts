interface AuthConfig {
  clientSecret: string;
  clientId: string;
}

export async function exchangeCodeForAccessToken(
  authConfig: AuthConfig,
  code: string,
): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
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
  });

  if (response.ok) {
    const tokenData = (await response.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.access_token) {
      return tokenData.access_token;
    } else {
      throw new Error(
        `Response received, but access token is missing or invalid. Error: ${tokenData.error} - ${tokenData.error_description}`,
      );
    }
  } else {
    const errorText = await response.text();
    throw new Error(
      `Failed to obtain access token. Status: ${response.status} - ${response.statusText}. Details: ${errorText}`,
    );
  }
}

export function getAuthConfigFromEnv(): AuthConfig {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID environment variable is required');
  }
  if (!clientSecret) {
    throw new Error('GITHUB_CLIENT_SECRET environment variable is required');
  }

  return {
    clientId,
    clientSecret,
  };
}

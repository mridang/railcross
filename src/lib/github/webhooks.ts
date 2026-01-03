interface WebhookConfig {
  webhookSecret: string;
}

/**
 * Get the webhook configuration from environment variables.
 */
export function getWebhookConfigFromEnv(): WebhookConfig {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('GITHUB_WEBHOOK_SECRET environment variable is required');
  }

  return {
    webhookSecret,
  };
}

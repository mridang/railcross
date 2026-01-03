import { z } from 'zod';

/**
 * Schema for OAuth callback query parameters.
 * state is optional for GitHub App installation flow.
 */
export const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().nullish(),
  installation_id: z.string().nullish(),
  setup_action: z.string().nullish(),
});

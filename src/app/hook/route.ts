import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@octokit/webhooks';
import type { WebhookEventName } from '@octokit/webhooks-types';
import { getWebhookConfigFromEnv } from '@/lib/github/webhooks';
import {
  SchedulerService,
  type SchedulerEnv,
} from '@/lib/services/scheduler.service';
import { logger } from '@/lib/utils/logger';

declare const env: SchedulerEnv | undefined;

export async function POST(request: NextRequest) {
  const deliveryId = request.headers.get('x-github-delivery');
  const eventName = request.headers.get('x-github-event');
  const signature =
    request.headers.get('x-hub-signature-256') ||
    request.headers.get('x-hub-signature');

  if (!deliveryId) {
    return NextResponse.json(
      { error: 'Missing x-github-delivery header' },
      { status: 400 },
    );
  }
  if (!eventName) {
    return NextResponse.json(
      { error: 'Missing x-github-event header' },
      { status: 400 },
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing x-hub-signature-256 header' },
      { status: 400 },
    );
  }

  const payload = await request.text();
  if (!payload) {
    return NextResponse.json(
      { error: 'Missing webhook request body' },
      { status: 400 },
    );
  }

  const webhookConfig = getWebhookConfigFromEnv();

  const webhooks = new Webhooks({
    secret: webhookConfig.webhookSecret,
  });

  const isValid = await webhooks.verify(payload, signature);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature or payload' },
      { status: 400 },
    );
  }

  logger.info('Received webhook', { eventName });

  webhooks.on('installation_repositories.removed', async (context) => {
    const { id: installationId, account } = context.payload.installation;
    logger.info('Repositories removed from installation', {
      account: account.login,
    });

    const removedRepoIds =
      context.payload.repositories_removed?.map((repo) => repo.id) || [];

    if (removedRepoIds.length > 0 && typeof env !== 'undefined') {
      const schedulerService = new SchedulerService(env);
      for (const repoId of removedRepoIds) {
        logger.info('Removing schedule for repository', { repoId });
        await schedulerService.deleteSchedule(installationId, repoId);
      }
    }
  });

  webhooks.on('installation.deleted', async (context) => {
    const { id: installationId, account } = context.payload.installation;
    logger.info('Installation deleted', {
      account: account.login,
      installationId,
    });
  });

  try {
    await webhooks.verifyAndReceive({
      id: deliveryId,
      name: eventName as WebhookEventName,
      signature: signature,
      payload: payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}

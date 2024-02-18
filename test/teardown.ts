/* eslint-disable no-console */

export default async function teardown(): Promise<void> {
  if (globalThis.DOCKER) {
    console.info('Stopping docker compose');
    await globalThis.DOCKER.down({
      removeVolumes: true,
    });
  }
}

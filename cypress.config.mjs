/**
 * @file Cypress configuration for the end-to-end tests of the running Worker.
 */
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    browser: 'chrome',
    defaultCommandTimeout: 10_000,
    execTimeout: 120_000,
    requestTimeout: 10_000,
  },
});

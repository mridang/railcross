# Railcross for GitHub

![Status](https://railcross.apps.mrida.ng/version.svg)

Railcross prevents your teams from merging pull requests outside
merge windows.

Merge windows allow you to restrict the days and times that pull
requests may be merged.

Think of it as a railway crossing, you can't cross until the
train has passed. 🚂

Railcross is a low-overhead app and simply prevents your team
from merging between 0900 and 1600. It does this by locking the
branch protection rule of your default branch.
Any existing branch protection rules (even on the same branch) are
not affected.

### Installation

For details about the installation process, see the installation guide.
This guide also outlines the reasoning for the necessary scopes.

### Usage

For details about the usage and associated gotchas, see the installation
guide.

## Table of Contents

- [Architecture](#architecture)
- [Developing](#developing)
- [Contributing](#contributing)
- [License](#license)

## Architecture

The app is a NestJS application running on Cloudflare Workers through the
fetch-native `@mridang/nestjs-platform-cloudflare` adapter, served on a custom
domain with Cloudflare-managed DNS and TLS.

To manage the lock and unlock schedules, each schedule is stored in Workers KV
and armed as an alarm on a SQLite-backed Durable Object; a daily Cron Trigger
re-arms the next day's alarms, and each alarm locks or unlocks the configured
branches when it fires. Credentials are stored as Worker secrets, and logs and
per-request traces are captured by Workers Observability.

The application's only persistence is its scheduling state in Workers KV and
Durable Object storage.

## Developing

The app is built with Typescript 5.3 using NestJS and requires
Node 22 to run.

After checking out the repository, run `npm install` to install all
the required dependencies.

To develop the application, you must have a GitHub app of your own.
Instructions on how to create a GitHub app are outside the scope of this
readme, but you can find more information here
https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app

You must set up a GitHub app prior to proceeding as you will need certain
secrets from the app. When setting up the GitHub app, you will be
prompted to provide the webhook URL and the OAuth callback URL—
provide random values as these can only be supplied once the app has
been deployed.

### Configure the local environment

Configure the `.env` file with the necessary information. This file should be set up
with example values for a template, but you'll need to replace them with actual data
relevant to your application. Here’s a detailed breakdown of each variable:

- `APP_ID`: The unique identifier assigned to your application by GitHub. It's crucial
  for authenticating your app with the GitHub API.

- `CLIENT_ID`: Used during the OAuth process to initiate user authentication. It's
  sent to GitHub to receive an authorization code for access token exchange.

- `CLIENT_SECRET`: A sensitive key used alongside the authorization code to securely
  obtain an access token from GitHub, enabling user-specific data access.

- `WEBHOOK_SECRET`: Ensures the integrity and authenticity of received webhook payloads
  by validating the signature sent with each event.

- `PRIVATE_KEY`: Allows your app to authenticate directly with the GitHub API for
  actions or queries under the app's own identity.

- `SENTRY_DSN`: Directs errors and performance data to Sentry for monitoring, aiding in
  quick identification and resolution of issues.

> [!NOTE]
> It is fine to add sensitive information to this file as this file only
> serves as a template and Git has been configured to not track any
> changes this file using `git update-index --assume-unchanged .env`

---

### Configure the GitHub environment

To deploy the Worker from GitHub Actions, you must configure the following secret
in your GitHub repository settings. It is sensitive and grants access to deploy
to your Cloudflare account:

- `CLOUDFLARE_API_TOKEN`: A Cloudflare API token with the "Edit Cloudflare
  Workers" permission, used by Wrangler to publish the Worker.

Please treat this secret with the utmost care and never expose it publicly.

> [!IMPORTANT]
> Deployments will not work correctly if these environment variables and secrets
> are not configured properly. Ensure that you've entered the correct values
> corresponding to your Cloudflare account to avoid any deployment issues.

---

### Linting the code

Lint the code using `npm run lint`. This command runs ESLint and
lints all the files. To automatically fix any fixable lint errors, run
`npm run lint:fix`.

> [!NOTE]
> GitHub Actions has been configured to automatically fix all fixable
> lint errors on every commit and commit the changes back to the branch.

### Formatting the code

Reformat the code using `npm run format`. This runs Prettier and
reformats all the code.

> [!NOTE]
> GitHub Actions has been configured to automatically reformat all the
> code on every commit and commit the changes back to the branch.

### Deploying the app

The application is deployed by triggering the deployment workflow from the
Actions tab. You can also deploy from your local machine with `npm run deploy`,
which builds the Worker and publishes it with Wrangler.

> [!IMPORTANT]
> Deploying requires a `CLOUDFLARE_API_TOKEN` with the "Edit Cloudflare Workers"
> permission — configured as a repository secret for CI, or in your environment
> for local deploys.

### Running tests

Run the test suite using `npm run test`. The tests run entirely in-process
with Jest — no containers or external services are required.

If configured correctly, you should be able to run all the tests from
your IDE.

Jest has been configured to automatically collect coverage from tests,
and these can be found in the `.out` directory.

If you need to debug hanging tests, you can use `npm run test:debug`
which is handy when the test suite does not exit gracefully or hangs.

### Running the app

To run the application locally, run `npm run dev` (or `npx wrangler dev`),
which serves the Worker on a local Cloudflare runtime that closely mirrors
production.

Assuming that you have followed the instructions and configured everything
correctly, you should be able to go to `http://localhost:8787/` to see the
home page. If you've managed to get here, it indicates that the application
has been able to correctly initialize itself.

## Contributing

If you have suggestions for how this app could be improved, or
want to report a bug, open an issue - we'd love all and any
contributions.

## License

Apache License 2.0 © 2024 Mridang Agarwalla

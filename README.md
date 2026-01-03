# Railcross for GitHub

![Status](https://railcross.agarwal.la/version.svg)

Railcross prevents your teams from merging pull requests outside
merge windows.

Merge windows allow you to restrict the days and times that pull
requests may be merged.

Think of it as a railway crossing, you can't cross until the
train has passed.

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

The app is a Next.js application deployed on Cloudflare Workers. The
application uses Cloudflare Durable Objects for managing lock and unlock
schedules.

The application uses Sentry for error tracking and monitoring.

The application is designed to be stateless and does not have any sort
of persistence—this includes all ephemeral persistence, e.g. caches.

## Developing

The app is built with TypeScript 5.x using Next.js 15 and requires
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
relevant to your application. Here's a detailed breakdown of each variable:

- `GITHUB_APP_ID`: The unique identifier assigned to your application by GitHub. It's crucial
  for authenticating your app with the GitHub API.

- `GITHUB_CLIENT_ID`: Used during the OAuth process to initiate user authentication. It's
  sent to GitHub to receive an authorization code for access token exchange.

- `GITHUB_CLIENT_SECRET`: A sensitive key used alongside the authorization code to securely
  obtain an access token from GitHub, enabling user-specific data access.

- `GITHUB_WEBHOOK_SECRET`: Ensures the integrity and authenticity of received webhook payloads
  by validating the signature sent with each event.

- `GITHUB_PRIVATE_KEY`: Allows your app to authenticate directly with the GitHub API for
  actions or queries under the app's own identity.

- `JWT_SECRET`: Secret key used for signing and verifying JWT tokens for user sessions.

- `SENTRY_DSN`: Directs errors and performance data to Sentry for monitoring, aiding in
  quick identification and resolution of issues.

- `DOMAIN_NAME`: The domain name where the application is hosted.

> [!NOTE]
> It is fine to add sensitive information to this file as this file only
> serves as a template and Git has been configured to not track any
> changes this file using `git update-index --assume-unchanged .env`

---

### Configure the GitHub environment

To ensure the smooth operation of GitHub Actions within this project, it's
essential to configure certain environment variables and secrets. These settings
are crucial for various deployment tasks and integrating with external services
like Cloudflare and Sentry.

You need to set the following environment variables in the GitHub repository
settings:

- `SENTRY_ORG`: Your organization name in Sentry, required for Sentry release
  tracking after deployments.
- `SENTRY_PROJECT`: The name of your project in Sentry, required for Sentry release
  tracking after deployments.

These variables are used by GitHub Actions workflows to configure the deployment
environment correctly.

Additionally, you must configure the following secrets in your GitHub repository.
These secrets are sensitive and provide access to external services essential for
deployments and monitoring:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Workers deployment permissions.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.
- `SENTRY_AUTH_TOKEN`: A Sentry authentication token, required for Sentry release
  tracking after deployments.

Please treat these secrets with the utmost care and never expose them publicly.

> [!IMPORTANT]
> Deployments will not work correctly if these environment variables and secrets
> are not configured properly. Ensure that you've entered the correct values
> corresponding to your Cloudflare and Sentry accounts to avoid any deployment issues.

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

The application is automatically deployed when a push is made to the
default branch. You can manually trigger the deployment workflow if
you need to deploy the latest changes.

It is not recommended to deploy from your local machine but if needed,
it can be deployed using `npm run deploy`.

> [!IMPORTANT]
> You'll need to ensure that you have the Cloudflare credentials configured.
> Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables.

### Running tests

Run the test suite using `npm run test`. Jest is configured to run all
unit tests.

Jest has been configured to automatically collect coverage from tests,
and these can be found in the `.out` directory.

If you need to debug hanging tests, you can use `npm run test:debug`
which is handy when the test suite does not exit gracefully or hangs.

### Running the app

To run the application locally, you can simply run `npm run dev`
which starts the Next.js development server.

Assuming that you have followed the instructions and configured
everything correctly, you should be able to go to
`http://localhost:3000/version.svg` to see a version badge. If you've
managed to get here, it indicates that the application has been able
to correctly initialize itself.

## Contributing

If you have suggestions for how this app could be improved, or
want to report a bug, open an issue - we'd love all and any
contributions.

## License

Apache License 2.0 © 2024 Mridang Agarwalla

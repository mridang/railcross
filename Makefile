include .env

.PHONY: deploy-secrets deploy-scheduler-secrets deploy-scheduler

# Deploy secrets for the main app worker
deploy-secrets:
	echo "$(GITHUB_CLIENT_ID)" | npx wrangler secret put GITHUB_CLIENT_ID
	echo "$(GITHUB_CLIENT_SECRET)" | npx wrangler secret put GITHUB_CLIENT_SECRET
	echo "$(GITHUB_WEBHOOK_SECRET)" | npx wrangler secret put GITHUB_WEBHOOK_SECRET
	echo "$(JWT_SECRET)" | npx wrangler secret put JWT_SECRET

# Deploy secrets for the scheduler worker
# Note: GITHUB_PRIVATE_KEY should be set interactively due to multi-line PEM format
deploy-scheduler-secrets:
	echo "$(GITHUB_APP_ID)" | npx wrangler secret put GITHUB_APP_ID --config wrangler.worker.toml
	@echo "Enter GITHUB_PRIVATE_KEY interactively (paste PEM, then Ctrl+D):"
	npx wrangler secret put GITHUB_PRIVATE_KEY --config wrangler.worker.toml

# Deploy the scheduler worker
deploy-scheduler:
	npx wrangler deploy --config wrangler.worker.toml

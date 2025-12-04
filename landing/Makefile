env:
	pnpm install

dev:
	rm -rf .next
	pnpm run dev

build:
	pnpm run build

test:
	pnpm run lint

deploy: build
	@echo "🚀 Deploying to Cloudflare Pages..."
	@if [ ! -f "wrangler.toml" ]; then \
		echo "⚠️  wrangler.toml not found. Please configure Cloudflare Pages first."; \
		echo "📖 Run: npx wrangler pages project create <project-name>"; \
		exit 1; \
	fi
	@echo "📦 Uploading build files..."
	npx wrangler pages deploy
	@echo "✅ Deployment complete!"

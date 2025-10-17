.PHONY: dev build start env clean lint typecheck test

# Install dependencies
env:
	pnpm install

# Run development server
dev:
	pnpm run dev

# Build for production
build:
	(rm -rf {.next,dist})
	pnpm run build

# Run linting
lint:
	pnpm run lint

# Run type checking
typecheck:
	pnpm exec tsc --noEmit

# Run unit tests
unittest:
	pnpm test --silent

# Run all tests (lint + unit tests)
test: lint typecheck unittest

# Clean build artifacts and node_modules
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf dist

SUB_PROJECTS := smoosense-gui smoosense-py

.PHONY: env build test release

.EXPORT_ALL_VARIABLES:
R2_PARAMS := --profile=r2 --endpoint-url=https://41a336bea9a67c844e5fcba526c53768.r2.cloudflarestorage.com
R2_BUCKET := s3://smoosense-cdn


upload-public:
	for file in ${PWD}/smoosense-gui/_public/*; do \
		if [ -f "$$file" ]; then \
			aws ${R2_PARAMS} s3 cp "$$file" ${R2_BUCKET}/; \
		fi; \
	done

build-sync:
	(rm -rf smoosense-py/smoosense/statics)
	cp -r smoosense-gui/dist smoosense-py/smoosense/statics

build-local:
	ASSET_PREFIX= make -C smoosense-gui build
	make build-sync
	make -C smoosense-py build

build-release:
	ASSET_PREFIX=https://cdn.smoosense.ai make -C smoosense-gui build
	#make upload-public
	aws ${R2_PARAMS} s3 sync ${PWD}/smoosense-gui/dist/_next/static ${R2_BUCKET}/_next/static
	rm -rf ${PWD}/smoosense-gui/dist/_next/static
	make build-sync

docker-run:
	make build-local
	@echo "SmooSense running at http://localhost:8000"
	docker run --rm -it \
		-p 8000:8000 \
		-v $(PWD)/smoosense-py/dist:/dist:ro \
		-v $(PWD)/landing/public/content/deploy/app.py:/app/app.py:ro \
		-w /app \
		-v $(PWD)/data:/data:ro \
		python:3.11-slim \
		sh -c "pip install --no-cache-dir /dist/*.whl gunicorn && gunicorn --bind 0.0.0.0:8000 --workers 1 --timeout 120 app:app"

env:
	for project in $(SUB_PROJECTS); do \
		make -C $$project env; \
	done

test:
	for project in $(SUB_PROJECTS); do \
		make -C $$project test; \
	done
	make build-local
	make -C smoosense-py integration-test

publish:
	make -C smoosense-py publish

release:
	@echo "Creating new release..."
	@# Check if on main branch
	@CURRENT_BRANCH=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$CURRENT_BRANCH" != "main" ]; then \
		echo "Error: Not on main branch (currently on $$CURRENT_BRANCH)"; \
		exit 1; \
	fi
	@# Check if git tree is clean
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "Error: Git tree is not clean. Please commit or stash your changes."; \
		git status --short; \
		exit 1; \
	fi
	@echo "✓ On main branch and git tree is clean"
	@cd smoosense-py && uv version --bump patch
	@NEW_VERSION=$$(cd smoosense-py && uv version --short) && \
	echo "New version: $$NEW_VERSION" && \
	echo "Running tests..." && \
	make test && \
	git add -A && \
	git commit -m "Release $$NEW_VERSION" && \
	git tag -a "v$$NEW_VERSION" -m "Release v$$NEW_VERSION" && \
	echo "Created tag v$$NEW_VERSION" && \
	echo "" && \
	echo "Release $$NEW_VERSION created successfully!" && \
	echo "To push: git push origin main && git push origin v$$NEW_VERSION"

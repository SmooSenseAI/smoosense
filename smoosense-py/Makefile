.PHONY: env clean install-hooks build


clean:
	rm -rf {.venv,dist,.pytest_cache,*.egg-info}


env:
	(rm -rf .venv)
	uv venv --seed && uv sync --all-groups
	uv run playwright install 

unit-test:
	uv run python -m unittest discover tests/

integration-test:
	uv run python -m unittest discover -s intests -p "test_*.py"

build:
	(rm -rf dist)
	#uv version --bump rc
	uv build
	
publish: build
	UV_PUBLISH_TOKEN=$(shell awk '/password/ { print $$3 }' ~/.pypirc) uv publish

test:
	uv run ruff check --fix
	uv run ruff format
	uv run mypy smoosense
	make unit-test
	make build

dev:
	FLASK_DEBUG=1 uv run smoosense/app.py

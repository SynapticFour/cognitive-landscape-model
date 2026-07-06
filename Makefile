# CLM Makefile
# Cognitive Landscape Model — Synaptic Four research monorepo

.PHONY: help setup install clean update reset status verify test test-coverage type-check check

help:
	@echo "CLM — Cognitive Landscape Model (Synaptic Four)"
	@echo ""
	@echo "  make setup      Install dependencies and run quality checks"
	@echo "  make install    Install dependencies"
	@echo "  make test       Run type-check + unit/integration tests"
	@echo "  make test-coverage  Run tests with coverage (when configured)"
	@echo "  make type-check Run TypeScript across workspaces"
	@echo "  make check      Alias for test"
	@echo "  make verify     Verify gitignore (no artifacts committed)"
	@echo "  make clean      Remove build artifacts and coverage"
	@echo "  make status     Show Node/npm and git status"
	@echo ""

setup: install check verify
	@echo "Setup complete."

install:
	npm install

test:
	npm run test

test-coverage:
	npm run test:coverage

type-check:
	npm run type-check

check:
	npm run check

verify:
	npm run verify

clean:
	rm -rf coverage dist packages/*/dist
	find . -name '*.tsbuildinfo' -delete 2>/dev/null || true

update:
	npm update

reset: clean
	rm -rf node_modules
	npm install

status:
	@echo "Node: $$(node --version 2>/dev/null || echo 'not installed')"
	@echo "npm:  $$(npm --version 2>/dev/null || echo 'not installed')"
	@git status -sb 2>/dev/null || echo "Not a git repository"

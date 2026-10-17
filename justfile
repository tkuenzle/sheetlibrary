# List available recipes.
default:
    @just --list

# Install dependencies.
install:
    pnpm install

# Start the web app locally.
dev:
    pnpm --filter web dev

# Build all packages and apps.
build:
    pnpm -r --if-present run build

# Format all files.
fmt:
    pnpm format

# Verify formatting without changing files.
fmt-check:
    pnpm format:check

# Run ESLint.
lint:
    pnpm lint

# Type-check the repo.
typecheck:
    pnpm typecheck

# Run unit tests.
test:
    pnpm -r --if-present run test

# Run end-to-end tests against the built app.
e2e:
    pnpm -r --if-present run e2e

# Run all read-only checks, same as CI.
check: fmt-check lint typecheck test build e2e

# Validate the OpenSpec specs and active changes in strict mode.
spec-check:
    OPENSPEC_TELEMETRY=0 pnpm dlx @fission-ai/openspec@1.14.3 validate --all --strict

# Fix everything that can be fixed automatically: formatting and lint.
fix: fmt
    pnpm lint --fix

# List available recipes.
default:
    @just --list

# Install dependencies.
install:
    pnpm install

# Start the web app locally, with the local database up to date.
dev: migrate-local
    pnpm --filter web dev

# Apply the database migrations to the local database.
# --config: after a build, wrangler reads the build output's config, which has no migrations folder.
migrate-local:
    CI=true pnpm --filter web exec wrangler d1 migrations apply DB --local --config wrangler.jsonc

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
e2e: migrate-local
    pnpm -r --if-present run e2e

# Run all read-only checks, same as CI.
check: fmt-check lint typecheck test build e2e

# Validate the OpenSpec specs and active changes in strict mode.
spec-check:
    OPENSPEC_TELEMETRY=0 pnpm dlx @fission-ai/openspec@1.14.3 validate --all --strict

# Update the agent skills listed in skills-lock.json. Re-adds each one, since `skills update` moves some to .agents/.
skills-update:
    #!/usr/bin/env bash
    set -euo pipefail
    for skill in $(node -p 'Object.entries(require("./skills-lock.json").skills).map(([name, s]) => `${s.source}@${name}`).join(" ")'); do
        DO_NOT_TRACK=1 pnpm dlx skills@1.7.2 add "$skill" --agent claude-code --yes
    done

# Fix everything that can be fixed automatically: formatting and lint.
fix: fmt
    pnpm lint --fix

# Initialize OpenTofu with the R2 state backend. Needs R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.
tofu-init *args:
    cd infra && tofu init -input=false {{ args }} -backend-config=backend.tfbackend -backend-config="access_key=$R2_ACCESS_KEY_ID" -backend-config="secret_key=$R2_SECRET_ACCESS_KEY"

# Show planned infrastructure changes. Needs CLOUDFLARE_API_TOKEN.
tofu-plan *args:
    cd infra && tofu plan -input=false {{ args }}

# Apply infrastructure changes. Needs CLOUDFLARE_API_TOKEN.
tofu-apply *args:
    cd infra && tofu apply -input=false {{ args }}

# Build a preview and upload it to the preview worker under the given alias. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
preview alias:
    CLOUDFLARE_ENV=preview pnpm --filter web build
    # Applies the preview worker's URL settings (preview URLs on, no routes); versions upload doesn't.
    pnpm --filter web exec wrangler triggers deploy
    pnpm --filter web exec wrangler versions upload --preview-alias {{ alias }}

# Build, migrate the production database and deploy to production. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
deploy:
    pnpm --filter web build
    CI=true pnpm --filter web exec wrangler d1 migrations apply DB --remote --config wrangler.jsonc
    pnpm --filter web exec wrangler deploy

# Check that the site responds with a 2xx status.
smoke url="https://sheetlibrary.com":
    curl --fail --silent --show-error --output /dev/null --retry 5 --retry-delay 5 --retry-all-errors {{ url }}

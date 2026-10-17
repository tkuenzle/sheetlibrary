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

# Initialize OpenTofu with the R2 state backend. Needs R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.
tofu-init:
    cd infra && tofu init -input=false -backend-config=backend.tfbackend -backend-config="access_key=$R2_ACCESS_KEY_ID" -backend-config="secret_key=$R2_SECRET_ACCESS_KEY"

# Show planned infrastructure changes. Needs CLOUDFLARE_API_TOKEN.
tofu-plan *args:
    cd infra && tofu plan -input=false {{ args }}

# Apply infrastructure changes. Needs CLOUDFLARE_API_TOKEN.
tofu-apply *args:
    cd infra && tofu apply -input=false {{ args }}

# Build a preview and upload it to the preview worker under the given alias. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
preview alias:
    CLOUDFLARE_ENV=preview pnpm --filter web build
    pnpm --filter web exec wrangler versions upload --preview-alias {{ alias }}

# Build and deploy to production. Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
deploy:
    pnpm --filter web build
    pnpm --filter web exec wrangler deploy

# Check that the site responds with a 2xx status.
smoke url="https://sheetlibrary.com":
    curl --fail --silent --show-error --output /dev/null --retry 5 --retry-delay 5 --retry-all-errors {{ url }}

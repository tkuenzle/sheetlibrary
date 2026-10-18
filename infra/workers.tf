# Workers are created here without code, so they exist before the first deploy
# (the pull request token is scoped to the preview worker). wrangler uploads and
# deploys the code and owns everything set in apps/web/wrangler.jsonc.
resource "cloudflare_worker" "production" {
  account_id = var.cloudflare_account_id
  name       = "sheetlibrary"

  # Settings come from apps/web/wrangler.jsonc and are set by wrangler on deploy.
  lifecycle {
    ignore_changes = [observability, subdomain, tags, logpush, tail_consumers, previews_base_config]
  }
}

# Separate worker for pull request previews, so the pull request token can be
# scoped to it and never reach production.
resource "cloudflare_worker" "preview" {
  account_id = var.cloudflare_account_id
  name       = "sheetlibrary-preview"

  # Settings come from apps/web/wrangler.jsonc and are set by wrangler on deploy.
  lifecycle {
    ignore_changes = [observability, subdomain, tags, logpush, tail_consumers, previews_base_config]
  }
}

# The custom domain is set in apps/web/wrangler.jsonc and attached on deploy.
# It used to be managed here; this only drops it from the state.
removed {
  from = cloudflare_workers_custom_domain.apex

  lifecycle {
    destroy = false
  }
}

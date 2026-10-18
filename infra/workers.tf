# Workers are created here without code. wrangler uploads and deploys the code
# (.github/workflows), and owns the worker settings in apps/web/wrangler.jsonc.
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

resource "cloudflare_workers_custom_domain" "apex" {
  account_id = var.cloudflare_account_id
  zone_id    = cloudflare_zone.sheetlibrary.id
  hostname   = "sheetlibrary.com"
  service    = cloudflare_worker.production.name
}

# The AI gateway between the site and the model for photo import. It was
# created by hand, so previews could use it before this was first applied.
# Production and previews share it; their API keys keep the spending apart.
# The Worker gets its URL from PHOTO_GATEWAY_URL in apps/web/wrangler.jsonc.
import {
  to = cloudflare_ai_gateway.sheetlibrary
  id = "${var.cloudflare_account_id}/sheetlibrary"
}

resource "cloudflare_ai_gateway" "sheetlibrary" {
  account_id = var.cloudflare_account_id
  id         = "sheetlibrary"

  # The photos and the model's answers are not kept: no logs, no cache.
  collect_logs               = false
  cache_ttl                  = 0
  cache_invalidate_on_update = false

  # No rate limit. Each API key has a monthly spending cap instead.
  rate_limiting_interval  = 0
  rate_limiting_limit     = 0
  rate_limiting_technique = "fixed"

  # New gateways only take requests with a gateway token, and this can't be
  # turned off. Each Worker has its own token in PHOTO_GATEWAY_TOKEN.
  authentication = true
}

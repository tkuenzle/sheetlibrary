# The databases were created by hand so their ids could go into
# apps/web/wrangler.jsonc before this was first applied. This repo owns them.
# They hold people's accounts, so a plan that would replace one fails.
import {
  to = cloudflare_d1_database.production
  id = "${var.cloudflare_account_id}/75d27270-9d84-4a2d-89f2-465359984167"
}

resource "cloudflare_d1_database" "production" {
  account_id = var.cloudflare_account_id
  name       = "sheetlibrary"

  lifecycle {
    prevent_destroy = true
  }
}

# Shared by every pull request preview. Its data is throwaway, but a reset is
# done by dropping tables, not by replacing the database, so its id stays.
import {
  to = cloudflare_d1_database.preview
  id = "${var.cloudflare_account_id}/4eae04d8-718f-4179-b4a6-5db18e1cafad"
}

resource "cloudflare_d1_database" "preview" {
  account_id = var.cloudflare_account_id
  name       = "sheetlibrary-preview"

  lifecycle {
    prevent_destroy = true
  }
}

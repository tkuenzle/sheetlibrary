# The zone was created by hand in the dashboard. This repo owns it from now on.
import {
  to = cloudflare_zone.sheetlibrary
  id = var.zone_id
}

resource "cloudflare_zone" "sheetlibrary" {
  account = { id = var.cloudflare_account_id }
  name    = "sheetlibrary.com"
  type    = "full"

  lifecycle {
    prevent_destroy = true
  }
}

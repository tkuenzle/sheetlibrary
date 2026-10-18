# The zone was created by hand and imported. This repo owns it.
resource "cloudflare_zone" "sheetlibrary" {
  account = { id = var.cloudflare_account_id }
  name    = "sheetlibrary.com"
  type    = "full"

  lifecycle {
    prevent_destroy = true
  }
}

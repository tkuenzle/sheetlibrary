# Sign-in emails come from mail.sheetlibrary.com, so their sender reputation
# stays apart from the main domain. It was set up by hand so this pull request's
# preview could send before the first apply. Cloudflare publishes its DNS
# records itself, so they aren't defined here.
#
# Email sending is also on for sheetlibrary.com itself, with its own DNS
# records. The dashboard can't turn it off without turning sending off for the
# subdomain too, and the provider has no resource for it, so it stays outside
# this repo. Nothing sends from it.
import {
  to = cloudflare_email_sending_subdomain.mail
  id = "${cloudflare_zone.sheetlibrary.id}/745be574ac6d4ff497f143553dbc4170"
}

resource "cloudflare_email_sending_subdomain" "mail" {
  zone_id = cloudflare_zone.sheetlibrary.id
  name    = "mail.sheetlibrary.com"

  # The activity log would show sign-in links to anyone who can read it.
  preview_enabled = false
}

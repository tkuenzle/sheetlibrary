# Sign-in emails come from mail.sheetlibrary.com, so their sender reputation
# stays apart from the main domain. Email sending is set up by hand, not here:
# Cloudflare refuses OpenTofu's read of the sending subdomain (401, code 2036)
# even with Zone Settings Edit on the token, likely because the account is on
# Workers Free. Cloudflare publishes the DNS records for it itself.
#
# Email sending is also on for sheetlibrary.com itself, with its own DNS
# records. The dashboard can't turn it off without turning sending off for the
# subdomain too. Nothing sends from it.
#
# Set by hand: message previews in the activity log are off for
# mail.sheetlibrary.com, so the log never shows sign-in links.

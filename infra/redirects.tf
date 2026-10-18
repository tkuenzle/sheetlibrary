# www has no content of its own. The proxied placeholder record lets Cloudflare
# answer for it, and the rule below redirects every request to the apex.
resource "cloudflare_dns_record" "www" {
  zone_id = cloudflare_zone.sheetlibrary.id
  name    = "www"
  type    = "AAAA"
  content = "100::"
  ttl     = 1
  proxied = true
  comment = "Placeholder for the www -> apex redirect"
}

resource "cloudflare_ruleset" "redirects" {
  zone_id = cloudflare_zone.sheetlibrary.id
  name    = "Redirects"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = [{
    ref         = "www_to_apex"
    description = "Redirect www to the apex, keeping path and query"
    expression  = "(http.host eq \"www.sheetlibrary.com\")"
    action      = "redirect"
    action_parameters = {
      from_value = {
        status_code           = 301
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://sheetlibrary.com\", http.request.uri.path)"
        }
      }
    }
  }]
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "zone_id" {
  description = "ID of the existing sheetlibrary.com zone. Only used to import it once; after that the zone is managed here."
  type        = string
}

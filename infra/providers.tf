terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.28"
    }
  }
  required_version = ">= 1.10"

  backend "s3" {}
}

provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN from the environment.
}

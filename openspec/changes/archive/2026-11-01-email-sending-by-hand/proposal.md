# Proposal

## Why

The first deploy after #49 fails. Cloudflare refuses OpenTofu's read of the `mail.sheetlibrary.com` sending subdomain with `401 Unauthorized` (code 2036), even with Zone Settings Edit on the token. Email sending may only be manageable through the API on Workers Paid. Until the read works, no deploy from `main` can run.

## What Changes

- `mail.sheetlibrary.com` leaves `infra/`. It stays set up by hand, like email sending on the main domain, and `infra/email.tf` says why.
- The pull request plan no longer needs to leave it out.
- Message previews in the activity log stay off by hand, since the code no longer enforces it.
- The databases stay in code and are still imported on the next apply.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `infrastructure`: email sending is set up by hand for now, not in code.

## Impact

- `infra/email.tf`, `.github/workflows/infra-plan.yml`.
- #71 brings the subdomain back into `infra/` once the API allows it.

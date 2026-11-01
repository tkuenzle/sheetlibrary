# Tasks

## 1. Email sending by hand

- [x] 1.1 Remove the `mail.sheetlibrary.com` import and resource from `infra/email.tf`, keeping a comment on why sending is set up by hand. Verify the configuration is valid and formatted
- [x] 1.2 Drop the email `-exclude` from `infra-plan.yml`. Verify the pull request plan passes and destroys nothing
- [x] 1.3 Verify that message previews are off for `mail.sheetlibrary.com` in the dashboard (owner)

## Workflow follow-up

- #71 manages `mail.sheetlibrary.com` in `infra/` again once the API allows it.
- After merge, verify the deploy imports the databases, runs the migrations and passes the smoke check.

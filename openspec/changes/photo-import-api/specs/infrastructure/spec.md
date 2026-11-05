# Spec Delta

## MODIFIED Requirements

### Requirement: Cloudflare setup in code
The sheetlibrary.com zone, its DNS records, the hosting of the site, its databases and its AI gateway SHALL be defined in this repository. This repository SHALL be the only owner of the zone, except for email sending and the DNS records Cloudflare adds for it, which are set up by hand for now.

#### Scenario: Existing zone taken over
- **WHEN** the infrastructure is first applied
- **THEN** the existing sheetlibrary.com zone is imported, not recreated or deleted

#### Scenario: Existing databases taken over
- **WHEN** the infrastructure is first applied after the databases were created by hand
- **THEN** the databases are imported, not recreated or deleted

#### Scenario: AI gateway without logs
- **WHEN** the infrastructure is applied
- **THEN** the AI gateway exists with its logs turned off

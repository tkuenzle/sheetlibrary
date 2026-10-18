# infrastructure Specification

## Purpose

Keeps the Cloudflare setup for sheetlibrary.com in code, so every infrastructure change is reviewed in a pull request and applied automatically.

## Requirements

### Requirement: Cloudflare setup in code
The sheetlibrary.com zone, its DNS records and the hosting of the site SHALL be defined in this repository. This repository SHALL be the only owner of the zone.

#### Scenario: Existing zone taken over
- **WHEN** the infrastructure is first applied
- **THEN** the existing sheetlibrary.com zone is imported, not recreated or deleted

### Requirement: Plan on pull request
A pull request that changes the infrastructure SHALL show the planned infrastructure changes, without applying them.

#### Scenario: Infrastructure change proposed
- **WHEN** a pull request changes the infrastructure code
- **THEN** the planned changes are shown in the pipeline, and nothing in Cloudflare changes

### Requirement: Apply on merge
A merge to `main` that changes the infrastructure SHALL apply those changes without any manual step, before the site is deployed.

#### Scenario: Infrastructure change merged
- **WHEN** a pull request changing the infrastructure is merged to `main`
- **THEN** the changes are applied in Cloudflare, and the site deploy runs after that

### Requirement: No secrets in the repository
Credentials for Cloudflare and the state storage SHALL NOT be stored in the repository. The pipeline SHALL read them from its secret store.

#### Scenario: Pipeline needs credentials
- **WHEN** the pipeline plans or applies infrastructure
- **THEN** it reads the credentials from the CI secret store

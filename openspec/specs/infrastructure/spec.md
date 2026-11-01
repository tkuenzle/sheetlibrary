# infrastructure Specification

## Purpose

Keeps the Cloudflare setup for sheetlibrary.com in code, so every infrastructure change is reviewed in a pull request and applied automatically.

## Requirements

### Requirement: Cloudflare setup in code
The sheetlibrary.com zone, its DNS records, the hosting of the site and its databases SHALL be defined in this repository. This repository SHALL be the only owner of the zone, except for email sending and the DNS records Cloudflare adds for it, which are set up by hand for now.

#### Scenario: Existing zone taken over
- **WHEN** the infrastructure is first applied
- **THEN** the existing sheetlibrary.com zone is imported, not recreated or deleted

#### Scenario: Existing databases taken over
- **WHEN** the infrastructure is first applied after the databases were created by hand
- **THEN** the databases are imported, not recreated or deleted

### Requirement: Plan on pull request
A pull request that changes the infrastructure SHALL show the planned infrastructure changes, without applying them. The plan SHALL leave out the databases, because reading them would give pull requests access to production data. Changes to them SHALL be planned and applied only on merge.

#### Scenario: Infrastructure change proposed
- **WHEN** a pull request changes the infrastructure code
- **THEN** the planned changes are shown in the pipeline, and nothing in Cloudflare changes

#### Scenario: Database change proposed
- **WHEN** a pull request changes a database's settings in the infrastructure code
- **THEN** the pull request's plan doesn't show it, and the merge applies it

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

### Requirement: No email addresses in the repository
Invited email addresses SHALL NOT be stored in the repository, because it is public. They SHALL be kept in Cloudflare only.

#### Scenario: Inviting someone
- **WHEN** a person is invited
- **THEN** their address is added in Cloudflare, and no file in the repository changes

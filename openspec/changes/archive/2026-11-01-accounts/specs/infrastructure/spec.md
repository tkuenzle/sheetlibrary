# Spec Delta

## MODIFIED Requirements

### Requirement: Cloudflare setup in code
The sheetlibrary.com zone, its DNS records, the hosting of the site, its databases and its email sending SHALL be defined in this repository. This repository SHALL be the only owner of the zone.

#### Scenario: Existing zone taken over
- **WHEN** the infrastructure is first applied
- **THEN** the existing sheetlibrary.com zone is imported, not recreated or deleted

#### Scenario: Existing databases taken over
- **WHEN** the infrastructure is first applied after the databases were created by hand
- **THEN** the databases are imported, not recreated or deleted

### Requirement: Plan on pull request
A pull request that changes the infrastructure SHALL show the planned infrastructure changes, without applying them. The plan SHALL leave out the databases and email sending, because reading them would give pull requests access to production data and sign-in links. Changes to those SHALL be planned and applied only on merge.

#### Scenario: Infrastructure change proposed
- **WHEN** a pull request changes the infrastructure code
- **THEN** the planned changes are shown in the pipeline, and nothing in Cloudflare changes

#### Scenario: Database change proposed
- **WHEN** a pull request changes a database's settings in the infrastructure code
- **THEN** the pull request's plan doesn't show it, and the merge applies it

## ADDED Requirements

### Requirement: No email addresses in the repository
Invited email addresses SHALL NOT be stored in the repository, because it is public. They SHALL be kept in Cloudflare only.

#### Scenario: Inviting someone
- **WHEN** a person is invited
- **THEN** their address is added in Cloudflare, and no file in the repository changes

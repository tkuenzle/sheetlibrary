# Spec Delta

## MODIFIED Requirements

### Requirement: Pull requests can't change production
The credentials available to pull request jobs SHALL NOT allow changing the production site, its worker, its database or its DNS.

#### Scenario: Pull request credentials used against production
- **WHEN** the pull request credentials are used to deploy to the production worker or to change a DNS record
- **THEN** Cloudflare rejects the request

#### Scenario: Pull request credentials used against the production database
- **WHEN** the pull request credentials are used to query or change the production database
- **THEN** Cloudflare rejects the request

## ADDED Requirements

### Requirement: Database changes before deploy
A merge to `main` that changes the database schema SHALL apply the changes to the production database before the new version is deployed. If applying them fails, the deploy SHALL stop.

#### Scenario: New table merged
- **WHEN** a pull request that adds a table is merged
- **THEN** the production database has the table before the new version serves requests

### Requirement: Preview database
Previews SHALL use a database of their own, shared by all pull requests and apart from production. Each preview deploy SHALL bring that database up to its own schema.

#### Scenario: Pull request adds a table
- **WHEN** a pull request that adds a table is deployed as a preview
- **THEN** the preview database has the table, and the production database doesn't

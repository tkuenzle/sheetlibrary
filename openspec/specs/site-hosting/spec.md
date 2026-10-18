# site-hosting Specification

## Purpose

Serves the web app at sheetlibrary.com and deploys it automatically, with a preview for every pull request.

## Requirements

### Requirement: Public site
The site SHALL be reachable over HTTPS at `https://sheetlibrary.com` without signing in.

#### Scenario: Opening the site
- **WHEN** a visitor opens `https://sheetlibrary.com`
- **THEN** the site responds with a successful (2xx) status and shows the current page

### Requirement: www redirect
Requests to `www.sheetlibrary.com` SHALL redirect permanently to the same path on `sheetlibrary.com`.

#### Scenario: Opening the www address
- **WHEN** a visitor opens `https://www.sheetlibrary.com/some/path`
- **THEN** they are redirected with a permanent (301 or 308) status to `https://sheetlibrary.com/some/path`

### Requirement: Deploy on merge
A merge to `main` SHALL deploy the new version to `https://sheetlibrary.com` without any manual step.

#### Scenario: Change merged
- **WHEN** a pull request is merged to `main`
- **THEN** the site at `https://sheetlibrary.com` serves the merged version

### Requirement: Check after deploy
After each production deploy, the pipeline SHALL request `https://sheetlibrary.com` and SHALL fail if it does not get a successful (2xx) response.

#### Scenario: Site down after deploy
- **WHEN** the site does not respond with 2xx after a deploy
- **THEN** the deploy run fails

### Requirement: Preview per pull request
Every pull request SHALL get its own preview deploy, and its link SHALL be posted on the pull request. A preview SHALL NOT change what `https://sheetlibrary.com` serves.

#### Scenario: Pull request opened
- **WHEN** a pull request is opened or updated
- **THEN** a preview of that commit is deployed and its link appears on the pull request, while `https://sheetlibrary.com` stays unchanged

### Requirement: Pull requests can't change production
The credentials available to pull request jobs SHALL NOT allow changing the production site, its worker or its DNS.

#### Scenario: Pull request credentials used against production
- **WHEN** the pull request credentials are used to deploy to the production worker or to change a DNS record
- **THEN** Cloudflare rejects the request

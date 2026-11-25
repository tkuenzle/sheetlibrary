# ci-pipeline Specification

## Purpose

Checks every pull request automatically, so broken code, style drift and invalid specs are caught before merge.

## Requirements

### Requirement: Checks run on every pull request
The CI pipeline SHALL run automatically when a pull request is opened or updated.

#### Scenario: New commit on a pull request
- **WHEN** a commit is pushed to a pull request's branch
- **THEN** the pipeline runs against that commit

### Requirement: Code checks
The pipeline SHALL check linting, formatting, types, unit tests, the production build and end-to-end tests. It SHALL fail if any of them fails.

#### Scenario: A unit test fails
- **WHEN** a pull request contains code that makes a unit test fail
- **THEN** the pipeline fails and shows the failing test

#### Scenario: Type error
- **WHEN** a pull request contains a type error
- **THEN** the pipeline fails and shows the error

### Requirement: Spec validation
The pipeline SHALL validate all OpenSpec specs and active changes in strict mode, and SHALL fail if validation fails.

#### Scenario: Invalid change artifact
- **WHEN** a pull request contains a spec that fails strict validation
- **THEN** the pipeline fails and shows the validation error

### Requirement: Same checks locally
Every check the pipeline runs SHALL also be runnable locally with a single command.

#### Scenario: Running checks before pushing
- **WHEN** a developer runs the project's check command locally
- **THEN** the same code checks run as in the pipeline

### Requirement: End-to-end tests start clean
Each end-to-end run SHALL start with an empty database of its own, so no test sees data from an earlier run. A test that needs an account SHALL get one that no other worker uses during the run. Running the tests SHALL NOT change the local database used for development.

#### Scenario: A second run
- **WHEN** the end-to-end tests run twice in a row
- **THEN** the second run's account has no sheets from the first run

#### Scenario: Two workers at once
- **WHEN** two workers make sheets at the same time
- **THEN** neither worker's list shows the other's sheets

### Requirement: Evidence from failed end-to-end tests
The pipeline SHALL keep a trace of each end-to-end test that failed or needed a retry, so it can be looked into after the run. It SHALL list flaky tests by name in the run's summary. A test that passes only on its retry SHALL fail the run.

#### Scenario: A test passes only on its retry
- **WHEN** an end-to-end test fails once and passes on its retry
- **THEN** the run fails, the run's summary names that test, and its trace can be downloaded from the run

### Requirement: End-to-end tests don't race the clock
An end-to-end test SHALL NOT pass or fail by how fast the server or the browser happens to be. A test that measures motion SHALL wait for it to end. A test of a brief state SHALL hold that state's data while it checks it. Timing that a test adds SHALL only make data late.

#### Scenario: A brief state
- **WHEN** a test checks that a search shows "Searching…"
- **THEN** the search's data is held until the check is done

#### Scenario: A measure after motion
- **WHEN** a test measures a panel that slides in
- **THEN** it measures once the slide-in has ended

### Requirement: Tests that need data in time run alone
An end-to-end test whose data must come within the app's set wait SHALL run after all other tests, with no other test running at the same time.

#### Scenario: A full run
- **WHEN** the end-to-end tests run with the default number of workers
- **THEN** the tests whose data must come in time start once the others have finished, one at a time

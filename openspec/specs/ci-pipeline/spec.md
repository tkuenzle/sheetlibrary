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

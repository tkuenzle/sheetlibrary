# Spec Delta

## ADDED Requirements

### Requirement: End-to-end tests start clean
Each end-to-end run SHALL start with an empty database of its own, so no test sees data from an earlier run. A test that needs an account SHALL get one that no other worker uses during the run. Running the tests SHALL NOT change the local database used for development.

#### Scenario: A second run
- **WHEN** the end-to-end tests run twice in a row
- **THEN** the second run's account has no sheets from the first run

#### Scenario: Two workers at once
- **WHEN** two workers make sheets at the same time
- **THEN** neither worker's list shows the other's sheets

### Requirement: Evidence from failed end-to-end tests
The pipeline SHALL keep a trace of each end-to-end test that failed or needed a retry, so it can be looked into after the run. It SHALL list flaky tests by name in the run's summary, even when the run passes.

#### Scenario: A test passes only on its retry
- **WHEN** an end-to-end test fails once and passes on its retry
- **THEN** the run's summary names that test, and its trace can be downloaded from the run

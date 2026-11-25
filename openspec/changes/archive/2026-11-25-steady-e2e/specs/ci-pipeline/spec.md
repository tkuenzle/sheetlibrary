# Spec Delta

## MODIFIED Requirements

### Requirement: Evidence from failed end-to-end tests
The pipeline SHALL keep a trace of each end-to-end test that failed or needed a retry, so it can be looked into after the run. It SHALL list flaky tests by name in the run's summary. A test that passes only on its retry SHALL fail the run.

#### Scenario: A test passes only on its retry
- **WHEN** an end-to-end test fails once and passes on its retry
- **THEN** the run fails, the run's summary names that test, and its trace can be downloaded from the run

## ADDED Requirements

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

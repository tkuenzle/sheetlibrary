# Spec Delta

## ADDED Requirements

### Requirement: Same look however a page is reached
A page SHALL look the same whether it was loaded in full or reached by a move from any other page.

#### Scenario: A collection reached two ways
- **WHEN** a person opens `/collections/christmas` directly, and later reaches it from `/account` through the rail
- **THEN** the page looks the same both times

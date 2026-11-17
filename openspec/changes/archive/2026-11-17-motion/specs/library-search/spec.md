# Spec Delta

## MODIFIED Requirements

### Requirement: A slow search
When a search takes more than a moment, the field SHALL say "Searching…" in place of the count, and the results shown SHALL be marked busy until the new ones arrive. They SHALL NOT be dimmed. Typing SHALL never wait for a search.

#### Scenario: Slow connection
- **WHEN** a person types "grace" and the results take two seconds to arrive
- **THEN** the field says "Searching…" and the earlier results stay as they are, until the results for "grace" show

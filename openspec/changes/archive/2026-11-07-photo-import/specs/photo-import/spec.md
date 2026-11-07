# Spec Delta

## ADDED Requirements

### Requirement: At most 10 photos
`POST /api/photo-import` SHALL refuse a request with more than 10 photos, and the model SHALL NOT be called.

#### Scenario: Eleven photos
- **WHEN** a signed-in person sends 11 photos
- **THEN** the request is refused, and no model is called

# Spec Delta

## Purpose

The frame shared by the site's pages: the top bar that names the site and leads back to the home page.

## ADDED Requirements

### Requirement: Top bar
The home page and the editor page SHALL show a top bar with the name "Sheet Library" as a link to the home page. The `/design` page SHALL NOT have it.

#### Scenario: Going home from the editor
- **WHEN** a visitor on `/editor` clicks "Sheet Library" in the top bar
- **THEN** the home page opens

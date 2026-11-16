# Spec Delta

## MODIFIED Requirements

### Requirement: Rail with icons on middle screens
In a window from 641px to 1023px wide, the rail SHALL show icons for "Sheets", "Collections" and the account, each with its name under it. It SHALL start with a menu button named "Open navigation". The rail SHALL NOT list the collections or show the site's name.

#### Scenario: On a tablet
- **WHEN** a person opens `/sheets` in a window 800px wide
- **THEN** the rail shows "Open navigation", then "Sheets", "Collections" and "Account" with their icons, and the link "Collections" opens `/collections`

## ADDED Requirements

### Requirement: Opening the rail on middle screens
In a window from 641px to 1023px wide, "Open navigation" SHALL open the full rail over the dimmed page, as wide screens show it, with a "Close" button next to the site's name. It SHALL be modal: focus SHALL move into it, and the page behind it SHALL be inert. It SHALL slide in from the left, except with reduced motion.

#### Scenario: Opening a collection from the opened rail
- **WHEN** a person on `/sheets`, in a window 800px wide, selects "Open navigation" and then "Christmas"
- **THEN** the rail closes, and the collection "Christmas" opens

### Requirement: Closing the opened rail
The opened rail SHALL close when an entry is picked, on "Close", on Escape, on a tap on the dimmed page, and when the window becomes narrower than 641px or wider than 1023px. Unless an entry was picked, focus SHALL go back to "Open navigation".

#### Scenario: Closing with Escape
- **WHEN** a person opens the rail in a window 800px wide and presses Escape
- **THEN** the rail closes, and focus is on "Open navigation"

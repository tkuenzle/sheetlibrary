# Spec Delta

## ADDED Requirements

### Requirement: Landing after sign-in
After signing in, by email link or by passkey, a person SHALL land in the library. A signed-in person who opens the sign-in page SHALL be sent to the library too.

#### Scenario: Opening the email link
- **WHEN** a person opens the sign-in link from their email
- **THEN** they are signed in and the library opens

## REMOVED Requirements

### Requirement: Offer a passkey
**Reason**: Signing in now lands in the library, not on the account page that held the offer.
**Migration**: A passkey can still be added on the account page. #80 brings the offer to the library.

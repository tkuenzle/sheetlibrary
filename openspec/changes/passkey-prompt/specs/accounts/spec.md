## ADDED Requirements

### Requirement: Offer a passkey
After a person signs in with an email link, the library SHALL offer to add a passkey for this device, unless the account already has a passkey or this device has closed the offer. "Add passkey" SHALL open the account page. A passkey sign-in SHALL NOT show the offer, and a reload of the library SHALL NOT bring it back.

#### Scenario: First email sign-in
- **WHEN** a person whose account has no passkey opens the sign-in link from their email
- **THEN** the library opens with "Add a passkey to sign in on this device without waiting for an email." and "Add passkey"

#### Scenario: Opening the account page
- **WHEN** a person selects "Add passkey" in the offer
- **THEN** the account page opens

#### Scenario: Account with a passkey
- **WHEN** a person whose account has a passkey signs in with an email link
- **THEN** the library opens without the offer

### Requirement: Close the passkey offer
The offer SHALL have a close button named "Close". Closing it SHALL hide the offer and SHALL keep it from showing again on this device, after later email sign-ins too.

#### Scenario: Closed before
- **WHEN** a person closes the offer, signs out and signs in with an email link again on the same device
- **THEN** the library opens without the offer

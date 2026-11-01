# Spec Delta

## Purpose

Lets people have an account and sign in to it, by email link or passkey, so the sheets they store belong to them.

## ADDED Requirements

### Requirement: Sign in with an email link
On the sign-in page, a person SHALL be able to enter their email and get a link by email. Opening the link SHALL sign them in. If no account has that email, opening the link SHALL create one. A link SHALL work only once and only for a limited time.

#### Scenario: First sign-in
- **WHEN** an invited person with no account enters their email and opens the link they get
- **THEN** an account with that email is created and they are signed in

#### Scenario: Link used twice
- **WHEN** a person opens a sign-in link they have already used
- **THEN** they are not signed in

### Requirement: Invite-only sign-in
Sign-in emails SHALL only go to invited addresses. A person who enters an address that isn't invited SHALL see "Sheet Library is invite-only for now." and SHALL get no email.

#### Scenario: Uninvited email
- **WHEN** a person enters an email that isn't invited
- **THEN** the page says "Sheet Library is invite-only for now." and no email is sent

### Requirement: Limit on sign-in emails
The site SHALL limit how many sign-in emails can be asked for in a short time, for each address and each visitor. A request over the limit SHALL send no email and SHALL say to try again later.

#### Scenario: Too many requests
- **WHEN** a visitor asks for sign-in links many times in a row
- **THEN** the requests over the limit send no email

### Requirement: Account data
An account SHALL hold the person's email, which the link has confirmed. Signing up SHALL ask for nothing but the email.

#### Scenario: Signing up
- **WHEN** an invited person signs up
- **THEN** they are asked only for their email

### Requirement: Offer a passkey
After a person signs in with an email link, the site SHALL offer to add a passkey for this device. They SHALL be able to skip it.

#### Scenario: Adding a passkey after an email sign-in
- **WHEN** a person signs in with an email link and accepts the offer
- **THEN** a passkey for their account is saved on the device

### Requirement: Sign in with a passkey
On the sign-in page, a person SHALL be able to sign in with a passkey they added before, without entering their email.

#### Scenario: Returning on the same device
- **WHEN** a person with a passkey on this device chooses to sign in with a passkey and confirms it
- **THEN** they are signed in to their account

### Requirement: Account page
A signed-in person SHALL have an account page that shows their email and their passkeys. On it they SHALL be able to add a passkey, rename one, remove one and sign out. A visitor who isn't signed in SHALL be sent to the sign-in page.

#### Scenario: Removing a lost device's passkey
- **WHEN** a person removes a passkey on the account page
- **THEN** that passkey no longer signs them in

#### Scenario: Signing out
- **WHEN** a person signs out on the account page
- **THEN** they are no longer signed in on this device

### Requirement: Previews have their own accounts
A pull request preview SHALL keep its accounts apart from production. An account made on a preview SHALL NOT sign in on `https://sheetlibrary.com`, and the other way round.

#### Scenario: Production account on a preview
- **WHEN** a person with an account on `https://sheetlibrary.com` signs in on a preview
- **THEN** the preview treats them as a person without an account

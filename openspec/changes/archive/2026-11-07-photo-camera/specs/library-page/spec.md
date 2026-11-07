# Spec Delta

## MODIFIED Requirements

### Requirement: The photos in the dialog
The dialog SHALL list the photos as pages, in the order they were added. "Pick photos" SHALL add more at the end, up to 10 pages, and each page SHALL have a button to remove it. Import SHALL be disabled while there is no page.

#### Scenario: Removing a page
- **WHEN** a person adds three photos and removes page 2
- **THEN** the dialog lists two pages, the first and the third photo, as page 1 and page 2

#### Scenario: Ten pages
- **WHEN** a person has added 10 photos
- **THEN** "Pick photos" and "Take photo" are disabled

## ADDED Requirements

### Requirement: Take a photo with the camera
Where the browser can take a photo from the page, as on phones and tablets, the dialog SHALL show "Take photo" before "Pick photos", and give it more weight. It SHALL open the back camera, and add the photo taken as the next page. Where the browser can't, as on a desktop, the dialog SHALL show only "Pick photos".

#### Scenario: On an Android phone
- **WHEN** a person on an Android phone has added two pages and takes a photo with "Take photo"
- **THEN** the photo is listed as page 3

#### Scenario: On a desktop
- **WHEN** a person opens the dialog on a desktop
- **THEN** it shows "Pick photos" and no "Take photo"

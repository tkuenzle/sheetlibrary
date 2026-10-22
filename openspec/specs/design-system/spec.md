# design-system Specification

## Purpose

The look shared by all pages: a light and a dark style, the font and icons, and a page for checking the base components.

## Requirements

### Requirement: Light and lamplight styles
The pages SHALL use the light style when the system is set to light, and the lamplight style when it is set to dark.

#### Scenario: Dark system
- **WHEN** a visitor whose system is set to dark opens a page
- **THEN** the page uses the lamplight colors

### Requirement: Fonts and icons from the site
The font and the icons SHALL be served from the site itself. Pages SHALL NOT load fonts or icons from another origin.

#### Scenario: Loading a page
- **WHEN** a visitor opens a page
- **THEN** every font and icon request goes to the page's own origin

### Requirement: Visible in forced colors
In forced colors mode, such as Windows high contrast, buttons, toolbars, tooltips, popovers and notes SHALL keep a visible outline, so they can still be told apart from the page.

#### Scenario: High contrast
- **WHEN** a visitor with forced colors on opens a page with a tonal button
- **THEN** the button shows an outline in a system color

### Requirement: Design page in previews only
A `/design` page SHALL show each base component in the light and the lamplight style. It SHALL exist in pull request previews and in local development, and SHALL NOT exist on `https://sheetlibrary.com`. It SHALL ask search engines not to index it.

#### Scenario: Opening it in a preview
- **WHEN** a reviewer opens `/design` on a pull request's preview
- **THEN** the page shows the base components in both styles

#### Scenario: Opening it in production
- **WHEN** a visitor opens `https://sheetlibrary.com/design`
- **THEN** the site responds with 404

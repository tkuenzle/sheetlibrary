// The widths every layout rule uses (see docs/design-direction.md): phone up
// to 640px, middle up to 1023px, wide from 1024px. At 640px, the margin
// beside the sections gets too narrow for the section toolbar; from 1024px,
// the side panel fits beside the editor. CSS can't use these in @media, so
// the CSS writes the same widths, and breakpoints.test.ts checks that it
// uses no others.
export const phoneMaxWidth = 640;
export const wideMinWidth = 1024;

export const phone = `(max-width: ${String(phoneMaxWidth)}px)`;
export const belowWide = `(max-width: ${String(wideMinWidth - 1)}px)`;
export const wide = `(min-width: ${String(wideMinWidth)}px)`;

// The media queries CSS may use, as they are written there.
export const mediaWidths = [phone, belowWide, wide];

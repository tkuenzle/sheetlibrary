import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NOT_READ, PhotoImportView } from "./photo-import-dialog";
import type { Page, PhotoImportState } from "./photo-import-state";

function nothing() {
  return undefined;
}

const ready = (id: number): Page => ({
  id,
  status: "ready",
  photo: new Blob([]),
  thumbnail: `blob:page-${String(id)}`,
});

function render(
  state: Partial<PhotoImportState>,
  { now = 0, camera = false } = {},
) {
  return renderToString(
    <PhotoImportView
      titleId="title"
      state={{ pages: [], stage: { kind: "pages" }, ...state }}
      now={now}
      camera={camera}
      onAdd={nothing}
      onRemove={nothing}
      onCancel={nothing}
      onImport={nothing}
    />,
  );
}

const pickPhotos = (variant: string) =>
  new RegExp(
    `<button[^>]*class="button button-${variant}"[^>]*>.*?Pick photos`,
  );

const importButton = /<button type="submit"[^>]*>Import<\/button>/;
const disabledImport = /<button type="submit"[^>]*disabled=""[^>]*>Import/;

describe("PhotoImportView", () => {
  it("names the dialog and asks for a photo of each page", () => {
    const html = render({});
    expect(html).toContain('<h2 id="title">Import from photos</h2>');
    expect(html).toContain("Take or pick a photo of each page, in order");
  });

  // Scenario "On a desktop".
  it("offers Pick photos alone, for any image, with Import disabled", () => {
    const html = render({});
    expect(html).toMatch(/<input type="file" accept="image\/\*" multiple=""/);
    expect(html).toMatch(pickPhotos("tonal"));
    expect(html).not.toContain("capture");
    expect(html).not.toContain("Take photo");
    expect(html).not.toContain("<ol");
    expect(html).toMatch(disabledImport);
    expect(html).toContain("Cancel");
  });

  // Scenario "On an Android phone".
  it("offers Take photo first with the camera, then Pick photos", () => {
    const html = render({ pages: [ready(1), ready(2)] }, { camera: true });
    expect(html).toMatch(
      /<input type="file" accept="image\/\*" capture="environment"[^>]*>.*?Take photo.*?<input type="file" accept="image\/\*" multiple=""[^>]*>.*?Pick photos/s,
    );
    expect(html).toMatch(
      /<button[^>]*class="button button-tonal"[^>]*>.*?Take photo/,
    );
    expect(html).toMatch(pickPhotos("text"));
    expect(html).toContain("2 of 10 pages");
  });

  // Scenario "Removing a page".
  it("lists the pages in order, each with a thumbnail and Remove", () => {
    const html = render({ pages: [ready(1), ready(3)] });
    expect(html).toMatch(/<ol class="photo-import-pages" aria-label="Pages">/);
    expect(html).toMatch(
      /src="blob:page-1".*Page 1.*src="blob:page-3".*Page 2/s,
    );
    expect(html).toContain('aria-label="Remove page 1"');
    expect(html).toContain('aria-label="Remove page 2"');
    expect(html).toContain("2 of 10 pages");
    expect(html).toMatch(importButton);
    expect(html).not.toMatch(disabledImport);
  });

  // Scenario "Ten pages".
  it("disables Take photo and Pick photos at 10 pages", () => {
    const pages = Array.from({ length: 10 }, (_, at) => ready(at + 1));
    const html = render({ pages }, { camera: true });
    expect(html).toContain("10 of 10 pages");
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>(?:(?!<button).)*Take photo/s,
    );
    expect(html).toMatch(
      /<button[^>]*disabled=""[^>]*>(?:(?!<button).)*Pick photos/s,
    );
  });

  // Scenario "A HEIC photo on a desktop".
  it("says when a photo can't be opened, with Import disabled", () => {
    const html = render({ pages: [ready(1), { id: 2, status: "unopenable" }] });
    expect(html).toContain(
      "This photo can’t be opened. Remove it, or add it as a JPEG.",
    );
    expect(html).toMatch(disabledImport);
  });

  it("waits with Import while a photo is shrunk", () => {
    const html = render({ pages: [{ id: 1, status: "shrinking" }] });
    expect(html).toContain("Page 1");
    expect(html).toMatch(disabledImport);
  });

  it("shows the upload in percent, with the pages fixed", () => {
    const html = render({
      pages: [ready(1)],
      stage: { kind: "uploading", percent: 60 },
    });
    expect(html).toMatch(/<label for="[^"]+">Uploading the photos… 60%/);
    expect(html).toMatch(/<progress id="[^"]+" value="60" max="100">/);
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(
      /aria-label="Remove page 1"[^>]*disabled=""|disabled=""[^>]*aria-label="Remove page 1"/,
    );
    expect(html).not.toContain("Pick photos");
    expect(html).toMatch(disabledImport);
    // Cancel works the whole time.
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Cancel/);
  });

  // Scenario "A slow reading".
  it("shows the reading with the time so far", () => {
    const html = render(
      { pages: [ready(1)], stage: { kind: "reading", since: 1000 } },
      { now: 43_000 },
    );
    expect(html).toContain('<span role="status">Reading the pages…</span>');
    expect(html).toContain("0:42");
    expect(html).toContain("This can take up to 2 minutes");
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Cancel/);
  });

  // Scenario "Trying again".
  it("says the photos couldn't be read, and lets Import try again", () => {
    const html = render({ pages: [ready(1)], stage: { kind: "failed" } });
    expect(NOT_READ).toBe("The photos couldn’t be read. Try again.");
    expect(html).toMatch(/role="status".*The photos couldn’t be read/s);
    expect(html).toContain("Page 1");
    expect(html).toContain("Pick photos");
    expect(html).toMatch(importButton);
    expect(html).not.toMatch(disabledImport);
  });
});

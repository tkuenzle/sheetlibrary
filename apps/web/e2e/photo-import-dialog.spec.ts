import { expect, type Page, test } from "@playwright/test";

import { authFile } from "./servers";

// The library's import from photos. The servers use the fake model, which
// reads "Amazing Grace" from any photos.

test.use({ storageState: authFile });

function dialog(page: Page) {
  return page.getByRole("dialog", { name: "Import from photos" });
}

function importButton(page: Page) {
  return dialog(page).getByRole("button", { name: "Import", exact: true });
}

async function openPhotos(page: Page) {
  await page.goto("/sheets");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.getByRole("menuitem", { name: "From photos…" }).click();
  await expect(dialog(page)).toBeVisible();
}

// A JPEG drawn in the browser, as a phone camera might save it.
async function jpeg(page: Page, width: number, height: number) {
  const base64 = await page.evaluate(
    async ([width, height]) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No 2D canvas");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#000";
      context.fillRect(0, 0, width / 2, height / 4);
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.8);
      });
      if (!blob) throw new Error("No JPEG");
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return btoa(
        Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
      );
    },
    [width, height] as const,
  );
  return Buffer.from(base64, "base64");
}

// The same JPEG with an orientation tag that says to turn it a quarter to
// the right, as a phone held sideways saves it.
function sideways(photo: Buffer) {
  const exif = Buffer.from(
    "FFE10022457869660000" + // APP1, 34 bytes, "Exif\0\0"
      "4D4D002A00000008" + // big-endian TIFF, first IFD at 8
      "0001" + // one entry
      "011200030000000100060000" + // Orientation (SHORT) = 6
      "00000000", // no next IFD
    "hex",
  );
  return Buffer.concat([photo.subarray(0, 2), exif, photo.subarray(2)]);
}

// Keeps each photo the page adds to a form, so the test can look at what
// was sent. Playwright doesn't give the files in a multipart body.
async function recordSentPhotos(page: Page) {
  await page.addInitScript(() => {
    const sent: Blob[] = [];
    Object.assign(window, { sentPhotos: sent });
    class RecordingFormData extends FormData {
      override append(name: string, value: string | Blob, filename?: string) {
        if (name === "photo" && value instanceof Blob) sent.push(value);
        if (typeof value === "string") super.append(name, value);
        else super.append(name, value, filename);
      }
    }
    window.FormData = RecordingFormData;
  });
}

// The type and size of each photo sent, as the browser decodes it.
function sentPhotos(page: Page) {
  return page.evaluate(() =>
    Promise.all(
      (window as unknown as { sentPhotos: Blob[] }).sentPhotos.map(
        async (photo) => {
          const image = await createImageBitmap(photo);
          return {
            type: photo.type,
            size: { width: image.width, height: image.height },
          };
        },
      ),
    ),
  );
}

// Scenarios "Importing photos", "Title read", "A large phone photo" and
// "Removing a page".
test("reads the photos, shrunk and upright, into a sheet with its title", async ({
  page,
}) => {
  await recordSentPhotos(page);
  await openPhotos(page);
  await expect(importButton(page)).toBeDisabled();

  const large = await jpeg(page, 4032, 3024);
  const turned = sideways(await jpeg(page, 400, 300));
  const extra = await jpeg(page, 800, 600);
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles([
      { name: "large.jpg", mimeType: "image/jpeg", buffer: large },
      { name: "extra.jpg", mimeType: "image/jpeg", buffer: extra },
      { name: "turned.jpg", mimeType: "image/jpeg", buffer: turned },
    ]);
  await expect(dialog(page).getByText("3 of 10 pages")).toBeVisible();
  await dialog(page).getByRole("button", { name: "Remove page 2" }).click();
  await expect(dialog(page).getByText("2 of 10 pages")).toBeVisible();
  await expect(dialog(page).locator("img.photo-import-thumbnail")).toHaveCount(
    2,
  );

  await importButton(page).click();
  await expect(page).toHaveURL(/\/sheets\/[\w-]{12}$/);
  // The sideways photo is sent upright, with its pixels turned, not a tag.
  expect(await sentPhotos(page)).toEqual([
    { type: "image/jpeg", size: { width: 2236, height: 1677 } },
    { type: "image/jpeg", size: { width: 300, height: 400 } },
  ]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amazing Grace",
  );
  await expect(page.getByLabel("Title")).toBeHidden();
  await expect(page.locator(".section-label")).toHaveText([
    "Verse 1",
    "Verse 2",
  ]);
});

// Scenario "A HEIC photo on a desktop".
test("waits until a photo that can't be opened is removed", async ({
  page,
}) => {
  await openPhotos(page);
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles([
      {
        name: "page.jpg",
        mimeType: "image/jpeg",
        buffer: await jpeg(page, 600, 800),
      },
      {
        name: "page.heic",
        mimeType: "image/heic",
        buffer: Buffer.from("not a photo"),
      },
    ]);
  await expect(dialog(page)).toContainText(
    "This photo can’t be opened. Remove it, or add it as a JPEG.",
  );
  await expect(importButton(page)).toBeDisabled();
  await dialog(page).getByRole("button", { name: "Remove page 2" }).click();
  await expect(dialog(page)).not.toContainText("can’t be opened");
  await expect(importButton(page)).toBeEnabled();
});

// Scenario "Cancelling while reading". The request is held, so it lasts
// until Cancel. A held request stays at the upload in Playwright; the
// reading and its time are tested in photo-import-dialog.test.tsx.
test("cancel stops the request and creates no sheet", async ({ page }) => {
  await page.route("**/api/photo-import", () => {
    // Never answered.
  });
  const created: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/sheets")) {
      created.push(request.url());
    }
  });
  await openPhotos(page);
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles([
      {
        name: "page.jpg",
        mimeType: "image/jpeg",
        buffer: await jpeg(page, 600, 800),
      },
    ]);
  await importButton(page).click();
  await expect(
    dialog(page).getByRole("progressbar", { name: /Uploading the photos…/ }),
  ).toBeVisible();
  await expect(
    dialog(page).getByRole("button", { name: "Remove page 1" }),
  ).toBeDisabled();

  const stopped = page.waitForEvent("requestfailed", (request) =>
    request.url().endsWith("/api/photo-import"),
  );
  await dialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(dialog(page)).toBeHidden();
  await stopped;
  await expect(
    page.getByRole("button", { name: "Import", exact: true }),
  ).toBeFocused();
  await expect(page).toHaveURL("/sheets");
  expect(created).toEqual([]);
});

// Scenario "Trying again".
test("keeps the photos when the reading fails, and reads them again", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/api/photo-import", async (route) => {
    if (failed) {
      await route.continue();
      return;
    }
    failed = true;
    await route.fulfill({ status: 500, json: { error: "The model failed" } });
  });
  await openPhotos(page);
  await dialog(page)
    .locator('input[type="file"]')
    .setInputFiles([
      {
        name: "page.jpg",
        mimeType: "image/jpeg",
        buffer: await jpeg(page, 600, 800),
      },
    ]);
  await importButton(page).click();
  await expect(dialog(page)).toContainText(
    "The photos couldn’t be read. Try again.",
  );
  await expect(dialog(page).getByText("Page 1", { exact: true })).toBeVisible();
  await importButton(page).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Amazing Grace",
  );
});

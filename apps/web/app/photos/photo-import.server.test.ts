import { describe, expect, it, vi } from "vitest";

import { seedSong } from "../editor/seed-song";
import { fakePhotoModel } from "./fake-photo-model.server";
import { handlePhotoImport } from "./photo-import.server";
import type { PhotoModel } from "./photo-model.server";

const url = "https://sheetlibrary.com/api/photo-import";
const origin = "https://sheetlibrary.com";

function page(name: string) {
  return new File([name], `${name}.jpg`, { type: "image/jpeg" });
}

function request(
  photos: File[],
  {
    headers = { Origin: origin },
    signal,
  }: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
) {
  const body = new FormData();
  for (const photo of photos) body.append("photo", photo);
  return new Request(url, {
    method: "POST",
    headers,
    body,
    ...(signal ? { signal } : {}),
  });
}

// A model that records what it was given, and answers like the fake.
function spyModel() {
  return vi.fn<PhotoModel>(fakePhotoModel());
}

describe("photo import API", () => {
  // Scenario "A song read".
  it("reads the photos into a chord sheet with its title", async () => {
    const response = await handlePhotoImport(
      request([page("one")]),
      "ana",
      fakePhotoModel(),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      title: "Amazing Grace",
      content: seedSong,
    });
  });

  it("gives the model the photos in page order", async () => {
    const model = spyModel();
    await handlePhotoImport(
      request([page("one"), page("two"), page("three")]),
      "ana",
      model,
    );
    const photos = model.mock.calls[0]?.[0] ?? [];
    expect(await Promise.all(photos.map((photo) => photo.text()))).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  // Scenario "Only the sheet".
  it("answers with only the sheet, its title and artist", async () => {
    const model: PhotoModel = () =>
      Promise.resolve(
        "{title: Song}\n{artist: Band}\n{comment: Model's note}\n[C]La",
      );
    const response = await handlePhotoImport(
      request([page("one")]),
      "ana",
      model,
    );
    const body = await response.json<Record<string, unknown>>();
    expect(Object.keys(body).sort()).toEqual(["artist", "content", "title"]);
    expect(JSON.stringify(body)).not.toContain("Model's note");
  });

  // Scenario "Not signed in".
  it("refuses a request without a session, before reading it", async () => {
    const model = spyModel();
    const unread = request([page("one")]);
    const response = await handlePhotoImport(unread, null, model);
    expect(response.status).toBe(401);
    expect(unread.bodyUsed).toBe(false);
    expect(model).not.toHaveBeenCalled();
  });

  it("refuses a request from another site", async () => {
    const model = spyModel();
    for (const headers of [
      { Origin: "https://example.com" },
      {} as Record<string, string>,
    ]) {
      const response = await handlePhotoImport(
        request([page("one")], { headers }),
        "ana",
        model,
      );
      expect(response.status).toBe(403);
    }
    expect(model).not.toHaveBeenCalled();
  });

  it("refuses a request without photos", async () => {
    const model = spyModel();
    const noPhotos = await handlePhotoImport(request([]), "ana", model);
    expect(noPhotos.status).toBe(400);
    const notForm = await handlePhotoImport(
      new Request(url, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: "{}",
      }),
      "ana",
      model,
    );
    expect(notForm.status).toBe(400);
    expect(model).not.toHaveBeenCalled();
  });

  it("refuses other methods", async () => {
    const response = await handlePhotoImport(
      new Request(url),
      "ana",
      spyModel(),
    );
    expect(response.status).toBe(405);
  });

  // Scenario "Dialog closed".
  it("stops the model when the request goes away", async () => {
    const model = spyModel();
    model.mockImplementation(fakePhotoModel(120));
    const controller = new AbortController();
    const answer = handlePhotoImport(
      request([page("one")], { signal: controller.signal }),
      "ana",
      model,
    );
    await vi.waitFor(() => {
      expect(model).toHaveBeenCalledOnce();
    });
    controller.abort();
    await expect(answer).rejects.toThrow(/abort/i);
    expect(model.mock.calls[0]?.[1].aborted).toBe(true);
  });
});

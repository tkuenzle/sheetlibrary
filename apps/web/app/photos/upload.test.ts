import { describe, expect, it, vi } from "vitest";

import { seedSong } from "../editor/seed-song";
import { uploadPhotos } from "./upload";

// Enough of XMLHttpRequest to send and answer by hand. A real one fires
// "abort" when aborted, and so does this.
class FakeRequest extends EventTarget {
  upload = new EventTarget();
  method = "";
  url = "";
  body: FormData | undefined;
  responseType = "";
  status = 0;
  response: unknown = null;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.dispatchEvent(new Event("abort"));
  }
  progress(loaded: number, total: number) {
    this.upload.dispatchEvent(
      Object.assign(new Event("progress"), {
        lengthComputable: true,
        loaded,
        total,
      }),
    );
  }
  answer(status: number, response: unknown) {
    this.upload.dispatchEvent(new Event("load"));
    this.status = status;
    this.response = response;
    this.dispatchEvent(new Event("load"));
  }
}

function start(signal = new AbortController().signal) {
  const request = new FakeRequest();
  const onProgress = vi.fn();
  const onSent = vi.fn();
  const photos = [
    new Blob(["one"], { type: "image/jpeg" }),
    new Blob(["two"], { type: "image/jpeg" }),
  ];
  const answer = uploadPhotos(
    photos,
    { onProgress, onSent, signal },
    () => request as unknown as XMLHttpRequest,
  );
  return { request, onProgress, onSent, answer };
}

describe("uploadPhotos", () => {
  it("posts one photo field per page, in order", async () => {
    const { request } = start();
    expect(request.method).toBe("POST");
    expect(request.url).toBe("/api/photo-import");
    expect(request.responseType).toBe("json");
    const photos = request.body?.getAll("photo") as File[];
    expect(photos.map((photo) => photo.name)).toEqual([
      "page-1.jpg",
      "page-2.jpg",
    ]);
    expect(await Promise.all(photos.map((photo) => photo.text()))).toEqual([
      "one",
      "two",
    ]);
  });

  it("reports the upload, then gives the sheet read", async () => {
    const { request, onProgress, onSent, answer } = start();
    request.progress(300, 1000);
    expect(onProgress).toHaveBeenLastCalledWith(0.3);
    expect(onSent).not.toHaveBeenCalled();
    request.answer(200, { title: "Amazing Grace", content: seedSong });
    expect(onSent).toHaveBeenCalledOnce();
    expect(await answer).toEqual({ title: "Amazing Grace", content: seedSong });
  });

  it("rejects an answer that isn't a sheet", async () => {
    for (const [status, response] of [
      [400, { error: "Too many photos" }],
      [500, null],
      [200, null],
    ] as const) {
      const { request, answer } = start();
      request.answer(status, response);
      await expect(answer).rejects.toThrow(/weren't read/);
    }
  });

  it("rejects when the photos can't be sent", async () => {
    const { request, answer } = start();
    request.dispatchEvent(new Event("error"));
    await expect(answer).rejects.toThrow(/weren't sent/);
  });

  // Scenario "Cancelling while reading".
  it("aborts the request with the signal", async () => {
    const controller = new AbortController();
    const { request, answer } = start(controller.signal);
    const abort = vi.spyOn(request, "abort");
    controller.abort();
    expect(abort).toHaveBeenCalledOnce();
    await expect(answer).rejects.toMatchObject({ name: "AbortError" });
  });

  it("sends nothing when the signal was already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const { request, answer } = start(controller.signal);
    await expect(answer).rejects.toMatchObject({ name: "AbortError" });
    expect(request.body).toBeUndefined();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { fakeAnswer } from "./fake-photo-model.server";
import { pickPhotoModel } from "./photo-model.server";

const env = {
  PHOTO_GATEWAY_URL: "https://gateway.example/anthropic",
  PHOTO_GATEWAY_TOKEN: "gateway-token",
  ANTHROPIC_API_KEY: "test-key",
};

const signal = () => new AbortController().signal;

describe("picking the photo model", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("picks Claude, on the gateway", async () => {
    // A 400, which the SDK doesn't retry.
    const fetch = vi.fn<(url: string) => Promise<Response>>(() =>
      Promise.resolve(Response.json({ type: "error" }, { status: 400 })),
    );
    vi.stubGlobal("fetch", fetch);
    const model = pickPhotoModel({ ...env, PHOTO_MODEL: "claude" });
    await expect(model([], signal())).rejects.toThrow();
    expect(String(fetch.mock.calls[0]?.[0])).toBe(
      "https://gateway.example/anthropic/v1/messages",
    );
  });

  it("picks the fake", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const model = pickPhotoModel({ ...env, PHOTO_MODEL: "fake" });
    expect(await model([], signal())).toBe(fakeAnswer);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails on any other value", () => {
    expect(() => pickPhotoModel({ ...env, PHOTO_MODEL: "" })).toThrow(
      "Unknown PHOTO_MODEL: ",
    );
    expect(() => pickPhotoModel({ ...env, PHOTO_MODEL: "opus" })).toThrow(
      "Unknown PHOTO_MODEL: opus",
    );
  });
});

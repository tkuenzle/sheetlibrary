import { PHOTO_ANSWER_PROMPT } from "chordsheet";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { claudePhotoModel } from "./claude-photo-model.server";

// Workers have Uint8Array.prototype.toBase64; Node 24 doesn't yet.
beforeAll(() => {
  if ("toBase64" in Uint8Array.prototype) return;
  Object.defineProperty(Uint8Array.prototype, "toBase64", {
    value(this: Uint8Array) {
      return btoa(String.fromCharCode(...this));
    },
  });
});

const gatewayURL =
  "https://gateway.ai.cloudflare.com/v1/account/sheetlibrary/anthropic";

function model() {
  return claudePhotoModel({
    apiKey: "test-key",
    gatewayURL,
    gatewayToken: "gateway-token",
  });
}

function photo(bytes: number[], type = "image/jpeg") {
  return new File([new Uint8Array(bytes)], "page.jpg", { type });
}

// A streamed answer, as the Messages API sends it.
function streamed(text: string, stopReason: string) {
  const events = [
    {
      type: "message_start",
      message: {
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      },
    },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 5 },
    },
    { type: "message_stop" },
  ];
  const body = events
    .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
    .join("");
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

function stubFetch(
  answer: (url: string, init: RequestInit) => Promise<Response>,
) {
  const fetch = vi.fn(answer);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("Claude photo model", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the photos in page order to the gateway", async () => {
    const fetch = stubFetch(() =>
      Promise.resolve(streamed("{title: Song}", "end_turn")),
    );
    const answer = await model()(
      [photo([1, 2, 3]), photo([4, 5], "image/png")],
      new AbortController().signal,
    );
    expect(answer).toBe("{title: Song}");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe(`${gatewayURL}/v1/messages`);
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe("Bearer test-key");
    expect(headers.get("cf-aig-authorization")).toBe("Bearer gateway-token");
    expect(headers.get("anthropic-beta")).toBe(
      "server-side-fallback-2026-07-01",
    );
    expect(JSON.parse(init?.body as string)).toEqual({
      model: "claude-opus-5-5",
      max_tokens: 64000,
      output_config: { effort: "low" },
      system: PHOTO_ANSWER_PROMPT,
      fallbacks: "default",
      stream: true,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Page 1" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: "AQID",
              },
            },
            { type: "text", text: "Page 2" },
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: "BAU=" },
            },
          ],
        },
      ],
    });
  });

  it("fails on a refusal", async () => {
    stubFetch(() => Promise.resolve(streamed("", "refusal")));
    await expect(
      model()([photo([1])], new AbortController().signal),
    ).rejects.toThrow("The model stopped with refusal");
  });

  it("fails when the answer is cut off", async () => {
    stubFetch(() => Promise.resolve(streamed("{title: So", "max_tokens")));
    await expect(
      model()([photo([1])], new AbortController().signal),
    ).rejects.toThrow("The model stopped with max_tokens");
  });

  it("stops the call when the signal aborts", async () => {
    // Answers only when the call is stopped.
    const fetch = stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const controller = new AbortController();
    const answer = model()([photo([1])], controller.signal);
    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledOnce();
    });
    controller.abort();
    await expect(answer).rejects.toThrow(/abort/i);
    expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  });
});

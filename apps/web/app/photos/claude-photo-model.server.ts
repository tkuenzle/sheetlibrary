import Anthropic from "@anthropic-ai/sdk";
import { PHOTO_ANSWER_PROMPT } from "chordsheet";

import type { PhotoModel } from "./photo-model.server";

// Reads photos with Claude, through the AI gateway in infra/, which only
// takes requests with its token. The model and effort are the ones the photo
// import spike chose to start with (docs/photo-import-spike.md); #102 picks
// the final ones.
export function claudePhotoModel({
  apiKey,
  gatewayURL,
  gatewayToken,
}: {
  apiKey: string;
  gatewayURL: string;
  gatewayToken: string;
}): PhotoModel {
  const client = new Anthropic({
    apiKey,
    baseURL: gatewayURL,
    defaultHeaders: { "cf-aig-authorization": `Bearer ${gatewayToken}` },
  });
  return async (photos, signal) => {
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const [index, photo] of photos.entries()) {
      content.push({ type: "text", text: `Page ${String(index + 1)}` });
      content.push({
        type: "image",
        source: {
          type: "base64",
          // Not checked here: the API refuses a type it can't read.
          media_type:
            photo.type as Anthropic.Beta.BetaBase64ImageSource["media_type"],
          data: new Uint8Array(await photo.arrayBuffer()).toBase64(),
        },
      });
    }
    // Streamed, since a hard song takes up to two minutes and a request that
    // sends nothing for that long can be cut off.
    const message = await client.beta.messages
      .stream(
        {
          model: "claude-opus-5-5",
          max_tokens: 64000,
          output_config: { effort: "low" },
          system: PHOTO_ANSWER_PROMPT,
          messages: [{ role: "user", content }],
          // If Opus refuses, the API runs the request again on another model
          // in the same call.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        },
        { signal },
      )
      .finalMessage();
    if (message.stop_reason !== "end_turn") {
      throw new Error(
        `The model stopped with ${message.stop_reason ?? "no reason"}`,
      );
    }
    return message.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("");
  };
}

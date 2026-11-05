import { claudePhotoModel } from "./claude-photo-model.server";
import { fakePhotoModel } from "./fake-photo-model.server";

// A model that reads photos of one song, in page order, and answers with
// text in the photo answer format (chordsheet's readPhotoAnswer). It stops
// when the signal aborts. See openspec/specs/photo-import.
export type PhotoModel = (
  photos: File[],
  signal: AbortSignal,
) => Promise<string>;

// What picking a model reads from the worker's environment.
export interface PhotoModelEnv {
  PHOTO_MODEL: string;
  PHOTO_GATEWAY_URL: string;
  PHOTO_GATEWAY_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  PHOTO_FAKE_DELAY_SECONDS?: string;
}

// PHOTO_MODEL picks the model: "claude" in production and previews, "fake"
// in local dev and the end-to-end tests. Any other value is an error, so
// nothing falls back to the fake by accident.
export function pickPhotoModel(env: PhotoModelEnv): PhotoModel {
  switch (env.PHOTO_MODEL) {
    case "claude":
      return claudePhotoModel({
        apiKey: env.ANTHROPIC_API_KEY,
        gatewayURL: env.PHOTO_GATEWAY_URL,
        gatewayToken: env.PHOTO_GATEWAY_TOKEN,
      });
    case "fake":
      return fakePhotoModel(Number(env.PHOTO_FAKE_DELAY_SECONDS ?? "0"));
    default:
      throw new Error(`Unknown PHOTO_MODEL: ${env.PHOTO_MODEL}`);
  }
}

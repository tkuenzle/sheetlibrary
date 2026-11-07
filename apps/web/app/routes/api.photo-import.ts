import { pickPhotoModel } from "../photos/photo-model.server";
import { handlePhotoImport } from "../photos/photo-import.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.photo-import";

// POST /api/photo-import reads photos of a song into a chord sheet. See
// app/photos/photo-import.server.ts.

export function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handlePhotoImport(request, userId, pickPhotoModel(env));
}

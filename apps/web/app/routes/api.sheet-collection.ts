import { handleSheetCollection } from "../collections/collections-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.sheet-collection";

// PUT and DELETE /api/sheets/:id/collections/:collectionId. See app/collections/collections-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleSheetCollection(
    request,
    env.DB,
    userId,
    params.id,
    params.collectionId,
  );
}

export const loader = handle;
export const action = handle;

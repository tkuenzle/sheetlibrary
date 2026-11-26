import { handleSheetCollection } from "../collections/collections-api.server";
import { serverAnswer } from "../changes";
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

// A fetcher in the browser goes through this, which answers `{ ok: false }`
// rather than throw when the API can't be reached. See
// app/collections/sheet-collections.ts.
export function clientAction({ serverAction }: Route.ClientActionArgs) {
  return serverAnswer(serverAction);
}

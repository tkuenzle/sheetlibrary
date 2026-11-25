import { handleSheetCollections } from "../collections/collections-api.server";
import {
  loadSheetCollections,
  submitNewCollection,
} from "../collections/sheet-collections";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.sheet-collections";

// GET and POST /api/sheets/:id/collections. See app/collections/collections-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleSheetCollections(request, env.DB, userId, params.id);
}

export const loader = handle;
export const action = handle;

// A fetcher in the browser goes through these, which answer `{ ok: false }`
// rather than throw when the API can't be reached. See
// app/collections/sheet-collections.ts.
export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return loadSheetCollections(params.id);
}

export function clientAction({ params, request }: Route.ClientActionArgs) {
  return submitNewCollection(params.id, request);
}

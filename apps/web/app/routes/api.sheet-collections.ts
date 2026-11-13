import { handleSheetCollections } from "../collections/collections-api.server";
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

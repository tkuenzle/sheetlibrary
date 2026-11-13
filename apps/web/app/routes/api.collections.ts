import { handleCollections } from "../collections/collections-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.collections";

// POST /api/collections. See app/collections/collections-api.server.ts.

function handle({ request, context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleCollections(request, env.DB, userId);
}

export const loader = handle;
export const action = handle;

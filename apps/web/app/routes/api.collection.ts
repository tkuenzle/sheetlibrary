import { handleCollection } from "../collections/collections-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.collection";

// PATCH and DELETE /api/collections/:id. See app/collections/collections-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleCollection(request, env.DB, userId, params.id);
}

export const loader = handle;
export const action = handle;

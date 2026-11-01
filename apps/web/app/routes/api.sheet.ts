import { handleSheet } from "../sheets/sheets-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.sheet";

// GET, PUT and DELETE /api/sheets/:id. See app/sheets/sheets-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleSheet(request, env.DB, userId, params.id);
}

export const loader = handle;
export const action = handle;

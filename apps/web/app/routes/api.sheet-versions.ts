import { cloudflareContext, sessionContext } from "../context";
import { handleVersions } from "../sheets/sheets-api.server";
import type { Route } from "./+types/api.sheet-versions";

// GET and POST /api/sheets/:id/versions. See app/sheets/sheets-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleVersions(request, env.DB, userId, params.id);
}

export const loader = handle;
export const action = handle;

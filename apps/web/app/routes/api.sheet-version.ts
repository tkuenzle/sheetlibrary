import { cloudflareContext, sessionContext } from "../context";
import { handleVersion } from "../sheets/sheets-api.server";
import type { Route } from "./+types/api.sheet-version";

// PATCH and DELETE /api/sheets/:id/versions/:versionId. See
// app/sheets/sheets-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleVersion(request, env.DB, userId, params.id, params.versionId);
}

export const loader = handle;
export const action = handle;

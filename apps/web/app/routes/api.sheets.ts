import { handleSheets } from "../sheets/sheets-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.sheets";

// POST /api/sheets creates a sheet. See app/sheets/sheets-api.server.ts.

export function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleSheets(request, env.DB, userId);
}

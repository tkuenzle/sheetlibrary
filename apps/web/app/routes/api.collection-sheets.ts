import { serverAnswer } from "../changes";
import { handleCollectionSheets } from "../collections/collections-api.server";
import { cloudflareContext, sessionContext } from "../context";
import type { Route } from "./+types/api.collection-sheets";

// POST /api/collections/:id/sheets. See app/collections/collections-api.server.ts.

function handle({ request, context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const userId = context.get(sessionContext)?.user.id ?? null;
  return handleCollectionSheets(request, env.DB, userId, params.id);
}

export const loader = handle;
export const action = handle;

// "Add sheets" on the collection's page, through a fetcher. Sheets that
// don't get added answer `{ ok: false }`, so the dialog shows its note. See
// app/changes.ts.
export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const answer = await serverAnswer(serverAction);
  return { ok: answer.ok };
}

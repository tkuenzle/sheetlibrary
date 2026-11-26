import { serverAnswer } from "../changes";
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

// Deleting from a row of the sheet list, through a fetcher. A delete that
// doesn't get through answers `{ ok: false }`, so the row comes back with
// its note. Autosave and the play view's delete call the API with a plain
// `fetch`, which doesn't come here. See app/changes.ts.
export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const answer = await serverAnswer(serverAction);
  return { ok: answer.ok };
}

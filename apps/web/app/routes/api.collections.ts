import { redirect } from "react-router";

import { serverAnswer } from "../changes";
import { nameRefusals } from "../collections/collections";
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

// "New collection" on Collections, through a fetcher: opens the new
// collection, or answers `{ ok: false }` with the note for a name already
// used. See app/changes.ts.
export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  const answer = await serverAnswer(serverAction, nameRefusals);
  if (!answer.ok) return answer;
  const { id } = answer.value as { id: string };
  return redirect(`/collections/${id}`);
}

import { redirect } from "react-router";

import { serverAnswer } from "../changes";
import { nameRefusals } from "../collections/collections";
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

// Renaming and deleting through a fetcher, from the collection's page. A
// name already used answers the note the naming dialog shows. Deleting opens
// Collections, and a collection that is already gone counts as deleted. See
// app/changes.ts.
export async function clientAction({
  request,
  serverAction,
}: Route.ClientActionArgs) {
  const answer = await serverAnswer(serverAction, nameRefusals);
  if (
    request.method === "DELETE" &&
    (answer.ok || answer.code === "not-found")
  ) {
    return redirect("/collections");
  }
  return answer.ok ? { ok: true } : answer;
}

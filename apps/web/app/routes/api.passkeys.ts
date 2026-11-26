import { addPasskey, removePasskey, renamePasskey } from "../auth/auth-client";
import type { Route } from "./+types/api.passkeys";

// /api/passkeys, only in the browser: the account page adds, renames and
// removes the person's passkeys through a fetcher, with a JSON body that
// says which. A passkey is made in the browser, so this calls the auth
// client rather than a server. Afterwards React Router loads the account
// page and the shell, which counts the passkeys, again by itself. A change
// that doesn't get through answers `{ ok: false }`. See app/changes.ts.

export type PasskeyChange =
  | { intent: "add" }
  | { intent: "rename"; id: string; name: string }
  | { intent: "remove"; id: string };

export async function clientAction({ request }: Route.ClientActionArgs) {
  try {
    return { ok: await change(await request.json<PasskeyChange>()) };
  } catch {
    return { ok: false };
  }
}

function change(asked: PasskeyChange): Promise<boolean> {
  switch (asked.intent) {
    case "add":
      return addPasskey();
    case "rename":
      return renamePasskey(asked.id, asked.name);
    case "remove":
      return removePasskey(asked.id);
  }
}

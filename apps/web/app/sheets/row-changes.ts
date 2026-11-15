import { data } from "react-router";

import type { RowAnswer } from "./sheet-list";

// The changes a row of the sheet list posts to its page's action: "delete",
// and in a collection "remove". See openspec/specs/sheet-list.

const ROW_INTENTS = new Set(["delete", "remove"]);

// The action's answer to a row's change: `ok`, or 404 when the sheet or the
// collection isn't the person's.
export function rowAnswer(intent: string, ok: boolean) {
  return ok ? { ok, intent } : data({ ok, intent }, { status: 404 });
}

// For a page's `clientAction`: a row's change that fails, such as one that
// can't reach the server, answers `{ ok: false }`, so the row comes back with
// a note and the list stays, rather than the page's error boundary taking
// over. Anything else, such as "New sheet", goes on as before.
export async function keepListOnFailure<T>(
  request: Request,
  serverAction: () => Promise<T>,
): Promise<T | RowAnswer> {
  const intent = (await request.clone().formData()).get("intent");
  try {
    return await serverAction();
  } catch (error) {
    if (typeof intent !== "string" || !ROW_INTENTS.has(intent)) throw error;
    return { ok: false, intent };
  }
}

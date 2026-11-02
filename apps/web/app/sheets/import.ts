import type { ChordSheet, Sheet } from "chordsheet";

import { UNTITLED } from "./details";

// The import into the library: a new sheet titled "Untitled" with what was
// read from Ultimate Guitar, created from the browser through the API, which
// checks its size as it does for every save. See openspec/specs/library-page.

export const TOO_LONG = "The text is too long to import.";
export const NOT_IMPORTED = "The sheet couldn’t be imported. Try again.";

// The new sheet's id, or what to tell the person when it wasn't created.
export async function importSheet(
  content: ChordSheet,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): Promise<{ id: string } | { error: string }> {
  try {
    const response = await fetchFn("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: UNTITLED, content }),
    });
    if (response.status === 201) {
      const sheet = await response.json<Sheet>();
      return { id: sheet.id };
    }
    if (response.status === 400) {
      const body = await response.json<{ error?: string }>();
      if (body.error === "Sheet is too large") return { error: TOO_LONG };
    }
  } catch {
    // Not reached, or an answer that isn't JSON.
  }
  return { error: NOT_IMPORTED };
}

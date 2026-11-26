import { forgetKept } from "./shell/kept";

// Changes to the person's data. Each goes through a fetcher to its
// resource's route under /api, whichever screen it is made on, and React
// Router loads what's on screen again by itself (shell/revalidate.ts). A
// route's `clientAction` asks the server through `serverAnswer` below.
// Autosave, versions, imports and the play view's delete still use a plain
// `fetch`, through `sendChange`, since nothing on screen needs to load again
// after them.

// How the browser sends a request to the app's API outside React Router's
// forms and fetchers. A request that changes the person's data forgets the
// pages kept for Back first, as the root's client middleware does for forms
// and fetchers, so Back never shows what the change replaced. See
// shell/kept.ts and openspec/specs/site-layout ("A change forgets what Back
// shows").
export const sendChange: typeof fetch = (input, init) => {
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  if (!["GET", "HEAD"].includes(method.toUpperCase())) forgetKept();
  return fetch(input, init);
};

// What went wrong, as an API error's body says it in `code`
// (sheets/sheets-api.server.ts).
export type ErrorCode = "invalid" | "not-found" | "taken";

// A fetcher's answer to a change. `refused` is the note to show, such as
// "That name is already used.", when the change was refused for a reason
// the person can fix. `code` is what the API said went wrong, if it said.
export type ChangeAnswer =
  { ok: true } | { ok: false; refused?: string; code?: ErrorCode };

// For a route's `clientAction` or `clientLoader`: asks the server with
// `send`, usually `serverAction` or `serverLoader`, and answers with what
// came back. An error body answers `{ ok: false }`, with the note `refusals`
// gives for its code, and so does a server that can't be reached, so the
// page shows its note rather than its error boundary. React Router hands
// the `clientAction` the body, not the status, which is why errors carry a
// code.
export async function serverAnswer(
  send: () => Promise<unknown>,
  refusals: Partial<Record<ErrorCode, string>> = {},
): Promise<{ ok: true; value: unknown } | Exclude<ChangeAnswer, { ok: true }>> {
  let body: unknown;
  try {
    body = await send();
  } catch {
    return { ok: false };
  }
  if (typeof body === "object" && body !== null && "error" in body) {
    if (!("code" in body)) return { ok: false };
    const code = body.code as ErrorCode;
    const refused = refusals[code];
    return refused === undefined
      ? { ok: false, code }
      : { ok: false, refused, code };
  }
  return { ok: true, value: body };
}

import type { ShouldRevalidateFunctionArgs } from "react-router";

// For the routes around every page, the root and the shell. With single
// fetch, React Router loads every route on screen again on each move. Their
// data (who is signed in, the collections) only changes when the person
// changes it, so they keep it on a plain move, a search included. Offline,
// a failed move then fails only the new screen, and the frame stays.
//
// They load again after a form or a fetcher, and when the same address
// loads again, as after "Try again". Every change to the person's data goes
// through a fetcher or a form (app/changes.ts), so nothing calls
// `revalidate()` by hand. A change that didn't get through changed nothing,
// so nothing loads again (see changedNothing). See
// openspec/specs/site-layout.
export function revalidateAfterChanges({
  currentUrl,
  nextUrl,
  formMethod,
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  if (changedNothing(actionResult)) return false;
  if (formMethod || currentUrl.href === nextUrl.href) {
    return defaultShouldRevalidate;
  }
  return false;
}

// Whether an action answered that its change didn't get through, as a
// fetcher's `clientAction` does offline (app/changes.ts). Loading again then
// would only fail too, and take the page down with it.
export function changedNothing(actionResult: unknown): boolean {
  return (
    typeof actionResult === "object" &&
    actionResult !== null &&
    "ok" in actionResult &&
    actionResult.ok === false
  );
}

// For a page with row changes: it loads again after a change, as React
// Router does, unless the change didn't get through.
export function revalidateUnlessUnchanged({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return !changedNothing(actionResult) && defaultShouldRevalidate;
}

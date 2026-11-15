import type { ShouldRevalidateFunctionArgs } from "react-router";

// For the routes around every page, the root and the shell. With single
// fetch, React Router loads every route on screen again on each move. Their
// data (who is signed in, the collections) only changes when the person
// changes it, so they keep it on a plain move, a search included. Offline,
// a failed move then fails only the new screen, and the frame stays.
//
// They load again after a form or a fetcher, after `revalidate()`, and when
// the same address loads again, as after "Try again". A change made with a
// plain `fetch`, such as making or deleting a collection, calls
// `revalidate()` so the rail follows it. A change that didn't get through
// changed nothing, so nothing loads again (see changedNothing). See
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

// Whether an action answered that its change didn't get through, as a row
// of the sheet list does offline (sheets/row-changes.ts). Loading again then
// would only fail too, and take the page down with it.
export function changedNothing(actionResult: unknown): boolean {
  return (
    typeof actionResult === "object" &&
    actionResult !== null &&
    "ok" in actionResult &&
    actionResult.ok === false
  );
}

// For a page whose action has row changes: it loads again after a change,
// as React Router does, unless the change didn't get through.
export function revalidateUnlessUnchanged({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return !changedNothing(actionResult) && defaultShouldRevalidate;
}

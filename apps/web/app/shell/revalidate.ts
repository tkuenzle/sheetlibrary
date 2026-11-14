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
// `revalidate()` so the rail follows it. See openspec/specs/site-layout.
export function revalidateAfterChanges({
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  if (formMethod || currentUrl.href === nextUrl.href) {
    return defaultShouldRevalidate;
  }
  return false;
}

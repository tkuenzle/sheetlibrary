import { useLayoutEffect } from "react";
import {
  type Location,
  type Navigation,
  useLocation,
  useNavigation,
} from "react-router";

import { LoadingBar } from "../ui/loading-bar";
import { noteLoadingBar, notePageLoadStart } from "./page-moves";
import { useSlowWait } from "./slow-wait";

// Whether a navigation loads a page, for the loading bar. A search changes
// only the address's search, without a form, and has its own "Searching…"
// in the field, so it doesn't count. A form that submits, such as "New
// sheet", does. See openspec/specs/site-layout.
export function isPageLoad(
  navigation: Pick<Navigation, "state" | "location" | "formMethod">,
  current: Pick<Location, "pathname" | "search">,
): boolean {
  const next = navigation.location;
  if (navigation.state === "idle" || !next) return false;
  const isSearch =
    !navigation.formMethod &&
    next.pathname === current.pathname &&
    next.search !== current.search;
  return !isSearch;
}

// The loading bar, once a page has been loading for more than a moment.
// Used once, in the root, so it covers every page.
export function PageLoading() {
  const navigation = useNavigation();
  const location = useLocation();
  const loading = isPageLoad(navigation, location);
  const slow = useSlowWait(loading);
  // When the page load started, for the wait for a page's data.
  useLayoutEffect(() => {
    notePageLoadStart(loading ? Date.now() : null);
  }, [loading]);
  // A page change after a wait the person has seen doesn't move (see
  // shell/page-moves.ts).
  useLayoutEffect(() => {
    noteLoadingBar(slow);
  }, [slow]);
  return slow ? <LoadingBar /> : null;
}

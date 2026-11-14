import {
  type Location,
  type Navigation,
  useLocation,
  useNavigation,
} from "react-router";

import { LoadingBar } from "../ui/loading-bar";
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
  const slow = useSlowWait(isPageLoad(navigation, location));
  return slow ? <LoadingBar /> : null;
}

import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

// Where the focus goes after a move to another page without a full load. A
// full load puts it at the top of the page and screen readers read the new
// title. Without one, it would stay on a link that may be gone, and nothing
// would be read. So the focus goes to the new page's heading. See
// openspec/specs/site-layout.

// Whether a move puts the focus on the new page's heading. Not when only the
// search of the address changed, as while typing a search, or when the new
// page has put the focus somewhere itself, as a new sheet does with its
// title field.
export function movesFocus({
  from,
  to,
  focusInPage,
}: {
  // The paths before and after the move.
  from: string;
  to: string;
  // Whether the focus is inside the new page's content.
  focusInPage: boolean;
}): boolean {
  return from !== to && !focusInPage;
}

// Used once, in the root, so it covers every page. The focus doesn't scroll
// the page: going back returns to where the list was.
export function useFocusOnNavigation() {
  const location = useLocation();
  const shown = useRef(location.pathname);
  useEffect(() => {
    const from = shown.current;
    shown.current = location.pathname;
    const main = document.querySelector("main");
    if (!main) return;
    const focused = document.activeElement;
    const focusInPage = focused !== main && main.contains(focused);
    if (!movesFocus({ from, to: location.pathname, focusInPage })) return;
    const heading = main.querySelector("h1");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [location]);
}

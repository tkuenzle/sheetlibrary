import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

// Where the focus goes after a move to another page without a full load. A
// full load puts it at the top of the page and screen readers read the new
// title. Without one, it would stay on a link that may be gone, and nothing
// would be read. So the focus goes to the new page's heading. See
// openspec/specs/site-layout.

// The state of a navigation that keeps the focus where it is, as a search
// does: the person is still typing.
export const KEEP_FOCUS = { keepFocus: true };

export function keepsFocus(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    "keepFocus" in state &&
    state.keepFocus === true
  );
}

// Whether a move puts the focus on the new page's heading. Not when only the
// search of the address changed, when the navigation asks to keep the
// focus, or when the new page has put the focus somewhere itself, as a new
// sheet does with its title field.
export function movesFocus({
  from,
  to,
  state,
  focusInPage,
}: {
  // The paths before and after the move.
  from: string;
  to: string;
  state: unknown;
  // Whether the focus is inside the new page's content.
  focusInPage: boolean;
}): boolean {
  return from !== to && !keepsFocus(state) && !focusInPage;
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
    if (
      !movesFocus({
        from,
        to: location.pathname,
        state: location.state,
        focusInPage,
      })
    ) {
      return;
    }
    const heading = main.querySelector("h1");
    if (!heading) return;
    if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [location]);
}

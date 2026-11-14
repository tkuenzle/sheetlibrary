import "./search-field.css";

import { useEffect, useRef, useState } from "react";
import { Form, useLocation, useNavigate, useNavigation } from "react-router";

import { KEEP_FOCUS, keepsFocus } from "../shell/focus";
import { Icon } from "../ui/icon";
import { IconButton } from "../ui/button";
import { isSearch } from "./search";

// How long typing pauses before the results update, in milliseconds.
export const SEARCH_PAUSE = 300;

// How long a search loads before the page shows it, in milliseconds, so a
// fast answer doesn't flicker.
const PENDING_DELAY = 200;

// Whether a search has been loading for more than a moment. A newer search
// cancels an older one, so results never arrive out of order.
export function useSearchPending(): boolean {
  const navigation = useNavigation();
  const loading =
    navigation.state === "loading" &&
    navigation.location.pathname === "/sheets";
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setPending(true);
    }, PENDING_DELAY);
    return () => {
      clearTimeout(timer);
      setPending(false);
    };
  }, [loading]);
  return pending;
}

// The search field at the top of the shell: a GET form for `q`, so Enter
// works before the scripts load. With them, the results update as you type.
// On the Sheets screen, each update replaces the address. From another
// screen, the first one opens Sheets as a new entry in the history, so going
// back returns to that screen, and it keeps the focus in the field. See
// openspec/specs/library-search.
export function SearchField({
  q,
  count,
  pending = false,
}: {
  // The search the page shows.
  q: string;
  // How many sheets it found, or null when the page shows no search.
  count: number | null;
  // Whether a new search is loading.
  pending?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The input is uncontrolled, so what is typed before the scripts load is
  // kept. This only follows whether it is empty, for "Clear search".
  const [empty, setEmpty] = useState(q === "");

  // Follow the address, unless the person is typing. A move to another
  // screen that the search didn't make, such as Back, ends the typing, so
  // the field follows the address then too. Text that differs from the
  // address, such as typed before the scripts loaded, is searched.
  const onSheets = location.pathname === "/sheets";
  const shownPath = useRef(location.pathname);
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    const moved =
      shownPath.current !== location.pathname && !keepsFocus(location.state);
    shownPath.current = location.pathname;
    const typing = document.activeElement === field && !moved;
    if (!typing) field.value = q;
    setEmpty(field.value === "");
    if (field.value !== q) schedule(field.value);
  }, [q, location.pathname, location.state]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  // Searches the text after a pause in typing.
  const schedule = (value: string) => {
    setEmpty(value === "");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      show(value);
    }, SEARCH_PAUSE);
  };

  const show = (value: string) => {
    clearTimeout(timer.current);
    const search = isSearch(value)
      ? `?${new URLSearchParams({ q: value }).toString()}`
      : "";
    if (!onSheets) {
      if (search !== "")
        void navigate(`/sheets${search}`, { state: KEEP_FOCUS });
      return;
    }
    if (search === location.search) return;
    void navigate(`/sheets${search}`, {
      replace: true,
      preventScrollReset: true,
    });
  };

  return (
    <Form
      method="get"
      action="/sheets"
      role="search"
      className="search-field"
      onSubmit={(event) => {
        event.preventDefault();
        show(input.current?.value ?? "");
      }}
    >
      <Icon name="search" />
      <input
        ref={input}
        type="search"
        name="q"
        aria-label="Search sheets"
        placeholder="Search titles, artists and lyrics"
        autoComplete="off"
        defaultValue={q}
        onChange={(event) => {
          schedule(event.target.value);
        }}
      />
      {/* Read out when it changes. Without results, the page says so, and
          this only tells screen readers. */}
      <span className="search-field-count" role="status">
        {pending ? (
          "Searching…"
        ) : count === 0 ? (
          <span className="visually-hidden">No sheets match</span>
        ) : (
          countText(count)
        )}
      </span>
      {!empty && (
        <IconButton
          icon="close"
          label="Clear search"
          onClick={() => {
            if (input.current) input.current.value = "";
            setEmpty(true);
            show("");
            input.current?.focus();
          }}
        />
      )}
    </Form>
  );
}

function countText(count: number | null): string {
  if (count === null) return "";
  return count === 1 ? "1 sheet" : `${String(count)} sheets`;
}

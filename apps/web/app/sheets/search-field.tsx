import "./search-field.css";

import { useEffect, useRef, useState } from "react";
import { Form, useLocation, useNavigate, useNavigation } from "react-router";

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

// The search field of the Sheets screen: a GET form for `q`, so Enter works before the
// scripts load. With them, the results update as you type, and each update
// replaces the address. See openspec/specs/library-search.
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

  // Follow the address, as after Back, unless the person is typing. Text
  // that differs from the address, such as typed before the scripts
  // loaded, is searched.
  useEffect(() => {
    const field = input.current;
    if (!field) return;
    if (document.activeElement !== field) field.value = q;
    setEmpty(field.value === "");
    if (field.value !== q) schedule(field.value);
  }, [q]);
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

import "./search-field.css";

import { useEffect, useRef, useState } from "react";
import { Form, useLocation, useNavigate } from "react-router";

import { Icon } from "../ui/icon";
import { IconButton } from "../ui/button";
import { isSearch } from "./search";

// How long typing pauses before the results update, in milliseconds.
export const SEARCH_PAUSE = 300;

// The library's search field: a GET form for `q`, so Enter works before the
// scripts load. With them, the results update as you type, and each update
// replaces the address. See openspec/specs/library-search.
export function SearchField({
  q,
  count,
}: {
  // The search the page shows.
  q: string;
  // How many sheets it found, or null when the page shows no search.
  count: number | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [text, setText] = useState(q);

  // Follow the address, as after Back, unless the person is typing.
  useEffect(() => {
    if (document.activeElement !== input.current) setText(q);
  }, [q]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

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
        show(text);
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
        value={text}
        onChange={(event) => {
          const value = event.target.value;
          setText(value);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            show(value);
          }, SEARCH_PAUSE);
        }}
      />
      {/* Read out when it changes. Without results, the page says so, and
          this only tells screen readers. */}
      <span className="search-field-count" role="status">
        {count === 0 ? (
          <span className="visually-hidden">No sheets match</span>
        ) : (
          countText(count)
        )}
      </span>
      {text !== "" && (
        <IconButton
          icon="close"
          label="Clear search"
          onClick={() => {
            setText("");
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

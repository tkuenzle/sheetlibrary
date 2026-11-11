import "./menu.css";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";

import { Button, IconButton } from "./button";
import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Popover } from "./popover";

export interface MenuItem {
  label: string;
  icon: IconName;
  disabled?: boolean;
  // An item that is on or off, with a check after its name when on.
  checked?: boolean;
  // A line after the item, to set it apart from the next ones.
  separated?: boolean;
  onSelect: () => void;
}

// Where the list opens: under the button at its right edge (the default) or
// its left edge, or above it at its right edge, for a button docked at the
// bottom of the screen.
export type MenuPlacement = "below-end" | "below-start" | "above-end";

// A button that opens a short list of actions. It is an icon button named by
// `label`, or, with `text`, a tonal button that shows `label` and a chevron.
// It opens with the first item focused; the arrow keys, Home and End move
// between the items. Escape or a click outside closes it, with the focus back
// on the button. A picked item closes it and leaves the focus to the item's
// action. With `fixed`, the list is placed against the window where it would
// open, so a scrolling box around the menu doesn't cut it off.
export function Menu({
  label,
  icon = "moreVert",
  items,
  text = false,
  size,
  placement = "below-end",
  fixed = false,
}: {
  label: string;
  icon?: IconName;
  items: MenuItem[];
  text?: boolean;
  // Large for the main actions docked at the bottom of a phone.
  size?: "large";
  placement?: MenuPlacement;
  fixed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [fixedAt, setFixedAt] = useState<CSSProperties>();
  const wrapper = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function menuItems() {
    return [
      ...(list.current?.querySelectorAll<HTMLButtonElement>(
        ":is([role=menuitem], [role=menuitemcheckbox]):not(:disabled)",
      ) ?? []),
    ];
  }

  function close() {
    setOpen(false);
    wrapper.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  }

  useEffect(() => {
    if (!open) return;
    // With every item disabled, the list takes the focus, so Escape still
    // closes it.
    (menuItems()[0] ?? list.current)?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as globalThis.Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const toggle = {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? menuId : undefined,
    onClick: (event: { currentTarget: HTMLElement }) => {
      if (fixed && !open) {
        setFixedAt(fixedPosition(event.currentTarget, placement));
      }
      setOpen(!open);
    },
  } as const;

  return (
    <div className={`menu menu-${placement}`} ref={wrapper}>
      {text ? (
        <Button
          variant="tonal"
          size={size}
          icon={icon}
          className="menu-toggle-text"
          {...toggle}
        >
          {label}
          <Icon name="expandMore" />
        </Button>
      ) : (
        <IconButton icon={icon} label={label} {...toggle} />
      )}
      {open && (
        <Popover
          ref={list}
          id={menuId}
          role="menu"
          aria-label={label}
          className="menu-list"
          style={fixed ? fixedAt : undefined}
          tabIndex={-1}
          onKeyDown={(event) => {
            const all = menuItems();
            const at = all.indexOf(document.activeElement as HTMLButtonElement);
            let next: HTMLButtonElement | undefined;
            if (event.key === "ArrowDown") next = all[(at + 1) % all.length];
            else if (event.key === "ArrowUp")
              next = all[(at - 1 + all.length) % all.length];
            else if (event.key === "Home") next = all[0];
            else if (event.key === "End") next = all.at(-1);
            else if (event.key === "Escape") {
              event.preventDefault();
              close();
              return;
            } else if (event.key === "Tab") {
              setOpen(false);
              return;
            } else return;
            event.preventDefault();
            next?.focus();
          }}
        >
          {items.map((item) => (
            <MenuEntry
              key={item.label}
              item={item}
              onSelect={() => {
                setOpen(false);
                item.onSelect();
              }}
            />
          ))}
        </Popover>
      )}
    </div>
  );
}

// Where a fixed list opens for a placement, against the window, from the
// button's place. The gaps are the ones in menu.css.
function fixedPosition(
  button: HTMLElement,
  placement: MenuPlacement,
): CSSProperties {
  const box = button.getBoundingClientRect();
  const fromRight = document.documentElement.clientWidth - box.right;
  const gap = 4;
  switch (placement) {
    case "below-end":
      return { position: "fixed", top: box.bottom + gap, right: fromRight };
    case "below-start":
      return { position: "fixed", top: box.bottom + gap, left: box.left };
    case "above-end":
      return {
        position: "fixed",
        bottom: window.innerHeight - box.top + 12,
        right: fromRight,
      };
  }
}

// One item of the list, and the line after it if it has one.
export function MenuEntry({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: () => void;
}) {
  const checkable = item.checked !== undefined;
  return (
    <>
      <button
        type="button"
        role={checkable ? "menuitemcheckbox" : "menuitem"}
        aria-checked={checkable ? item.checked : undefined}
        tabIndex={-1}
        className="menu-item"
        disabled={item.disabled}
        onClick={onSelect}
      >
        <Icon name={item.icon} />
        {item.label}
        {item.checked && <Icon name="check" />}
      </button>
      {item.separated && <div role="separator" className="menu-separator" />}
    </>
  );
}

import "./floating-button.css";

import {
  type ComponentProps,
  type CSSProperties,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { closeAfterExit, exitOnEscape } from "./exit";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { type MenuItem, nextMenuItem } from "./menu";

// The screen's main add action on a phone: a square button with an icon,
// floating at the bottom right, above the shell's bar. Wider, CSS hides it,
// and the screen shows the action elsewhere. `inPlace` shows it where it is,
// at any width, as on the design page. See openspec/specs/site-layout.
export function FloatingButton({
  icon,
  label,
  inPlace = false,
  className,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "children"> & {
  icon: IconName;
  // The button's name, read by screen readers.
  label: string;
  inPlace?: boolean;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={className ? `floating-button ${className}` : "floating-button"}
      data-in-place={inPlace || undefined}
      {...props}
    >
      <Icon name={icon} size={28} />
    </button>
  );
}

// A floating button that opens a menu: the items stacked above it as large
// buttons, over the dimmed screen, with "Close" in the button's spot. It is a
// modal dialog, so the page and the bar are inert while it is open. The
// first item takes the focus; the arrow keys, Home and End move between the
// items. Escape, "Close" or a tap on the dimmed screen closes it, with the
// focus back on the button. A picked item closes it and leaves the focus to
// the item's action. The items rise one after another, the one nearest the
// button first; closing, they leave together (see ui/exit.ts). A picked item
// closes it at once, so the focus is back on the button for its action.
export function FloatingMenu({
  label,
  icon,
  items,
  inPlace = false,
}: {
  label: string;
  icon: IconName;
  items: MenuItem[];
  inPlace?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    list.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [open]);

  function close() {
    closeAfterExit(dialog.current);
  }

  return (
    <>
      <FloatingButton
        ref={button}
        icon={icon}
        label={label}
        inPlace={inPlace}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen(true);
        }}
      />
      <dialog
        ref={dialog}
        className="floating-menu"
        aria-label={label}
        onKeyDown={exitOnEscape}
        onClose={() => {
          setOpen(false);
          button.current?.focus();
        }}
        // The dialog fills the window, so a click on the dialog itself was on
        // the dimmed screen.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && (
          <>
            <div
              ref={list}
              id={menuId}
              role="menu"
              aria-label={label}
              className="floating-menu-list"
              onKeyDown={(event) => {
                const all = [
                  ...(list.current?.querySelectorAll<HTMLElement>(
                    "[role=menuitem]",
                  ) ?? []),
                ];
                const next = nextMenuItem(
                  event.key,
                  all,
                  document.activeElement as HTMLElement | null,
                );
                if (!next) return;
                event.preventDefault();
                next.focus();
              }}
            >
              {items.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className="button button-tonal floating-menu-item"
                  // Its place from the button, for when it rises.
                  style={{ "--i": items.length - 1 - index } as CSSProperties}
                  disabled={item.disabled}
                  onClick={() => {
                    // Closing puts the focus back on the button first, so
                    // the item's action can move it on.
                    dialog.current?.close();
                    item.onSelect();
                  }}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Close"
              className="floating-button floating-menu-close"
              onClick={close}
            >
              <Icon name="close" size={28} />
            </button>
          </>
        )}
      </dialog>
    </>
  );
}

import "./tooltip.css";

import {
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

export type TooltipPlacement = "bottom" | "top" | "right" | "left";

// How long the pointer must rest on the control, in milliseconds.
const hoverDelay = 500;

// Shows `text` next to its control: after a moment when the pointer rests on
// it, and right away when it gets focus from the keyboard. Escape hides it.
// Touch never shows it: there is no hover, and a long press is meant as a
// press. It only repeats the control's name, so screen readers skip it.
export function Tooltip({
  text,
  placement = "bottom",
  children,
}: {
  text: string;
  placement?: TooltipPlacement | undefined;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef(0);

  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(show, hoverDelay);
  };

  const onFocus = (event: FocusEvent) => {
    if (event.target.matches(":focus-visible")) show();
  };

  return (
    <span
      className="tooltip-anchor"
      onPointerEnter={onPointerEnter}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={onFocus}
      onBlur={hide}
    >
      {children}
      <span
        className={`tooltip tooltip-${placement}`}
        aria-hidden="true"
        hidden={!open}
      >
        {text}
      </span>
    </span>
  );
}

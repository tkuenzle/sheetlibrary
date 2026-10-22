import "./popover.css";

import type { ComponentProps } from "react";

// The surface of a small panel over the page, such as the chord input. The
// caller places it.
export function Popover({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={className ? `popover ${className}` : "popover"}
      {...props}
    />
  );
}

import "./toolbar.css";

import type { ComponentProps } from "react";

// A pill that holds a group of buttons, such as a section's tools.
export function Toolbar({
  label,
  orientation = "horizontal",
  className,
  ...props
}: ComponentProps<"div"> & {
  label: string;
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={className ? `toolbar ${className}` : "toolbar"}
      {...props}
    />
  );
}

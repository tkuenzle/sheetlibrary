import "./icon.css";

import { type IconName, iconPaths, iconViewBox } from "./icons";

// An icon is decoration: the control around it carries the name.
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      viewBox={iconViewBox}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

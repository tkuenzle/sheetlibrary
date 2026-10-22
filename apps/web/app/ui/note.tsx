import "./note.css";

import type { ReactNode } from "react";

import { Icon } from "./icon";

// A short message about the page, such as the prototype notice.
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <Icon name="info" size={20} />
      <p>{children}</p>
    </div>
  );
}

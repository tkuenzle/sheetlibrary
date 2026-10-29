import "./note.css";

import type { ReactNode } from "react";

import { Icon } from "./icon";

// A short message about the page, such as the prototype notice.
export function Note({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div className="note" id={id}>
      <Icon name="info" size={20} />
      <p>{children}</p>
    </div>
  );
}

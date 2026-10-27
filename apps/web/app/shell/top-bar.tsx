import "./top-bar.css";

import type { ReactNode } from "react";

// The bar at the top of a page: the site's name, linking home, the song's
// title after it, and the page's actions at the end. The link loads the home
// page in full, so a page with unsaved edits can warn before they go.
export function TopBar({
  title,
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <header className="top-bar">
      <a className="top-bar-name" href="/">
        Sheet Library
      </a>
      {title && (
        <span className="top-bar-title">
          <span aria-hidden="true">/</span> {title}
        </span>
      )}
      {children && <div className="top-bar-actions">{children}</div>}
    </header>
  );
}

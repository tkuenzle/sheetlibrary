import "./library-tabs.css";

// The library's two tabs, below its heading: Sheets at /sheets and
// Collections at /collections. Each tab is a page of its own, so they are
// links, with the open one marked as the current page, not an ARIA tab list.
// See openspec/specs/library-page.
export function LibraryTabs({
  current,
}: {
  current: "sheets" | "collections";
}) {
  return (
    <nav className="library-tabs" aria-label="Library">
      <a
        href="/sheets"
        aria-current={current === "sheets" ? "page" : undefined}
      >
        Sheets
      </a>
      <a
        href="/collections"
        aria-current={current === "collections" ? "page" : undefined}
      >
        Collections
      </a>
    </nav>
  );
}

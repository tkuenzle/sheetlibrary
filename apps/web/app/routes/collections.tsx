import "./sheets.css";
import "./collections.css";

import { Link } from "react-router";

import {
  type CollectionListItem,
  sheetCount,
} from "../collections/collections";
import { NewCollection } from "../collections/new-collection";
import { RouteError } from "../shell/route-error";
import type { Route } from "./+types/collections";
import { useShellCollections } from "./shell";

// The Collections screen of the library: the signed-in person's collections,
// A to Z, as cards with their count and first titles, and "New collection". The shell (routes/shell.tsx) loads them, for
// its rail and for this screen, and sends a visitor to sign-in. See
// openspec/specs/library-page.

export function meta() {
  return [
    { title: "Collections | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

// A page that can't be loaded shows a note in the shell, which stays. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteError error={error} />;
}

export default function Collections() {
  return <CollectionsView collections={useShellCollections()} />;
}

export function CollectionsView({
  collections,
}: {
  collections: CollectionListItem[];
}) {
  if (collections.length === 0) {
    return (
      <div className="library">
        <h1>Collections</h1>
        <section className="library-empty" aria-labelledby="collections-empty">
          <h2 id="collections-empty">No collections yet</h2>
          <div className="library-actions">
            <NewCollection />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="library library-with-sheets">
      <div className="library-heading">
        <h1>Collections</h1>
        <div className="library-actions library-actions-beside">
          <NewCollection variant="tonal" />
        </div>
      </div>
      <ul className="collections-cards">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link to={`/collections/${collection.id}`}>
              <span className="collections-name">{collection.name}</span>
              <span className="collections-count">
                {sheetCount(collection.count)}
              </span>
              {collection.titles.length > 0 && (
                <span className="collections-titles">
                  {collection.titles.join(", ")}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import "../ui/group-list.css";
import "./sheets.css";
import "./collections.css";

import { redirect, useNavigate } from "react-router";

import {
  type CollectionListItem,
  sheetCount,
} from "../collections/collections";
import { listCollections } from "../collections/collections.server";
import { NewCollection } from "../collections/new-collection";
import { cloudflareContext, sessionContext } from "../context";
import { TopBar } from "../shell/top-bar";
import { LibraryTabs } from "../sheets/library-tabs";
import { Icon } from "../ui/icon";
import type { Route } from "./+types/collections";

// The library's Collections tab: the signed-in person's collections, A to Z,
// and "New collection". See openspec/specs/library-page.

export function meta() {
  return [
    { title: "Collections | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  return { collections: await listCollections(env.DB, session.user.id) };
}

export default function Collections({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <>
      <TopBar />
      <CollectionsView
        collections={loaderData.collections}
        onCreated={(collection) => {
          void navigate(`/collections/${collection.id}`);
        }}
      />
    </>
  );
}

export function CollectionsView({
  collections,
  onCreated,
}: {
  collections: CollectionListItem[];
  onCreated: (collection: { id: string; name: string }) => void;
}) {
  if (collections.length === 0) {
    return (
      <main className="library">
        <h1>Library</h1>
        <LibraryTabs current="collections" />
        <section className="library-empty" aria-labelledby="collections-empty">
          <h2 id="collections-empty">No collections yet</h2>
          <div className="library-actions">
            <NewCollection onCreated={onCreated} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="library library-with-sheets">
      <div className="library-heading">
        <h1>Library</h1>
        <div className="library-actions library-actions-beside">
          <NewCollection onCreated={onCreated} />
        </div>
      </div>
      <LibraryTabs current="collections" />
      <ul className="group-list collections-list">
        {collections.map((collection) => (
          <li key={collection.id}>
            <a href={`/collections/${collection.id}`}>
              <span className="collections-name">{collection.name}</span>
              <span className="collections-count">
                {sheetCount(collection.count)}
              </span>
              <Icon name="chevronRight" />
            </a>
          </li>
        ))}
      </ul>
      <div className="library-actions library-actions-docked">
        <NewCollection size="large" onCreated={onCreated} />
      </div>
    </main>
  );
}

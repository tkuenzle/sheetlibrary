import "./sheets.css";

import { useEffect, useState } from "react";
import { Form, redirect } from "react-router";

import { cloudflareContext, sessionContext } from "../context";
import { TopBar } from "../shell/top-bar";
import { editDate, lastEdit } from "../sheets/last-edit";
import {
  createSheet,
  listSheets,
  type SheetListItem,
} from "../sheets/sheets.server";
import { Button } from "../ui/button";
import type { Route } from "./+types/sheets";

// The library: the signed-in person's sheets, and "New sheet". See
// openspec/specs/library-page.

export function meta() {
  return [
    { title: "Library | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  return { sheets: await listSheets(env.DB, session.user.id) };
}

// "New sheet". A form on another site can't get here signed in, since the
// session cookie is SameSite=Lax, so it is sent to sign-in like a visitor.
export async function action({ context }: Route.ActionArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await createSheet(env.DB, session.user.id, {
    title: "Untitled",
    content: { format: "chordsheet", version: 1, sections: [] },
  });
  return redirect(`/sheets/${sheet.id}`);
}

export default function Library({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <TopBar />
      <LibraryView sheets={loaderData.sheets} />
    </>
  );
}

// Posts to the action above. Works before the scripts load.
function NewSheet({ size, className }: { size?: "large"; className?: string }) {
  return (
    <Form method="post" className={className}>
      <Button type="submit" icon="add" size={size}>
        New sheet
      </Button>
    </Form>
  );
}

export function LibraryView({ sheets }: { sheets: SheetListItem[] }) {
  // The viewer's time zone is only known in the browser. Until then, the
  // last edit is hidden, with the date in UTC holding its place.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const now = Date.now();
  const edited = (at: number) =>
    hydrated ? lastEdit(at, now) : editDate(at, now, "UTC");

  if (sheets.length === 0) {
    return (
      <main className="library">
        <h1>Library</h1>
        <section className="library-empty" aria-labelledby="library-empty">
          <h2 id="library-empty">No sheets yet</h2>
          <NewSheet />
        </section>
      </main>
    );
  }

  return (
    <main className="library library-with-sheets">
      <div className="library-heading">
        <h1>Library</h1>
        <NewSheet className="library-new-beside" />
      </div>
      <div className="library-list">
        <div className="library-columns library-labels" aria-hidden="true">
          <span>Title</span>
          <span>Artist</span>
          <span>Edited</span>
        </div>
        <ul>
          {sheets.map((sheet) => (
            <li key={sheet.id}>
              <a className="library-columns" href={`/sheets/${sheet.id}`}>
                <span className="library-title">{sheet.title}</span>
                <span className="library-details">
                  <span>{sheet.artist}</span>
                  {sheet.artist && (
                    <span className="library-separator" aria-hidden="true">
                      {" · "}
                    </span>
                  )}
                  <span
                    className="library-edited"
                    data-pending={hydrated ? undefined : ""}
                  >
                    {edited(sheet.updatedAt)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <NewSheet size="large" className="library-new-docked" />
    </main>
  );
}

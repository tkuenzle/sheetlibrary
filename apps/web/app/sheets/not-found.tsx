import "./not-found.css";

import { TopBar } from "../shell/top-bar";

const pages = {
  sheet: {
    title: "Sheet not found",
    text: "This sheet doesn’t exist, or it belongs to another account.",
  },
  collection: {
    title: "Collection not found",
    text: "This collection doesn’t exist, or it belongs to another account.",
  },
};

// A sheet's or a collection's page, for an id that doesn't exist or belongs
// to another account: both get the same answer. A sheet's page has its own
// top bar. A collection's sits in the shell, which has the navigation.
export function NotFound({
  what = "sheet",
}: {
  what?: "sheet" | "collection";
}) {
  const page = pages[what];
  if (what === "collection") {
    return (
      <div className="sheet-not-found">
        <h1>{page.title}</h1>
        <p>{page.text}</p>
      </div>
    );
  }
  return (
    <>
      <TopBar back />
      <main className="sheet-not-found">
        <h1>{page.title}</h1>
        <p>{page.text}</p>
      </main>
    </>
  );
}

import "./not-found.css";

import { TopBar } from "../shell/top-bar";

const pages = {
  sheet: {
    back: true,
    title: "Sheet not found",
    text: "This sheet doesn’t exist, or it belongs to another account.",
  },
  collection: {
    back: { href: "/collections", label: "Collections" },
    title: "Collection not found",
    text: "This collection doesn’t exist, or it belongs to another account.",
  },
};

// A sheet's or a collection's page, for an id that doesn't exist or belongs
// to another account: both get the same answer.
export function NotFound({
  what = "sheet",
}: {
  what?: "sheet" | "collection";
}) {
  const page = pages[what];
  return (
    <>
      <TopBar back={page.back} />
      <main className="sheet-not-found">
        <h1>{page.title}</h1>
        <p>{page.text}</p>
      </main>
    </>
  );
}

import "./not-found.css";

import { TopBar } from "../shell/top-bar";

// A sheet's pages, for an id that doesn't exist or belongs to another
// account: both get the same answer.
export function NotFound() {
  return (
    <>
      <TopBar back />
      <main className="sheet-not-found">
        <h1>Sheet not found</h1>
        <p>This sheet doesn’t exist, or it belongs to another account.</p>
      </main>
    </>
  );
}

import "../ui/button.css";
import "./home.css";

import { redirect } from "react-router";

import { sessionContext } from "../context";
import { SampleSheet } from "../home/sample-sheet";
import { TopBar } from "../shell/top-bar";
import type { Route } from "./+types/home";

export function meta() {
  return [
    { title: "Sheet Library" },
    { name: "description", content: "A library for your sheet music." },
  ];
}

// Signed-in people go to their library.
export function loader({ context }: Route.LoaderArgs) {
  if (context.get(sessionContext)) return redirect("/sheets");
  return null;
}

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="home">
        <div className="home-intro">
          <h1>A library for your sheet music</h1>
          <p>
            Coming soon. Until then, try the chord editor: place chords above
            the lyrics and move them by hand.
          </p>
          <a className="button button-filled home-link" href="/editor">
            Try the chord editor
          </a>
        </div>
        <div className="home-sample">
          <SampleSheet />
        </div>
      </main>
    </>
  );
}

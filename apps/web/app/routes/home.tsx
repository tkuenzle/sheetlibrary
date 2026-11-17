import "../ui/button.css";
import "./home.css";

import { redirect } from "react-router";

import { sessionContext } from "../context";
import { SampleSheet } from "../home/sample-sheet";
import { TopBar } from "../shell/top-bar";
import { Icon } from "../ui/icon";
import type { Route } from "./+types/home";

// The front door for visitors: what the app is for, two ways in, and a
// sample sheet to transpose. See openspec/specs/home-page.

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
      {/* In this order in one column; on a wide window, the list moves
          under the intro, beside the sample (see home.css). */}
      <main className="home">
        <div className="home-intro">
          <h1>Every song you play, in one place</h1>
          <p>
            Keep your chord sheets in one library. Change the key, add a capo,
            and play from any screen.
          </p>
          <div className="home-ways">
            <a className="button button-filled home-way" href="/sign-in">
              Sign in
            </a>
            <a className="button button-text home-way" href="/editor">
              Try it first
            </a>
          </div>
        </div>
        <div className="home-sample">
          <SampleSheet />
          <p className="home-sample-note">
            A sample sheet. Try changing the key.
          </p>
        </div>
        <ul className="home-features">
          <li>
            <Icon name="photoCamera" />
            Add sheets from photos or from Ultimate Guitar
          </li>
          <li>
            <Icon name="swapVert" />
            Save a key for each singer
          </li>
          <li>
            <Icon name="stacks" />
            Group sheets in collections
          </li>
        </ul>
      </main>
    </>
  );
}

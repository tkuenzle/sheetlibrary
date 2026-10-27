import "../ui/button.css";
import "./home.css";

import { SampleSheet } from "../home/sample-sheet";
import { TopBar } from "../shell/top-bar";

export function meta() {
  return [
    { title: "Sheet Library" },
    { name: "description", content: "A library for your sheet music." },
  ];
}

export default function Home() {
  return (
    <>
      <TopBar />
      <main className="home">
        <div className="home-intro">
          <h1>A library for your sheet music</h1>
          <p>
            Coming soon. Until then, you can try the chord editor: place chords
            above the lyrics and move them by hand.
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

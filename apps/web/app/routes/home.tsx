export function meta() {
  return [
    { title: "Sheet Library" },
    { name: "description", content: "A library for your sheet music." },
  ];
}

export default function Home() {
  return (
    <main>
      <h1>Sheet Library</h1>
      <p>A library for your sheet music. Coming soon.</p>
      <p>
        <a href="/spike/editor">Try the chord editor prototype</a>
      </p>
    </main>
  );
}

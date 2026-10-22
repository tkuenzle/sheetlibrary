import "./design.css";

import { Button, IconButton } from "../ui/button";
import { Note } from "../ui/note";
import { Popover } from "../ui/popover";
import { Toolbar } from "../ui/toolbar";

// The base components in both styles, for review. Only in previews and the
// dev server (see routes.ts and openspec/specs/design-system).

export function meta() {
  return [
    { title: "Design | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

const colors = [
  "page",
  "surface",
  "surface-active",
  "text",
  "text-muted",
  "text-dimmed",
  "chord",
  "chord-dimmed",
  "accent",
  "on-accent",
  "accent-soft",
  "on-accent-soft",
  "info",
  "on-info",
  "quiet",
  "on-quiet",
  "border",
  "tooltip",
  "on-tooltip",
  "focus",
];

const type = [
  { name: "Title", size: "title", weight: 800, sample: "Amazing Grace" },
  { name: "Heading", size: "heading", weight: 700, sample: "How to edit" },
  {
    name: "Lyrics",
    size: "lyrics",
    weight: 400,
    sample: "'Twas grace that taught my heart to fear",
  },
  { name: "Chord", size: "chord", weight: 700, sample: "G G7 Cmaj7 F#m7b5" },
  {
    name: "Body",
    size: "body",
    weight: 400,
    sample: "At a section's start, join it with the one above",
  },
  { name: "Label", size: "label", weight: 600, sample: "Add chord" },
  { name: "Small", size: "small", weight: 500, sample: "Ctrl K" },
];

export default function DesignPage() {
  return (
    <main className="design-page">
      <h1>Design</h1>
      <p>
        The base components in the light and the lamplight style. Hover or tab
        to an icon button to see its tooltip. See docs/design-direction.md.
      </p>
      <div className="design-styles">
        <Style theme="light" name="Light" />
        <Style theme="lamplight" name="Lamplight" />
      </div>
    </main>
  );
}

function Style({ theme, name }: { theme: string; name: string }) {
  return (
    <section className="design-style" data-theme={theme}>
      <h2>{name}</h2>

      <div>
        <h3>Buttons</h3>
        <div className="design-row">
          <Button icon="add">Chord</Button>
          <Button variant="tonal">OK</Button>
          <Button variant="text">Cancel</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div>
        <h3>Toolbars and icon buttons</h3>
        <div className="design-row">
          <Toolbar label="Section" orientation="vertical">
            <IconButton
              icon="add"
              label="Add chord"
              variant="filled"
              size="large"
              tooltipPlacement="right"
            />
            <IconButton
              icon="arrowUpward"
              label="Move section up"
              tooltipPlacement="right"
            />
            <IconButton
              icon="arrowDownward"
              label="Move section down"
              tooltipPlacement="right"
              disabled
            />
          </Toolbar>
          <Toolbar label="Section, docked">
            <Button icon="add" size="small">
              Chord
            </Button>
            <IconButton
              icon="arrowUpward"
              label="Move section up"
              tooltipPlacement="top"
            />
            <IconButton
              icon="arrowDownward"
              label="Move section down"
              tooltipPlacement="top"
            />
          </Toolbar>
          <IconButton icon="help" label="How to edit" />
        </div>
      </div>

      <div>
        <h3>Popover</h3>
        <Popover>
          <Button size="small">OK</Button>
          <Button variant="text" size="small">
            Delete
          </Button>
          <Button variant="text" size="small">
            Cancel
          </Button>
        </Popover>
      </div>

      <div>
        <h3>Note</h3>
        <Note>This is a prototype. Nothing is saved.</Note>
      </div>

      <div>
        <h3>Type</h3>
        <div className="design-type">
          {type.map(({ name, size, weight, sample }) => (
            <p
              key={name}
              style={{
                fontSize: `var(--font-size-${size})`,
                fontWeight: weight,
                color: size === "chord" ? "var(--chord)" : undefined,
              }}
            >
              {sample}
            </p>
          ))}
        </div>
      </div>

      <div>
        <h3>Colors</h3>
        <ul className="design-swatches">
          {colors.map((color) => (
            <li key={color}>
              <span style={{ background: `var(--${color})` }} />
              --{color}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

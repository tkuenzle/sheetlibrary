import add from "./icons/add.svg?raw";
import arrowDownward from "./icons/arrow_downward.svg?raw";
import arrowUpward from "./icons/arrow_upward.svg?raw";
import help from "./icons/help.svg?raw";
import info from "./icons/info.svg?raw";

// The icons the UI uses: Material Symbols Rounded, weight 500, drawn for 24px
// (Apache License 2.0). Only the icons listed here are bundled. To add one,
// save it from Google's static icons and list it here:
// https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<name>/wght500/24px.svg
// The npm packages only have icons drawn for 48px, which look too thin at
// 24px.
const sources = { add, arrowDownward, arrowUpward, help, info };

export type IconName = keyof typeof sources;

// All Material Symbols share this view box.
export const iconViewBox = "0 -960 960 960";

// Each icon is a single path; only its outline is kept.
export const iconPaths = Object.fromEntries(
  Object.entries(sources).map(([name, svg]) => {
    const path = /<path d="([^"]+)"/.exec(svg)?.[1];
    if (!path) throw new Error(`The icon "${name}" has no path`);
    return [name, path];
  }),
) as Record<IconName, string>;

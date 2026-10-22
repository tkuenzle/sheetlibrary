import add from "@material-symbols/svg-500/rounded/add.svg?raw";
import arrowDownward from "@material-symbols/svg-500/rounded/arrow_downward.svg?raw";
import arrowUpward from "@material-symbols/svg-500/rounded/arrow_upward.svg?raw";
import help from "@material-symbols/svg-500/rounded/help.svg?raw";
import info from "@material-symbols/svg-500/rounded/info.svg?raw";

// The icons the UI uses: Material Symbols Rounded, weight 500, outlined. Only
// the icons listed here are bundled. To use another one, add it here.
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

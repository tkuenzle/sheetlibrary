import { type RouteConfig, index, route } from "@react-router/dev/routes";

// This file runs in Node, at build time and in the dev server, never in the
// worker. The app's code has no Node types, so only what's used is declared.
declare const process: { env: Partial<Record<string, string>> };

// The design page shows the base components. It is only in pull request
// previews (built with CLOUDFLARE_ENV=preview) and the dev server, so the
// production build doesn't contain it. See openspec/specs/design-system.
const withDesignPage =
  import.meta.env.DEV || process.env.CLOUDFLARE_ENV === "preview";

export default [
  index("routes/home.tsx"),
  route("editor", "routes/editor.tsx"),
  ...(withDesignPage ? [route("design", "routes/design.tsx")] : []),
] satisfies RouteConfig;

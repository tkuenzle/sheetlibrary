import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

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
  route("sign-in", "routes/sign-in.tsx"),
  // The library's screens and the account page sit in the shell, which stays
  // on screen between them. A sheet has its own page, outside it. See
  // openspec/specs/site-layout.
  layout("routes/shell.tsx", [
    route("sheets", "routes/sheets.tsx"),
    route("collections", "routes/collections.tsx"),
    route("collections/:id", "routes/collection.tsx"),
    route("account", "routes/account.tsx"),
  ]),
  route("sheets/:id", "routes/sheet.tsx"),
  route("sheets/:id/edit", "routes/sheet.edit.tsx"),
  route("api/sheets", "routes/api.sheets.ts"),
  route("api/sheets/:id", "routes/api.sheet.ts"),
  route("api/sheets/:id/versions", "routes/api.sheet-versions.ts"),
  route("api/sheets/:id/versions/:versionId", "routes/api.sheet-version.ts"),
  route("api/sheets/:id/collections", "routes/api.sheet-collections.ts"),
  route(
    "api/sheets/:id/collections/:collectionId",
    "routes/api.sheet-collection.ts",
  ),
  route("api/collections", "routes/api.collections.ts"),
  route("api/collections/:id", "routes/api.collection.ts"),
  route("api/photo-import", "routes/api.photo-import.ts"),
  ...(withDesignPage ? [route("design", "routes/design.tsx")] : []),
] satisfies RouteConfig;

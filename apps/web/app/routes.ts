import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("section-editor", "routes/section-editor.tsx"),
  route("spike/editor", "routes/spike-editor.tsx"),
] satisfies RouteConfig;

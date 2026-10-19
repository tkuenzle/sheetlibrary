import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("spike/editor", "routes/spike-editor.tsx"),
] satisfies RouteConfig;

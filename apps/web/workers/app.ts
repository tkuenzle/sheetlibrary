import { createRequestHandler } from "react-router";

import { isAuthPath } from "../app/auth/auth-path";
import { getAuth } from "../app/auth/auth.server";
import {
  previewMigrations,
  previewMigrationsPath,
} from "../app/db/preview-migrations.server";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (isAuthPath(pathname)) {
      return getAuth(env, request).handler(request);
    }
    if (pathname === previewMigrationsPath) {
      return previewMigrations(request, env);
    }
    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;

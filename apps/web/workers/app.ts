import { createRequestHandler, RouterContextProvider } from "react-router";

import { isAuthPath } from "../app/auth/auth-path";
import { getAuth } from "../app/auth/auth.server";
import { cloudflareContext } from "../app/context";
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
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;

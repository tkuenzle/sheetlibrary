import { useCallback, useContext, useEffect } from "react";
import { UNSAFE_FrameworkContext } from "react-router";

// The code of the routes a screen's fetchers go to, loaded ahead. A fetcher
// whose route's code can't load makes React Router reload the page, and
// offline that shows nothing. So a screen names the routes its fetchers go
// to, their code loads as soon as it shows, and no fetcher starts before it
// is there. A load that fails, such as offline, is tried again the next
// time. Issue #141 may load pages' code ahead in general and take this over.

// The manifest's part this needs: each route's code, by its id in React
// Router's route list, such as "routes/api.collection".
interface Manifest {
  routes: Record<
    string,
    | {
        module: string;
        clientLoaderModule: string | undefined;
        clientActionModule: string | undefined;
      }
    | undefined
  >;
}

const loading = new Map<string, Promise<unknown>>();

// Loads one route's code, once. Importing a module's address again later
// gives the module the browser already has, so React Router's own import
// doesn't need the network. Route modules are split, so that is the main,
// client-loader and client-action chunks.
function loadRoute(manifest: Manifest, id: string): Promise<unknown> {
  let load = loading.get(id);
  if (!load) {
    const route = manifest.routes[id];
    const addresses = route
      ? [route.module, route.clientLoaderModule, route.clientActionModule]
      : [];
    load = Promise.all(
      addresses
        .filter((address) => address !== undefined)
        .map((address) => import(/* @vite-ignore */ address)),
    ).catch((error: unknown) => {
      loading.delete(id);
      throw error;
    });
    loading.set(id, load);
  }
  return load;
}

// Starts loading the routes' code, and gives a function that settles once
// it is all there, or fails when it can't load. Every fetcher to the routes
// waits for it.
export function useRouteCode(ids: readonly string[]): () => Promise<unknown> {
  const framework = useContext(UNSAFE_FrameworkContext);
  const key = ids.join(",");
  const ready = useCallback(
    () =>
      framework
        ? Promise.all(
            key.split(",").map((id) => loadRoute(framework.manifest, id)),
          )
        : Promise.resolve(),
    [framework, key],
  );
  useEffect(() => {
    ready().catch(() => undefined);
  }, [ready]);
  return ready;
}

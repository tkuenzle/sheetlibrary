import { forgetKept } from "./shell/kept";

// How the browser sends a request to the app's API outside React Router's
// forms and fetchers. A request that changes the person's data forgets the
// pages kept for Back first, as the root's client middleware does for forms
// and fetchers, so Back never shows what the change replaced. See
// shell/kept.ts and openspec/specs/site-layout ("A change forgets what Back
// shows").
export const sendChange: typeof fetch = (input, init) => {
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  if (!["GET", "HEAD"].includes(method.toUpperCase())) forgetKept();
  return fetch(input, init);
};

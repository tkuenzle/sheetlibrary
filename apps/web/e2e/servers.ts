// Where Playwright serves the app, the editor harness, and the dev server
// with the design page.
export const appPort = 4173;
export const harnessPort = 4174;
export const devPort = 4175;

export const appURL = `http://localhost:${String(appPort)}`;
export const harnessURL = `http://localhost:${String(harnessPort)}`;
export const devURL = `http://localhost:${String(devPort)}`;

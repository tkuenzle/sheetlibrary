import {
  checkEnvelope,
  newSheetId,
  type Problem,
  type Sheet,
} from "chordsheet";

import {
  changeVersion,
  createSheet,
  createVersion,
  deleteSheet,
  deleteVersion,
  FIRST_REVISION,
  listVersions,
  readSheet,
  saveSheet,
  type VersionResult,
} from "./sheets.server";

// The sheets API under /api/sheets, as plain functions from a request to a
// response, so the route modules stay thin. See openspec/specs/sheet-storage.

// The largest request body a create or a save accepts.
export const maxSheetBytes = 256 * 1024;

// The answer to a save.
export interface Saved {
  revision: number;
}

function error(status: number, message: string, problems?: Problem[]) {
  return Response.json(
    problems ? { error: message, problems } : { error: message },
    { status },
  );
}

const notSignedIn = () => error(401, "Not signed in");
const notFound = () => error(404, "Sheet not found");
const notAllowed = () => error(405, "Method not allowed");

// Reads the body as JSON, or answers why it can't. The body must say it is
// JSON: a form on another site can't, so it can't create or change a sheet.
async function readBody(
  request: Request,
): Promise<{ value: unknown } | { response: Response }> {
  const type = request.headers.get("Content-Type") ?? "";
  if (!/^application\/json\b/i.test(type)) {
    return { response: error(415, "Body must be JSON") };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxSheetBytes) {
    return { response: error(400, "Sheet is too large") };
  }
  try {
    return { value: JSON.parse(text) as unknown };
  } catch {
    return { response: error(400, "Body is not JSON") };
  }
}

// /api/sheets: POST creates a sheet from a title, an optional artist and
// content, and answers with the new sheet.
export async function handleSheets(
  request: Request,
  db: D1Database,
  userId: string | null,
): Promise<Response> {
  if (request.method !== "POST") return notAllowed();
  if (!userId) return notSignedIn();
  const body = await readBody(request);
  if ("response" in body) return body.response;
  // Checked as a whole sheet, with a stand-in for what storage adds.
  const problems = checkEnvelope({
    ...(body.value as object),
    id: newSheetId(),
    revision: FIRST_REVISION,
  });
  if (problems.length > 0) return error(400, "Sheet is not valid", problems);
  const { title, artist, content } = body.value as Sheet;
  const sheet = await createSheet(db, userId, { title, artist, content });
  return Response.json(sheet, { status: 201 });
}

// /api/sheets/:id: GET reads the sheet, PUT saves it and DELETE deletes it.
// A save holds the whole sheet, with the revision it was based on.
export async function handleSheet(
  request: Request,
  db: D1Database,
  userId: string | null,
  id: string,
): Promise<Response> {
  if (!["GET", "PUT", "DELETE"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();

  if (request.method === "GET") {
    const sheet = await readSheet(db, userId, id);
    return sheet ? Response.json(sheet) : notFound();
  }

  if (request.method === "DELETE") {
    return (await deleteSheet(db, userId, id))
      ? new Response(null, { status: 204 })
      : notFound();
  }

  const body = await readBody(request);
  if ("response" in body) return body.response;
  const problems = checkEnvelope(body.value);
  if (problems.length > 0) return error(400, "Sheet is not valid", problems);
  const sheet = body.value as Sheet;
  if (sheet.id !== id) return error(400, "Id doesn't match the URL");
  const result = await saveSheet(db, userId, sheet);
  switch (result.kind) {
    case "saved":
      return Response.json({ revision: result.revision } satisfies Saved);
    case "stale":
      return error(409, "Sheet changed since this revision");
    case "not-found":
      return notFound();
  }
}

// A string field of a JSON body, or undefined if it isn't there. Null if it
// is there but isn't a string.
function stringField(value: unknown, name: string): string | null | undefined {
  if (typeof value !== "object" || value === null || !(name in value)) {
    return undefined;
  }
  const field: unknown = (value as Record<string, unknown>)[name];
  return typeof field === "string" ? field : null;
}

const versionNotValid = () => error(400, "Version is not valid");
const versionNotFound = () => error(404, "Version not found");

function versionAnswer(result: VersionResult, status = 200): Response {
  switch (result.kind) {
    case "saved":
      return Response.json(result.version, { status });
    case "invalid":
      return versionNotValid();
    case "not-found":
      return versionNotFound();
  }
}

// /api/sheets/:id/versions: GET lists the sheet's versions, and POST saves a
// new one from a name and a key, answering with it. See
// openspec/specs/sheet-versions.
export async function handleVersions(
  request: Request,
  db: D1Database,
  userId: string | null,
  sheetId: string,
): Promise<Response> {
  if (!["GET", "POST"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();

  if (request.method === "GET") {
    const versions = await listVersions(db, userId, sheetId);
    return versions ? Response.json(versions) : notFound();
  }

  const body = await readBody(request);
  if ("response" in body) return body.response;
  const name = stringField(body.value, "name");
  const key = stringField(body.value, "key");
  if (typeof name !== "string" || typeof key !== "string") {
    return versionNotValid();
  }
  return versionAnswer(
    await createVersion(db, userId, sheetId, { name, key }),
    201,
  );
}

// /api/sheets/:id/versions/:versionId: PATCH renames a version or gives it
// another key, and DELETE deletes it.
export async function handleVersion(
  request: Request,
  db: D1Database,
  userId: string | null,
  sheetId: string,
  versionId: string,
): Promise<Response> {
  if (!["PATCH", "DELETE"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();

  if (request.method === "DELETE") {
    return (await deleteVersion(db, userId, sheetId, versionId))
      ? new Response(null, { status: 204 })
      : versionNotFound();
  }

  const body = await readBody(request);
  if ("response" in body) return body.response;
  const name = stringField(body.value, "name");
  const key = stringField(body.value, "key");
  if (name === null || key === null || (name ?? key) === undefined) {
    return versionNotValid();
  }
  return versionAnswer(
    await changeVersion(db, userId, sheetId, versionId, {
      ...(name === undefined ? {} : { name }),
      ...(key === undefined ? {} : { key }),
    }),
  );
}

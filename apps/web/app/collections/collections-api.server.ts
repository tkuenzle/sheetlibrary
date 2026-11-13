import {
  error,
  notAllowed,
  notSignedIn,
  readBody,
  stringField,
} from "../sheets/sheets-api.server";
import {
  addSheets,
  type CollectionResult,
  createCollection,
  deleteCollection,
  removeSheet,
  renameCollection,
  sheetCollections,
} from "./collections.server";

// The collections API, as plain functions from a request to a response, like
// the sheets API. The pages' dialogs and the play view's "Add to
// collection…" use it. See openspec/specs/collections.

const collectionNotFound = () => error(404, "Collection not found");
const sheetNotFound = () => error(404, "Sheet not found");
const noContent = () => new Response(null, { status: 204 });

function collectionAnswer(result: CollectionResult, status = 200): Response {
  switch (result.kind) {
    case "saved":
      return Response.json(result.collection, { status });
    case "invalid":
      return error(400, "Name is not valid");
    case "taken":
      return error(409, "Name is already used");
    case "not-found":
      return collectionNotFound();
  }
}

// The name in a JSON body, or the response that says why there is none.
async function readName(
  request: Request,
): Promise<{ name: string } | { response: Response }> {
  const body = await readBody(request);
  if ("response" in body) return body;
  const name = stringField(body.value, "name");
  if (typeof name !== "string") {
    return { response: error(400, "Name is not valid") };
  }
  return { name };
}

// /api/collections: POST makes a collection from a name, and answers with
// it.
export async function handleCollections(
  request: Request,
  db: D1Database,
  userId: string | null,
): Promise<Response> {
  if (request.method !== "POST") return notAllowed();
  if (!userId) return notSignedIn();
  const body = await readName(request);
  if ("response" in body) return body.response;
  return collectionAnswer(
    await createCollection(db, userId, { name: body.name }),
    201,
  );
}

// /api/collections/:id: PATCH renames the collection, and DELETE deletes it.
// Its sheets stay.
export async function handleCollection(
  request: Request,
  db: D1Database,
  userId: string | null,
  id: string,
): Promise<Response> {
  if (!["PATCH", "DELETE"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();
  if (request.method === "DELETE") {
    return (await deleteCollection(db, userId, id))
      ? noContent()
      : collectionNotFound();
  }
  const body = await readName(request);
  if ("response" in body) return body.response;
  return collectionAnswer(await renameCollection(db, userId, id, body.name));
}

// /api/sheets/:id/collections: GET lists the person's collections, each with
// whether it holds the sheet. POST makes a collection with the sheet in it.
export async function handleSheetCollections(
  request: Request,
  db: D1Database,
  userId: string | null,
  sheetId: string,
): Promise<Response> {
  if (!["GET", "POST"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();
  if (request.method === "GET") {
    const collections = await sheetCollections(db, userId, sheetId);
    return collections ? Response.json(collections) : sheetNotFound();
  }
  const body = await readName(request);
  if ("response" in body) return body.response;
  if ((await sheetCollections(db, userId, sheetId)) === null) {
    return sheetNotFound();
  }
  return collectionAnswer(
    await createCollection(db, userId, { name: body.name, sheetId }),
    201,
  );
}

// /api/sheets/:id/collections/:collectionId: PUT adds the sheet to the
// collection, and DELETE takes it out. Both can be repeated.
export async function handleSheetCollection(
  request: Request,
  db: D1Database,
  userId: string | null,
  sheetId: string,
  collectionId: string,
): Promise<Response> {
  if (!["PUT", "DELETE"].includes(request.method)) return notAllowed();
  if (!userId) return notSignedIn();
  const done =
    request.method === "PUT"
      ? await addSheets(db, userId, collectionId, [sheetId])
      : await removeSheet(db, userId, collectionId, sheetId);
  return done ? noContent() : collectionNotFound();
}

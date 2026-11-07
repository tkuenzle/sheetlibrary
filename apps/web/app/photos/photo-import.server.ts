import { readPhotoAnswer } from "chordsheet";

import type { PhotoModel } from "./photo-model.server";

// POST /api/photo-import reads photos of one song into a chord sheet, as a
// plain function from a request to a response, so the route module stays
// thin. It answers with the sheet's content, title and artist, and creates
// nothing: the browser creates the sheet through /api/sheets. See
// openspec/specs/photo-import.

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

// The photos come as multipart/form-data, one "photo" field per page, in
// page order. The model's text stays on the server.
export async function handlePhotoImport(
  request: Request,
  userId: string | null,
  model: PhotoModel,
): Promise<Response> {
  if (request.method !== "POST") return error(405, "Method not allowed");
  if (!userId) return error(401, "Not signed in");
  // A form on another site can post multipart too, so only the site's own
  // pages may send photos.
  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    return error(403, "Not allowed from this origin");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Body must be form data");
  }
  const photos = form
    .getAll("photo")
    .filter((value): value is File => value instanceof File);
  if (photos.length === 0) return error(400, "No photos");
  const text = await model(photos, request.signal);
  return Response.json(readPhotoAnswer(text));
}

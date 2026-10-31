import { applyMigrations } from "./migrations.server";

// The preview job posts here after each deploy. Only the preview env sets
// PREVIEW_MIGRATIONS, so production answers 404. Anyone may call it on a
// preview: it only applies the migrations already in that preview.
export const previewMigrationsPath = "/api/preview/migrations";

export async function previewMigrations(
  request: Request,
  env: Env,
): Promise<Response> {
  if (env.PREVIEW_MIGRATIONS !== "on") {
    return new Response("Not Found", { status: 404 });
  }
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  const applied = await applyMigrations(env.DB);
  return Response.json({ applied });
}

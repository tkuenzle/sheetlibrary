// Deletes a stored sheet from the browser. A sheet that is already gone
// counts as deleted. Throws when the server can't be reached or refuses.
export async function deleteStoredSheet(
  id: string,
  fetchFn: typeof fetch = (...args) => fetch(...args),
): Promise<void> {
  const response = await fetchFn(`/api/sheets/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete failed with ${String(response.status)}`);
  }
}

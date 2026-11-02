import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Where local wrangler writes the text of each email it would send.
const emails = join(import.meta.dirname, "../.wrangler/tmp/email");

// The sign-in link in the email whose link holds `mark`. The email's text
// doesn't name its recipient, so tests put a mark in the callback URL.
export async function findLink(mark: string): Promise<string | undefined> {
  const files = await readdir(emails, { recursive: true }).catch(() => []);
  for (const file of files.filter((name) => name.endsWith(".txt"))) {
    const text = await readFile(join(emails, file), "utf8");
    if (text.includes(mark)) return /https?:\/\/\S+/.exec(text)?.[0];
  }
  return undefined;
}

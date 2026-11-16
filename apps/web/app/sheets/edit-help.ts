// Whether "Got it" put away the first-time note in edit mode on this device.
// It is kept in a cookie, so the server renders the note or not, and nothing
// moves after load. See openspec/specs/sheet-page ("How to edit, the first
// time").

const NAME = "edit-help";
const SEEN = "seen";

// Browsers keep a cookie for 400 days at most.
const maxAge = 400 * 24 * 60 * 60;

// From a request's Cookie header.
export function readEditHelpSeen(cookieHeader: string | null): boolean {
  return (cookieHeader ?? "")
    .split(";")
    .some((cookie) => cookie.trim() === `${NAME}=${SEEN}`);
}

// `Secure` only over https, since some browsers refuse it on
// http://localhost.
export function keepEditHelpSeen(
  target: { cookie: string; location: { protocol: string } } = document,
): void {
  const secure = target.location.protocol === "https:" ? "; Secure" : "";
  target.cookie = `${NAME}=${SEEN}; Path=/; Max-Age=${String(maxAge)}; SameSite=Lax${secure}`;
}

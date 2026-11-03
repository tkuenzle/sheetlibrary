// The library's passkey offer after an email sign-in. Closing it is kept in
// a cookie on this device, so the server knows before it renders the
// library. See openspec/specs/accounts.

const closed = "passkey-offer=closed";

// Browsers keep a cookie for 400 days at most.
const maxAge = 400 * 24 * 60 * 60;

// Whether this device closed the offer, from a request's Cookie header.
export function offerClosed(cookieHeader: string | null): boolean {
  return (cookieHeader ?? "")
    .split(";")
    .some((cookie) => cookie.trim() === closed);
}

// Keeps the offer from showing again on this device. `Secure` only over
// https, since some browsers refuse it on http://localhost.
export function closeOffer(
  target: { cookie: string; location: { protocol: string } } = document,
): void {
  const secure = target.location.protocol === "https:" ? "; Secure" : "";
  target.cookie = `${closed}; Path=/; Max-Age=${String(maxAge)}; SameSite=Lax${secure}`;
}

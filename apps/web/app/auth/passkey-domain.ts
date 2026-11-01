// A passkey belongs to a domain. Production uses its own host. Every preview
// is a subdomain of the account's workers.dev subdomain, which is a domain of
// its own because workers.dev is a public suffix. So one passkey works on every
// preview and never on production. See openspec/specs/accounts.
export function passkeyDomain(hostname: string): string {
  if (hostname.endsWith(".workers.dev")) {
    return hostname.split(".").slice(-3).join(".");
  }
  return hostname;
}

import { passkey } from "@better-auth/passkey";
import {
  betterAuth,
  type BetterAuthOptions,
  type Session,
  type User,
} from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";

import { authPath } from "./auth-path";
import { passkeyDomain } from "./passkey-domain";
import { sendSignInEmail } from "./sign-in-email.server";

// Only what the app uses. Better Auth's inferred type is too large to name.
export interface Auth {
  handler(request: Request): Promise<Response>;
  api: {
    getSession(context: {
      headers: Headers;
    }): Promise<{ session: Session; user: User } | null>;
    listPasskeys(context: {
      headers: Headers;
    }): Promise<{ id: string; name?: string | null; createdAt: Date }[]>;
  };
}

function options(env: Env, origin: string) {
  return {
    appName: "Sheet Library",
    baseURL: origin,
    basePath: authPath,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    // Each Worker isolate has its own memory, so the counts live in D1.
    rateLimit: { enabled: true, storage: "database" },
    // Cloudflare sets this header; others can be forged by the visitor.
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    plugins: [
      magicLink({
        expiresIn: 15 * 60,
        // Per visitor. The limit per address is in sendSignInEmail.
        rateLimit: { window: 60 * 60, max: 10 },
        sendMagicLink: ({ email, url }) => sendSignInEmail(env, email, url),
      }),
      passkey({
        rpID: passkeyDomain(new URL(origin).hostname),
        rpName: "Sheet Library",
        origin,
      }),
    ],
  } satisfies BetterAuthOptions;
}

// Also read by scripts/auth-migration.ts, which writes the schema it needs.
export function authOptions(env: Env, origin: string): BetterAuthOptions {
  return options(env, origin);
}

function createAuth(env: Env, origin: string): Auth {
  return betterAuth(options(env, origin));
}

// Bindings only exist per request, but they stay the same within an isolate,
// so one instance per bindings and origin is kept. The origin differs per
// preview.
const instances = new WeakMap<Env, Map<string, Auth>>();

export function getAuth(env: Env, request: Request): Auth {
  const origin = new URL(request.url).origin;
  let byOrigin = instances.get(env);
  if (!byOrigin) {
    byOrigin = new Map();
    instances.set(env, byOrigin);
  }
  let auth = byOrigin.get(origin);
  if (!auth) {
    auth = createAuth(env, origin);
    byOrigin.set(origin, auth);
  }
  return auth;
}

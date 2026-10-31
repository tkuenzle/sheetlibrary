import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

import { authPath } from "./auth-path";
import { notInvited, tooManyEmails } from "./error-codes";

// Better Auth in the browser. Only the calls the pages use are exported,
// since the client's own type is too large to name.
const client = createAuthClient({
  basePath: authPath,
  plugins: [magicLinkClient(), passkeyClient()],
});

export type LinkResult = "sent" | "not-invited" | "too-many" | "failed";

// Asks for a sign-in link by email. Opening it signs in on the account page,
// which offers a passkey. A link that doesn't work comes back to sign-in.
export async function askForLink(email: string): Promise<LinkResult> {
  const { error } = await client.signIn.magicLink({
    email,
    callbackURL: "/account?welcome",
    errorCallbackURL: "/sign-in?link=invalid",
  });
  if (!error) return "sent";
  if ("code" in error && error.code === notInvited) return "not-invited";
  if (error.status === 429 || ("code" in error && error.code === tooManyEmails))
    return "too-many";
  return "failed";
}

// Signs in with a passkey saved on this device. False if none was used.
export async function signInWithPasskey(): Promise<boolean> {
  const result = await client.signIn.passkey();
  return !result.error;
}

// Saves a new passkey for the signed-in account on this device.
export async function addPasskey(): Promise<boolean> {
  const result = await client.passkey.addPasskey();
  return !result.error;
}

export async function renamePasskey(
  id: string,
  name: string,
): Promise<boolean> {
  const result = await client.passkey.updatePasskey({ id, name });
  return !result.error;
}

export async function removePasskey(id: string): Promise<boolean> {
  const result = await client.passkey.deletePasskey({ id });
  return !result.error;
}

export async function signOut(): Promise<void> {
  await client.signOut();
}

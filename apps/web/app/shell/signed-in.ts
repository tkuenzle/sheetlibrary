import { createContext } from "react";

// What the top bar shows of the signed-in person: only the initial, since
// the root loader's data is on every page and the email is only needed on
// the account page.
export interface SignedIn {
  initial: string;
}

// The first letter of the email, in upper case.
export function initialOf(email: string): string {
  return email.charAt(0).toUpperCase();
}

// Who is signed in, from the root loader, or null for a visitor. Undefined
// outside the app's routes, such as in tests, where the top bar shows no
// account link.
export const SignedInContext = createContext<SignedIn | null | undefined>(
  undefined,
);

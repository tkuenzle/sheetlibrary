import { createContext } from "react";

// Whether the visitor is signed in, from the root loader. Undefined outside
// the app's routes, such as in tests, where the top bar shows no account link.
export const SignedInContext = createContext<boolean | undefined>(undefined);

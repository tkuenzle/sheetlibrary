import type { Session, User } from "better-auth";
import { createContext } from "react-router";

// The worker's bindings, set by workers/app.ts for every request.
export const cloudflareContext = createContext<{ env: Env }>();

// Who is signed in, read once per request by the root middleware.
export const sessionContext = createContext<{
  session: Session;
  user: User;
} | null>(null);

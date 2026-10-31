// Better Auth answers everything under this path. React Router gets the rest.
export const authPath = "/api/auth";

export function isAuthPath(pathname: string): boolean {
  return pathname === authPath || pathname.startsWith(`${authPath}/`);
}

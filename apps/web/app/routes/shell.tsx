import "./shell.css";

import { type ReactNode, use } from "react";
import {
  Link,
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useLocation,
  useRouteLoaderData,
} from "react-router";

import {
  type CollectionListItem,
  sheetCount,
} from "../collections/collections";
import { listCollections } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { revalidateAfterChanges } from "../shell/revalidate";
import { RouteError } from "../shell/route-error";
import { SignedInContext } from "../shell/signed-in";
import { NavBar } from "../ui/nav-bar";
import { type NavItem, NavRail } from "../ui/nav-rail";
import type { Route } from "./+types/shell";

// The shell around the library's screens and the account page: the
// navigation and the screen's content. The navigation stays on screen while
// the content changes. See openspec/specs/site-layout.

// The id React Router gives this route, for the screens that read its data.
export const shellRouteId = "routes/shell";

// The collections, for the rail and for the Collections screen.
export async function loader({ context }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  return { collections: await listCollections(env.DB, session.user.id) };
}

// The collections only load again after a change, not on every move. See
// shell/revalidate.ts.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return revalidateAfterChanges(args);
}

// The collections the shell loaded, for a screen inside it.
export function useShellCollections(): CollectionListItem[] {
  return useRouteLoaderData<typeof loader>(shellRouteId)?.collections ?? [];
}

// Where the navigation leads, with the open screen marked. A collection is
// marked by its own entry. One that isn't listed, such as one that doesn't
// exist, marks "Collections".
export function navItems(
  pathname: string,
  collections: CollectionListItem[],
): NavItem[] {
  const children = collections.map((collection) => ({
    href: `/collections/${collection.id}`,
    label: collection.name,
    count: {
      text: String(collection.count),
      label: sheetCount(collection.count),
    },
    current: pathname === `/collections/${collection.id}`,
  }));
  return [
    {
      href: "/sheets",
      label: "Sheets",
      icon: "libraryMusic",
      current: pathname === "/sheets",
    },
    {
      href: "/collections",
      label: "Collections",
      icon: "stacks",
      current:
        pathname === "/collections" ||
        (pathname.startsWith("/collections/") &&
          !children.some((child) => child.current)),
      children,
    },
  ];
}

export default function Shell({ loaderData }: Route.ComponentProps) {
  const { pathname } = useLocation();
  const signedIn = use(SignedInContext);
  return (
    <ShellView
      pathname={pathname}
      collections={loaderData.collections}
      initial={signedIn?.initial ?? ""}
    >
      <Outlet />
    </ShellView>
  );
}

// The shell's own loader failed, as when it is entered from a sheet without
// a connection. The navigation still shows, without the collections it
// couldn't load, and the note takes the content's place.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { pathname } = useLocation();
  const signedIn = use(SignedInContext);
  return (
    <ShellView
      pathname={pathname}
      collections={[]}
      initial={signedIn?.initial ?? ""}
    >
      <RouteError error={error} />
    </ShellView>
  );
}

// Three navigations are rendered, and CSS shows the one for the window's
// width: the rail, its compact form, or the bottom bar. So the server
// renders the right layout, and nothing jumps when the scripts load. The
// account is at the bottom of the rail. On a phone it is its initial at the
// top right, on the heading's line, and the bar holds only the screens.
export function ShellView({
  pathname,
  collections,
  initial,
  children,
}: {
  pathname: string;
  collections: CollectionListItem[];
  // The first letter of the person's email.
  initial: string;
  children: ReactNode;
}) {
  const items = navItems(pathname, collections);
  const account: NavItem = {
    href: "/account",
    label: "Account",
    initial,
    current: pathname === "/account",
  };
  return (
    <div className="shell">
      {/* Works as a plain link before the scripts load. With them, it moves
          the focus without changing the address. */}
      <a
        className="shell-skip"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("content")?.focus();
        }}
      >
        Skip to content
      </a>
      <NavRail
        name={{ href: "/sheets", label: "Sheet Library" }}
        items={items}
        footer={[account]}
      />
      <NavRail compact items={items} footer={[account]} />
      <Link
        className="shell-account"
        to={account.href}
        aria-label={account.label}
        aria-current={account.current ? "page" : undefined}
      >
        <span className="nav-avatar" aria-hidden="true">
          {initial}
        </span>
      </Link>
      <main id="content" className="shell-content" tabIndex={-1}>
        {children}
      </main>
      <NavBar items={items} />
    </div>
  );
}

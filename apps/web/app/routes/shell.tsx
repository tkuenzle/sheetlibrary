import "./shell.css";

import { type ReactNode, use, useEffect, useRef, useState } from "react";
import {
  Link,
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useLocation,
  useNavigation,
  useRouteLoaderData,
} from "react-router";

import {
  type CollectionListItem,
  sheetCount,
} from "../collections/collections";
import { phone, wide } from "../breakpoints";
import { listCollections } from "../collections/collections.server";
import { cloudflareContext, sessionContext } from "../context";
import { EdgePanel } from "../shell/edge-panel";
import { focusHeading } from "../shell/focus";
import { KeptPages, loadsKeptAgain } from "../shell/kept";
import { historyStepContext } from "../shell/page-moves";
import { revalidateAfterChanges } from "../shell/revalidate";
import {
  newSheetItems,
  NewSheetProvider,
  type NewSheetWay,
  useNewSheet,
} from "../sheets/new-sheet";
import { RouteError } from "../shell/route-error";
import { SignedInContext } from "../shell/signed-in";
import { IconButton } from "../ui/button";
import { FloatingMenu } from "../ui/floating-button";
import { Menu } from "../ui/menu";
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

// What the shell showed last, for a step back to one of its screens.
export const keptShell = new KeptPages<
  Awaited<ReturnType<Route.ClientLoaderArgs["serverLoader"]>>
>();
export const SHELL = "shell";

// On a step back or forward, the navigation shows its collections as it
// left them, at once, and they load again behind it (shell/kept.ts). So Back
// from a sheet, which sits outside the shell, doesn't wait for them. A first
// load doesn't run this. See openspec/specs/site-layout ("The frame on a
// step back").
export async function clientLoader({
  context,
  serverLoader,
}: Route.ClientLoaderArgs) {
  if (context.get(historyStepContext)) {
    const back = keptShell.step(SHELL, serverLoader);
    if (back) return back.kept;
  }
  return await keptShell.again(SHELL, serverLoader);
}

// Keeps the collections the shell shows, for a step back.
function useKeepShell(data: Route.ComponentProps["loaderData"]) {
  useEffect(() => {
    keptShell.keep(SHELL, data);
  }, [data]);
}

// The collections only load again after a change, not on every move. See
// shell/revalidate.ts. In the load after a step back, only when they showed
// as they were left (shell/kept.ts).
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return loadsKeptAgain(keptShell, SHELL) ?? revalidateAfterChanges(args);
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
  useKeepShell(loaderData);
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
// The compact rail's menu button opens the full rail over the page. It
// closes when the window leaves the middle width. "New sheet" is under the
// site's name in the full rail, under the menu button in the compact one,
// and floating above the bar on a phone, on every screen. The shell holds the ways it starts (sheets/new-sheet.tsx), so it
// works on every screen.
const outsideMiddle = `${phone}, ${wide}`;

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
  return (
    <NewSheetProvider>
      <ShellLayout
        pathname={pathname}
        collections={collections}
        initial={initial}
      >
        {children}
      </ShellLayout>
    </NewSheetProvider>
  );
}

function ShellLayout({
  pathname,
  collections,
  initial,
  children,
}: {
  pathname: string;
  collections: CollectionListItem[];
  initial: string;
  children: ReactNode;
}) {
  const startNewSheet = useNewSheet();
  const [railOpen, setRailOpen] = useState(false);
  // A way to add a sheet picked in the opened rail, until the rail has
  // closed. It starts then, over the page.
  const pickedWay = useRef<NewSheetWay | null>(null);
  // Where a link in the opened rail was picked, until the rail has closed.
  const pickedOn = useRef<string | null>(null);
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
        top={<NewSheetMenu onPick={startNewSheet} />}
        items={items}
        footer={[account]}
      />
      <NavRail
        compact
        top={
          <>
            <IconButton
              icon="menu"
              label="Open navigation"
              aria-haspopup="dialog"
              tooltipPlacement="right"
              onClick={() => {
                setRailOpen(true);
              }}
            />
            <NewSheetMenu compact onPick={startNewSheet} />
          </>
        }
        items={items}
        footer={[account]}
      />
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
      <FloatingMenu
        label="New sheet"
        icon="add"
        items={newSheetItems(startNewSheet)}
      />
      <EdgePanel
        side="left"
        className="shell-rail-panel"
        open={railOpen}
        onClosed={() => {
          setRailOpen(false);
          // The new page came while the rail was open. The page was inert
          // then, so its heading couldn't take the focus (see
          // shell/focus.ts), and closing put it back on the menu button.
          if (pickedOn.current !== null && pickedOn.current !== pathname)
            focusHeading();
          pickedOn.current = null;
          const way = pickedWay.current;
          pickedWay.current = null;
          if (way) startNewSheet(way);
        }}
        closeWhen={outsideMiddle}
        aria-label="Main"
      >
        {({ slideOut }) => (
          <OpenedRail
            pathname={pathname}
            items={items}
            account={account}
            slideOut={slideOut}
            onPick={() => {
              pickedOn.current = pathname;
            }}
            onPickWay={(way) => {
              pickedWay.current = way;
              slideOut();
            }}
          />
        )}
      </EdgePanel>
    </div>
  );
}

// "New sheet" and its menu of the ways to add a sheet: a filled button with
// its name in the full rail, opening below it, and a square + button in the
// compact rail, opening beside it.
function NewSheetMenu({
  compact = false,
  onPick,
}: {
  compact?: boolean;
  onPick: (way: NewSheetWay) => void;
}) {
  const items = newSheetItems(onPick);
  return (
    <div className="shell-new-sheet">
      {compact ? (
        <Menu
          label="New sheet"
          icon="add"
          square
          placement="beside"
          items={items}
        />
      ) : (
        <Menu
          label="New sheet"
          icon="add"
          text
          variant="filled"
          chevron={false}
          placement="below-start"
          items={items}
        />
      )}
    </div>
  );
}

// The full rail in the opened panel. A picked link keeps the panel open
// until the new page is there, then slides it out over that page, so the
// old page doesn't show again in between. A way picked from "New sheet"
// slides it out first, and starts once it has closed.
function OpenedRail({
  pathname,
  items,
  account,
  slideOut,
  onPick,
  onPickWay,
}: {
  pathname: string;
  items: NavItem[];
  account: NavItem;
  slideOut: () => void;
  onPick: () => void;
  onPickWay: (way: NewSheetWay) => void;
}) {
  const navigation = useNavigation();
  const [pickedOn, setPickedOn] = useState<string | null>(null);
  // Whether the move has started. Picking the open page loads it again
  // without changing the address.
  const moved = useRef(false);

  useEffect(() => {
    if (pickedOn === null) return;
    if (navigation.state !== "idle") {
      moved.current = true;
      return;
    }
    if (moved.current || pathname !== pickedOn) slideOut();
  }, [pickedOn, navigation.state, pathname, slideOut]);

  return (
    <div
      className="shell-rail-panel-content"
      onClick={(event) => {
        // Only a move React Router makes itself: a click that opens a new
        // tab leaves the rail open.
        if (
          !event.defaultPrevented ||
          !(event.target instanceof Element && event.target.closest("a"))
        )
          return;
        onPick();
        setPickedOn(pathname);
      }}
    >
      <NavRail
        name={{ href: "/sheets", label: "Sheet Library" }}
        besideName={
          <IconButton
            icon="close"
            label="Close"
            tooltipPlacement="bottom"
            onClick={slideOut}
          />
        }
        top={<NewSheetMenu onPick={onPickWay} />}
        items={items}
        footer={[account]}
      />
    </div>
  );
}

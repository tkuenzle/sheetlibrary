import "../ui/group-list.css";
import "./sheets.css";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  Await,
  Form,
  Link,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useSearchParams,
} from "react-router";

import { closeOffer, offerClosed } from "../auth/passkey-offer";
import { hasPasskey } from "../auth/passkeys.server";
import { cloudflareContext, sessionContext } from "../context";
import {
  keptSheetOrder,
  readSheetOrder,
  type SheetOrder,
} from "../sheets/order";
import { RecentSheets, RecentSheetsSkeleton } from "../sheets/recent-sheets";
import { SheetList, SheetListSkeleton } from "../sheets/sheet-list";
import {
  fromAnotherPage,
  handOver,
  handOverBack,
  PageData,
  SkeletonShown,
  type WithLatePart,
} from "../shell/awaited";
import { addressOf, KeptPages, loadsKeptAgain, useKeep } from "../shell/kept";
import { historyStepContext } from "../shell/page-moves";
import { useFocusCarriesOver } from "../shell/focus";
import { UNTITLED } from "../sheets/details";
import { type NewSheetWay, useNewSheet } from "../sheets/new-sheet";
import { isSearch, LIST_ONLY } from "../sheets/search";
import { SearchField, useSearchPending } from "../sheets/search-field";
import { revalidateUnlessUnchanged } from "../shell/revalidate";
import { RouteError } from "../shell/route-error";
import {
  createSheet,
  hasSheets,
  listSheets,
  recentSheets,
  searchSheets,
  type SearchResult,
  type SheetListItem,
} from "../sheets/sheets.server";
import { Arriving } from "../ui/arriving";
import { IconButton } from "../ui/button";
import { Icon } from "../ui/icon";
import type { IconName } from "../ui/icons";
import { errorKind, isOnline } from "../ui/page-error";
import type { Route } from "./+types/sheets";

// The Sheets screen of the library: the signed-in person's sheets in the
// shared list and the search field. "New sheet" belongs to the shell
// (routes/shell.tsx), which it sits in. See openspec/specs/library-page and
// openspec/specs/sheet-list.

export function meta() {
  return [
    { title: "Sheets | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

// The email link lands on `?passkey`. Only then is a passkey offered, if
// the account has none and this device didn't close the offer. With `q`
// long enough to search, the sheets are the results, the best match first.
// Otherwise the page sorts them in the order this device keeps, and shows
// the sheets opened last under "Recent".
export async function loader({ context, request, url }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const userId = session.user.id;
  const offerPasskey =
    url.searchParams.has("passkey") &&
    !offerClosed(request.headers.get("Cookie")) &&
    !(await hasPasskey(env.DB, userId));
  const q = url.searchParams.get("q") ?? "";
  const order = readSheetOrder(request.headers.get("Cookie"));
  if (!isSearch(q)) {
    const [sheets, recent] = await Promise.all([
      listSheets(env.DB, userId),
      recentSheets(env.DB, userId),
    ]);
    return {
      sheets,
      recent,
      hasSheets: sheets.length > 0,
      q,
      offerPasskey,
      order,
    };
  }
  const sheets = await searchSheets(env.DB, userId, q);
  return {
    sheets,
    recent: [],
    hasSheets: sheets.length > 0 || (await hasSheets(env.DB, userId)),
    q,
    offerPasskey,
    order,
  };
}

// "Write a new sheet", from any screen in the shell. A form on another site
// can't get here signed in, since the session cookie is SameSite=Lax, so it
// is sent to sign-in like a visitor. A row's delete goes to the sheet's API
// route (sheets/sheet-list.tsx).
export async function action({ context }: Route.ActionArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const sheet = await createSheet(env.DB, session.user.id, {
    title: UNTITLED,
    content: { format: "chordsheet", version: 1, sections: [] },
  });
  return redirect(`/sheets/${sheet.id}/edit?new`);
}

// In the browser, a search that can't reach the server doesn't fail the
// page: the screen keeps the results it shows, and says so. Any other error
// goes to the boundary below. On a step back or forward to a search, the
// results show as they were left, and load again behind them
// (shell/kept.ts). Opening a sheet changes Recent, so a step back to the
// list waits a moment for the fresh page, and otherwise shows the list as it
// was left with Recent on its way (handOverBack). On another move from
// another page, the page waits a
// moment for its sheets: if they come in time it moves in whole, otherwise
// with bars, and they follow. A search, or loading again after a change on
// a row, waits as before. Not on the first load, which the server renders.
// A dialog's list (LIST_ONLY) waits too. See openspec/specs/library-search
// and openspec/specs/site-layout.
export async function clientLoader({
  context,
  serverLoader,
  url,
}: Route.ClientLoaderArgs) {
  const load = async () => {
    try {
      return await serverLoader();
    } catch (error) {
      if (errorKind(error, isOnline()) !== "unreachable") throw error;
      return { failed: true as const, error };
    }
  };
  if (url.searchParams.has(LIST_ONLY)) return await load();
  if (context.get(historyStepContext)) {
    const back = kept.step(addressOf(url), serverLoader);
    if (back && isSearch(url.searchParams.get("q") ?? "")) {
      return { page: back.kept };
    }
    if (back) return await handOverBack(back, "recent", context);
  }
  if (!fromAnotherPage(url)) return await kept.again(addressOf(url), load);
  return await handOver(load(), context);
}

// What Sheets and each search showed last, for a step back to them.
const kept = new KeptPages<
  Awaited<ReturnType<Route.ClientLoaderArgs["serverLoader"]>>
>();

// A row's change that didn't get through loads nothing again. In the load
// after a step back, it loads again only when it showed as it was left.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return (
    loadsKeptAgain(kept, addressOf(args.nextUrl)) ??
    revalidateUnlessUnchanged(args)
  );
}

// A page that can't be loaded shows a note in the shell, which stays. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteError error={error} />;
}

export default function Library({ loaderData }: Route.ComponentProps) {
  // `?passkey` offers a passkey once. Without it in the URL, a reload
  // doesn't.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("passkey")) return;
    url.searchParams.delete("passkey");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  const page = "page" in loaderData ? loaderData.page : loaderData;
  return (
    <PageData data={page} skeleton={<LibrarySkeleton />}>
      {(loaded) => <LoadedLibrary loaded={loaded} />}
    </PageData>
  );
}

function LoadedLibrary({ loaded }: { loaded: LibraryAnswer }) {
  const shown = useLastLoaded(loaded);
  useKeep(kept, whole(loaded));
  return (
    <LibraryView
      sheets={shown.sheets}
      recent={shown.recent}
      hasSheets={shown.hasSheets}
      q={shown.q}
      offerPasskey={shown.offerPasskey}
      order={shown.order}
      searchFailed={"failed" in loaded}
    />
  );
}

// "Recent", whole or on its way. On its way, it shows its bars until it is
// there, held as a page's (see "Bars never blink" in
// openspec/specs/site-layout), and its cards then fade in (ui/arriving.tsx).
// As in PageData, the choice is kept while the page stays: the load that
// follows a step back answers with Recent whole, and the cards that faded
// in stay.
function RecentOnItsWay({
  recent,
}: {
  recent: SheetListItem[] | Promise<SheetListItem[]>;
}) {
  const [streamed] = useState(() => recent instanceof Promise);
  if (!streamed && !(recent instanceof Promise)) {
    return <RecentSheets sheets={recent} />;
  }
  return (
    <Suspense
      fallback={
        <>
          <RecentSheetsSkeleton />
          <SkeletonShown />
        </>
      }
    >
      <Await resolve={recent}>
        {(sheets) => (
          <Arriving>
            <RecentSheets sheets={sheets} />
          </Arriving>
        )}
      </Await>
    </Suspense>
  );
}

// What the server answers.
type SheetsData = Awaited<ReturnType<Route.ClientLoaderArgs["serverLoader"]>>;

// What the loader answers, once it is there: the sheets, the list as it was
// left with Recent on its way (after a step back), or that a search
// couldn't reach the server.
type LibraryAnswer =
  | SheetsData
  | WithLatePart<SheetsData, "recent">
  | { failed: true; error: unknown };

type LibraryData = Exclude<LibraryAnswer, { failed: true }>;

// The answer whole, to keep for a step back, or null.
function whole(answer: LibraryAnswer): SheetsData | null {
  if ("failed" in answer || answer.recent instanceof Promise) return null;
  return answer as SheetsData;
}

// Sheets while its sheets are on their way, as on the canvas boards
// "Sheets, loading": the heading, a search field that works, and bars for
// Recent and the list. A search in the address has no Recent.
export function LibrarySkeleton() {
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusCarriesOver(heading);
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  return (
    <div className="library library-with-sheets">
      <h1 ref={heading} tabIndex={-1}>
        Sheets
      </h1>
      <SearchField q={q} count={null} handsOver />
      {!isSearch(q) && <RecentSheetsSkeleton />}
      <SheetListSkeleton
        rows={SKELETON_ROWS}
        order={keptSheetOrder()}
        heading="All sheets"
      />
    </div>
  );
}

// The rows of bars while the sheets load: about a screenful.
const SKELETON_ROWS = 8;

// The last data that loaded, kept while a search can't reach the server.
// With nothing loaded yet, as when Sheets opens offline, the screen fails
// and its boundary shows.
export function useLastLoaded(loaderData: LibraryAnswer): LibraryData {
  const [last, setLast] = useState<LibraryData | null>(
    "failed" in loaderData ? null : loaderData,
  );
  if (!("failed" in loaderData) && loaderData !== last) {
    setLast(loaderData);
    return loaderData;
  }
  if (!last) {
    throw ("error" in loaderData ? loaderData.error : undefined) as Error;
  }
  return last;
}

// After an email sign-in. The passkey is added on the account page, so the
// library never asks the device itself.
function PasskeyOffer({ onClose }: { onClose: () => void }) {
  return (
    <section className="passkey-offer" aria-label="Passkey">
      <Icon name="passkey" />
      <p>
        Add a passkey to sign in on this device without waiting for an email.
      </p>
      <Link className="button button-filled passkey-offer-add" to="/account">
        <Icon name="passkey" />
        Add passkey
      </Link>
      <IconButton
        icon="close"
        label="Close"
        tooltipPlacement="left"
        onClick={onClose}
      />
    </section>
  );
}

// The empty library's cards: the ways of "New sheet", each with a line
// that says what it does. See openspec/specs/library-page.
const ways: {
  way: NewSheetWay;
  label: string;
  icon: IconName;
  text: string;
}[] = [
  {
    way: "write",
    label: "Write it",
    icon: "edit",
    text: "Start with an empty sheet and type the lyrics and chords.",
  },
  {
    way: "photos",
    label: "From photos",
    icon: "photoCamera",
    text: "Take or pick a photo of each page. The lyrics and chords are read into a sheet.",
  },
  {
    way: "ultimate-guitar",
    label: "From Ultimate Guitar",
    icon: "link",
    text: "Paste the chords and lyrics from an Ultimate Guitar page.",
  },
];

// "Write it" posts to the action above, so it works before the scripts
// load. The imports open their dialog in the shell.
function FirstSheet() {
  const start = useNewSheet();
  return (
    <section className="library-first" aria-labelledby="library-first">
      <div className="library-first-heading">
        <h2 id="library-first">Add your first sheet</h2>
        <p>Pick a way to start. Everything can be edited later.</p>
      </div>
      <ul className="library-ways">
        {ways.map(({ way, label, icon, text }) => {
          const content = (
            <>
              <span className="library-way-icon" aria-hidden="true">
                <Icon name={icon} size={28} />
              </span>
              <span className="library-way-label">{label}</span>
              <span className="library-way-text">{text}</span>
            </>
          );
          return (
            <li key={way}>
              {way === "write" ? (
                <Form method="post" action="/sheets">
                  <button type="submit" className="library-way">
                    {content}
                  </button>
                </Form>
              ) : (
                <button
                  type="button"
                  className="library-way"
                  onClick={() => {
                    start(way);
                  }}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function LibraryView({
  sheets,
  recent = [],
  hasSheets = sheets.length > 0,
  q = "",
  offerPasskey = false,
  order = "title",
  searchFailed = false,
}: {
  // All sheets, or the results of the search in `q`.
  sheets: (SheetListItem | SearchResult)[];
  // The sheets opened last, for "Recent". None while searching. On its way
  // after a step back that showed the list as it was left, since opening a
  // sheet changes them.
  recent?: SheetListItem[] | Promise<SheetListItem[]>;
  hasSheets?: boolean;
  q?: string;
  offerPasskey?: boolean;
  // The order this device keeps.
  order?: SheetOrder;
  // Whether the latest search couldn't reach the server, so the sheets are
  // the last results.
  searchFailed?: boolean;
}) {
  const [offering, setOffering] = useState(offerPasskey);
  const heading = useRef<HTMLHeadingElement>(null);
  const offer = offering && (
    <PasskeyOffer
      onClose={() => {
        closeOffer();
        setOffering(false);
      }}
    />
  );

  const searching = isSearch(q);
  const pending = useSearchPending();

  if (!hasSheets) {
    return (
      <div className="library">
        {/* Focusable as with sheets, so a heading that has the focus when
            the last sheet is deleted keeps it. */}
        <h1 ref={heading} tabIndex={-1}>
          Sheets
        </h1>
        {offer}
        <FirstSheet />
      </div>
    );
  }

  return (
    <div className="library library-with-sheets">
      <h1 ref={heading} tabIndex={-1}>
        Sheets
      </h1>
      {offer}
      <SearchField
        q={q}
        count={searching ? sheets.length : null}
        pending={pending}
      />
      {searchFailed && (
        <p className="library-search-failed" role="status">
          <Icon name="cloudOff" size={20} />
          Couldn’t search. Showing the last results.
        </p>
      )}
      {!searching && <RecentOnItsWay recent={recent} />}
      {searching && sheets.length === 0 ? (
        <section
          className="library-empty"
          aria-labelledby="library-no-results"
          aria-busy={pending || undefined}
        >
          <h2 id="library-no-results">{`No sheets match “${q.trim()}”`}</h2>
        </section>
      ) : (
        <SheetList
          sheets={sheets}
          order={order}
          sorted={!searching}
          busy={pending}
          heading="All sheets"
          onGone={() => heading.current?.focus()}
        />
      )}
    </div>
  );
}

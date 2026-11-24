import { useEffect } from "react";
import { useLocation, useNavigation, useRevalidator } from "react-router";

// What a page showed when it was left, so that a step back in the history
// can show it again at once, and load again behind it. See
// openspec/specs/site-layout ("Back shows the page as it was left") and
// this change's design.
//
//   page shows its data --keep()--> [ address -> data ]
//                                         |
//   step back to the address --step()-----+--> kept data at once,
//                                              fresh request held
//   the background load ------again()--------> the held request,
//                                              kept data if it fails
//
// Each route has a store of its own, since the shell and a page share an
// address. A change to the person's data forgets every store (forgetKept).

// How many addresses a store keeps, the oldest dropped first.
export const KEPT_LIMIT = 10;

const stores = new Set<KeptPages<unknown>>();

// Whether a page showed kept data, so that what's on screen loads again in
// the background once the step has ended (<LoadKeptAgain />).
let due = false;

export class KeptPages<T> {
  private pages = new Map<string, T>();
  // The fresh request a step back started, for the background load.
  private held = new Map<string, Promise<T>>();

  constructor(private limit = KEPT_LIMIT) {
    stores.add(this);
  }

  // Keeps what the page at `address` shows, as the newest.
  keep(address: string, data: T) {
    this.pages.delete(address);
    this.pages.set(address, data);
    for (const oldest of this.pages.keys()) {
      if (this.pages.size <= this.limit) break;
      this.pages.delete(oldest);
    }
  }

  get(address: string): T | undefined {
    return this.pages.get(address);
  }

  // For a step in the history to `address`: the kept data, if there is
  // some, and the fresh request, started now and held for the background
  // load. Null without kept data.
  step(
    address: string,
    request: () => Promise<T>,
  ): { kept: T; fresh: Promise<T> } | null {
    const kept = this.pages.get(address);
    if (kept === undefined) return null;
    const fresh = request();
    // Its failure is handled where it is read.
    fresh.catch(() => undefined);
    this.held.set(address, fresh);
    due = true;
    return { kept, fresh };
  }

  // A load of `address` that isn't a step in the history. The first one
  // after a step that showed kept data is the background load: it takes the
  // request the step started, and gives back the kept data if that fails,
  // so the page keeps what it shows. Any other load calls `request`.
  async again<U>(address: string, request: () => Promise<U>): Promise<T | U> {
    const held = this.held.get(address);
    if (!held) return request();
    this.held.delete(address);
    try {
      return await held;
    } catch (error) {
      const kept = this.pages.get(address);
      if (kept === undefined) throw error;
      return kept;
    }
  }

  // Whether a step back showed the kept data of `address`, so that the
  // background load has a request held for it.
  isHeld(address: string): boolean {
    return this.held.has(address);
  }

  dropHeld() {
    this.held.clear();
  }

  forget() {
    this.pages.clear();
    this.held.clear();
  }
}

// Forgets every page kept, after a change to the person's data.
export function forgetKept() {
  for (const store of stores) store.forget();
  due = false;
  // What a change loads again isn't the background load any more.
  loadingAgain = false;
}

// Drops the requests held for a background load, and the load itself, as
// another page change starts: they belong to the step that started them.
export function dropHeld() {
  for (const store of stores) store.dropHeld();
  due = false;
}

// Whether a background load is due, and clears it.
export function takeLoadDue(): boolean {
  const was = due;
  due = false;
  return was;
}

// The address a page is kept by.
export function addressOf(url: { pathname: string; search: string }): string {
  return url.pathname + url.search;
}

// The root's client middleware for kept pages: a change, sent as a form or
// a fetcher, forgets them all before it reaches the server, and a page
// change drops the requests held for the last background load. A
// revalidation is neither, so the background load still finds its request.
export function keptMiddleware<T>(
  args: { request: Request; unstable_initiator?: string },
  next: () => Promise<T>,
): Promise<T> {
  if (args.request.method !== "GET") forgetKept();
  else if (args.unstable_initiator === "navigation") dropHeld();
  return next();
}

// Whether the background load after a step back runs. Only what showed kept
// data loads again (loadsKeptAgain): anything else has nothing kept to fall
// back on, so offline its failure would take down the page, or the whole
// app for the root. The root, whose data a step back never changes, always
// sits it out.
let loadingAgain = false;
export function isLoadingKeptAgain(): boolean {
  return loadingAgain;
}

// For a route's shouldRevalidate: during the background load, whether the
// route showed kept data at `address` and so loads again. Null at any other
// time, for the route's own rule.
export function loadsKeptAgain<T>(
  kept: KeptPages<T>,
  address: string,
): boolean | null {
  return loadingAgain ? kept.isHeld(address) : null;
}

// Keeps what a page shows, under its address, once it shows it. Null, as
// for data still on its way, keeps nothing.
export function useKeep<T>(kept: KeptPages<T>, data: T | null) {
  const address = addressOf(useLocation());
  useEffect(() => {
    if (data !== null) kept.keep(address, data);
  }, [kept, address, data]);
}

// Rendered once, in the root. After a step in the history that showed kept
// data, it loads what's on screen again, once the step has ended. React
// Router then runs the loaders with the page staying on screen, and without
// the loading bar or a search's "Searching…", which follow the navigation.
// A passive effect runs once the page's move has ended.
export function LoadKeptAgain(): null {
  const { state } = useNavigation();
  const { key } = useLocation();
  const { revalidate } = useRevalidator();
  useEffect(() => {
    if (state !== "idle" || !takeLoadDue()) return;
    loadingAgain = true;
    void revalidate().finally(() => {
      loadingAgain = false;
    });
  }, [state, key, revalidate]);
  return null;
}

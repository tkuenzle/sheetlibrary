import "../ui/button.css";
import "../ui/group-list.css";
import "./sign-in.css";
import "./account.css";

import { useId, useRef, useState } from "react";
import {
  redirect,
  type ShouldRevalidateFunctionArgs,
  useFetcher,
} from "react-router";

import { signOut } from "../auth/auth-client";
import { getAuth } from "../auth/auth.server";
import { cloudflareContext, sessionContext } from "../context";
import { useRouteCode } from "../route-code";
import { useArrives } from "../ui/arriving";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Note } from "../ui/note";
import { Bar } from "../ui/skeleton";
import type { Route } from "./+types/account";
import type { PasskeyChange } from "./api.passkeys";
import { useShellPasskeyCount } from "./shell";
import {
  backAsLeft,
  fromAnotherPage,
  handOver,
  PageData,
} from "../shell/awaited";
import { addressOf, KeptPages, loadsKeptAgain } from "../shell/kept";
import { useFocusCarriesOver } from "../shell/focus";
import { RouteError } from "../shell/route-error";

// The signed-in person's email, passkeys and sign-out. It sits in the shell
// (routes/shell.tsx). See openspec/specs/accounts.

export function meta() {
  return [
    { title: "Account | Sheet Library" },
    { name: "robots", content: "noindex" },
  ];
}

export interface PasskeyItem {
  id: string;
  name: string | null;
  createdAt: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = context.get(sessionContext);
  if (!session) return redirect("/sign-in");
  const { env } = context.get(cloudflareContext);
  const passkeys = await getAuth(env, request).api.listPasskeys({
    headers: request.headers,
  });
  return {
    email: session.user.email,
    passkeys: passkeys.map((passkey): PasskeyItem => ({
      id: passkey.id,
      name: passkey.name ?? null,
      createdAt: passkey.createdAt.toISOString(),
    })),
  };
}

// On a step back or forward, the page shows as it was left, and loads again
// behind it. On another move from another page, the page waits a moment for the passkeys: if
// they come in time it moves in whole, otherwise with bars, and they follow.
// After a change to the passkeys, it waits and keeps them. A first load
// doesn't run this. See openspec/specs/site-layout.
export async function clientLoader({
  context,
  serverLoader,
  url,
}: Route.ClientLoaderArgs) {
  const back = backAsLeft(kept, url, context, serverLoader);
  if (back) return back;
  if (!fromAnotherPage(url)) {
    return await kept.again(addressOf(url), serverLoader);
  }
  return await handOver(serverLoader(), context);
}

// What the page showed last, for a step back to it (shell/kept.ts).
const kept = new KeptPages<
  Awaited<ReturnType<Route.ClientLoaderArgs["serverLoader"]>>
>();

// In the load after a step back, the page loads again only when it showed
// as it was left.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return (
    loadsKeptAgain(kept, addressOf(args.nextUrl)) ??
    args.defaultShouldRevalidate
  );
}

function passkeyName(passkey: PasskeyItem) {
  return passkey.name ?? "Passkey";
}

function added(passkey: PasskeyItem) {
  const date = new Date(passkey.createdAt).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `Added ${date}`;
}

// One passkey, with its name, or a field to rename it.
function Passkey({
  passkey,
  onRename,
  onRemove,
}: {
  passkey: PasskeyItem;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(passkey.name ?? "");
  const fieldId = useId();
  // It stood for a row of bars (ui/arriving.tsx).
  const arrives = useArrives("account-row account-passkey");

  if (editing) {
    return (
      <li className="account-row account-passkey">
        <form
          className="account-passkey-rename"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim() === "") return;
            onRename(name.trim());
            setEditing(false);
          }}
        >
          <div className="sign-in-field">
            <label htmlFor={fieldId}>Name</label>
            <input
              id={fieldId}
              value={name}
              maxLength={60}
              autoFocus
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </div>
          <div className="account-actions">
            <Button
              variant="text"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={name.trim() === ""}>
              Save
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li {...arrives}>
      <div className="account-passkey-text">
        <span className="account-passkey-name">{passkeyName(passkey)}</span>
        <span className="account-passkey-added">{added(passkey)}</span>
      </div>
      <div className="account-actions">
        <Button
          variant="text"
          size="small"
          aria-label={`Rename ${passkeyName(passkey)}`}
          onClick={() => {
            setEditing(true);
          }}
        >
          Rename
        </Button>
        <Button
          variant="text"
          size="small"
          aria-label={`Remove ${passkeyName(passkey)}`}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

// A passkey's row while the passkeys load: bars for the name and the date,
// and the room of its buttons, so the real row takes its place without the
// rows below it moving. On a phone the buttons wrap below the name.
function PasskeySkeleton({ width }: { width: number }) {
  return (
    <li className="account-row account-passkey" aria-hidden="true">
      <div className="account-passkey-text">
        <span className="account-passkey-name">
          <Bar width={width} />
        </span>
        <span className="account-passkey-added">
          <Bar width={7} />
        </span>
      </div>
      <div className="account-actions account-actions-room">
        <Button variant="text" size="small" tabIndex={-1}>
          Rename
        </Button>
        <Button variant="text" size="small" tabIndex={-1}>
          Remove
        </Button>
      </div>
    </li>
  );
}

export function AccountView({
  email,
  passkeys,
  passkeyCount = 1,
  failed,
  onAdd,
  onRename,
  onRemove,
  onSignOut,
}: {
  // Null while they load: the page shows bars in their place. The root
  // loader only passes the initial, so the email loads with the passkeys.
  email: string | null;
  passkeys: PasskeyItem[] | null;
  // How many passkeys the account has, for the rows of bars while they load.
  passkeyCount?: number;
  failed: boolean;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onSignOut: () => void;
}) {
  const loading = passkeys === null;
  const emailArrives = useArrives("account-email");
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusCarriesOver(loading ? heading : null);
  return (
    <div className="account">
      <h1 ref={heading} tabIndex={-1}>
        Account
      </h1>
      <section className="account-section" aria-labelledby="account-email">
        <h2 id="account-email">Email</h2>
        <ul className="group-list">
          <li className="account-row">
            <span {...emailArrives}>{email ?? <Bar width={12} />}</span>
          </li>
        </ul>
      </section>
      <section className="account-section" aria-labelledby="account-passkeys">
        <h2 id="account-passkeys">Passkeys</h2>
        <ul className="group-list" aria-busy={loading || undefined}>
          {passkeys === null && passkeyCount > 0 ? (
            Array.from({ length: passkeyCount }, (_, i) => (
              <PasskeySkeleton
                key={i}
                width={SKELETON_PASSKEYS[i % SKELETON_PASSKEYS.length] ?? 6}
              />
            ))
          ) : passkeys === null || passkeys.length === 0 ? (
            <li className="account-row">
              <span className="account-empty">No passkeys yet.</span>
            </li>
          ) : (
            passkeys.map((passkey) => (
              <Passkey
                key={passkey.id}
                passkey={passkey}
                onRename={(name) => {
                  onRename(passkey.id, name);
                }}
                onRemove={() => {
                  onRemove(passkey.id);
                }}
              />
            ))
          )}
        </ul>
        <Button
          variant="tonal"
          icon="passkey"
          className="account-add"
          onClick={onAdd}
        >
          Add passkey
        </Button>
        <div aria-live="polite">
          {failed && <Note>No passkey was added.</Note>}
        </div>
      </section>
      {/* Its own one-row group, with an icon, so it doesn't look like
          another button. */}
      <ul className="group-list account-sign-out">
        <li>
          <button type="button" onClick={onSignOut}>
            <Icon name="logout" />
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}

// A page that can't be loaded shows a note in the shell, which stays. See
// openspec/specs/site-layout.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteError error={error} />;
}

// The route passkey changes go to (routes/api.passkeys.ts).
const PASSKEY_ROUTES = ["routes/api.passkeys"];

// Widths in `em` of the bars for the passkeys' names while they load.
const SKELETON_PASSKEYS = [8, 5];

// The page's data: whole after a first load, on its way after a move. The
// skeleton has a row for each passkey, as the shell counted them.
export default function Account({ loaderData }: Route.ComponentProps) {
  const page = "page" in loaderData ? loaderData.page : loaderData;
  const passkeyCount = useShellPasskeyCount();
  return (
    <PageData
      data={page}
      skeleton={
        <LoadedAccount
          email={null}
          passkeys={null}
          passkeyCount={passkeyCount}
        />
      }
      kept={kept}
    >
      {(loaded) => (
        <LoadedAccount email={loaded.email} passkeys={loaded.passkeys} />
      )}
    </PageData>
  );
}

// The page with its actions, once its data is there, or with bars while
// it loads. Adding a passkey and signing out don't wait for it.
function LoadedAccount({
  email,
  passkeys,
  passkeyCount,
}: {
  email: string | null;
  passkeys: PasskeyItem[] | null;
  passkeyCount?: number;
}) {
  // Passkey changes go to /api/passkeys through fetchers, and the page and
  // the shell load again by themselves. Adding has its own, for its note.
  const adding = useFetcher<{ ok: boolean }>({ key: "passkey-add" });
  const changing = useFetcher<{ ok: boolean }>({ key: "passkey-change" });
  const ready = useRouteCode(PASSKEY_ROUTES);
  // The route's code couldn't load, so no passkey was added.
  const [unreachable, setUnreachable] = useState(false);
  const failed =
    adding.state === "idle" && (unreachable || adding.data?.ok === false);

  function send(
    fetcher: typeof adding,
    change: PasskeyChange,
    onUnreachable?: () => void,
  ) {
    ready().then(
      () =>
        fetcher.submit(change, {
          method: "post",
          action: "/api/passkeys",
          encType: "application/json",
        }),
      () => onUnreachable?.(),
    );
  }

  return (
    <AccountView
      email={email}
      passkeys={passkeys}
      passkeyCount={passkeyCount}
      failed={failed}
      onAdd={() => {
        setUnreachable(false);
        send(adding, { intent: "add" }, () => {
          setUnreachable(true);
        });
      }}
      onRename={(id, name) => {
        send(changing, { intent: "rename", id, name });
      }}
      onRemove={(id) => {
        send(changing, { intent: "remove", id });
      }}
      onSignOut={() => {
        void signOut().then(() => {
          window.location.assign("/");
        });
      }}
    />
  );
}

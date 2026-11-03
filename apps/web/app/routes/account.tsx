import "../ui/button.css";
import "../ui/group-list.css";
import "./sign-in.css";
import "./account.css";

import { useId, useState } from "react";
import { redirect, useLoaderData, useRevalidator } from "react-router";

import {
  addPasskey,
  removePasskey,
  renamePasskey,
  signOut,
} from "../auth/auth-client";
import { getAuth } from "../auth/auth.server";
import { cloudflareContext, sessionContext } from "../context";
import { TopBar } from "../shell/top-bar";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { Note } from "../ui/note";
import type { Route } from "./+types/account";

// The signed-in person's email, passkeys and sign-out. See
// openspec/specs/accounts.

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
    <li className="account-row account-passkey">
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

export function AccountView({
  email,
  passkeys,
  failed,
  onAdd,
  onRename,
  onRemove,
  onSignOut,
}: {
  email: string;
  passkeys: PasskeyItem[];
  failed: boolean;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onSignOut: () => void;
}) {
  return (
    <main className="account">
      <h1>Account</h1>
      <section className="account-section" aria-labelledby="account-email">
        <h2 id="account-email">Email</h2>
        <ul className="group-list">
          <li className="account-row">
            <span className="account-email">{email}</span>
          </li>
        </ul>
      </section>
      <section className="account-section" aria-labelledby="account-passkeys">
        <h2 id="account-passkeys">Passkeys</h2>
        <ul className="group-list">
          {passkeys.length === 0 ? (
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
    </main>
  );
}

export default function Account() {
  const { email, passkeys } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [failed, setFailed] = useState(false);

  return (
    <>
      <TopBar accountPage />
      <AccountView
        email={email}
        passkeys={passkeys}
        failed={failed}
        onAdd={() => {
          setFailed(false);
          void addPasskey().then(async (saved) => {
            if (!saved) {
              setFailed(true);
              return;
            }
            await revalidator.revalidate();
          });
        }}
        onRename={(id, name) => {
          void renamePasskey(id, name).then(() => revalidator.revalidate());
        }}
        onRemove={(id) => {
          void removePasskey(id).then(() => revalidator.revalidate());
        }}
        onSignOut={() => {
          void signOut().then(() => {
            window.location.assign("/");
          });
        }}
      />
    </>
  );
}

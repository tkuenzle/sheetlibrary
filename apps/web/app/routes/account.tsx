import "../ui/button.css";
import "./sign-in.css";
import "./account.css";

import { useId, useState } from "react";
import {
  redirect,
  useLoaderData,
  useRevalidator,
  useSearchParams,
} from "react-router";

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
      <li className="account-passkey">
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
    <li className="account-passkey">
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
  offer,
  failed,
  onAdd,
  onSkip,
  onRename,
  onRemove,
  onSignOut,
}: {
  email: string;
  passkeys: PasskeyItem[];
  // After an email sign-in, offer a passkey for this device.
  offer: boolean;
  failed: boolean;
  onAdd: () => void;
  onSkip: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onSignOut: () => void;
}) {
  return (
    <main className="account">
      <h1>Account</h1>
      {offer && (
        <section className="account-offer" aria-label="Add a passkey">
          <p>
            Add a passkey to sign in on this device without waiting for an
            email.
          </p>
          <div className="account-actions">
            <Button variant="text" onClick={onSkip}>
              Not now
            </Button>
            <Button icon="passkey" onClick={onAdd}>
              Add passkey
            </Button>
          </div>
        </section>
      )}
      <section className="account-section">
        <h2>Email</h2>
        <p className="account-email">{email}</p>
      </section>
      <section className="account-section">
        <h2>Passkeys</h2>
        {passkeys.length === 0 ? (
          <p className="account-empty">No passkeys yet.</p>
        ) : (
          <ul className="account-passkeys">
            {passkeys.map((passkey) => (
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
            ))}
          </ul>
        )}
        {!offer && (
          <Button
            variant="tonal"
            icon="passkey"
            className="account-add"
            onClick={onAdd}
          >
            Add passkey
          </Button>
        )}
        <div aria-live="polite">
          {failed && <Note>No passkey was added.</Note>}
        </div>
      </section>
      <Button variant="tonal" className="account-sign-out" onClick={onSignOut}>
        Sign out
      </Button>
    </main>
  );
}

export default function Account() {
  const { email, passkeys } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const [failed, setFailed] = useState(false);
  const offer = searchParams.has("welcome");

  function dropOffer() {
    setSearchParams({}, { replace: true });
  }

  return (
    <>
      <TopBar />
      <AccountView
        email={email}
        passkeys={passkeys}
        offer={offer}
        failed={failed}
        onAdd={() => {
          setFailed(false);
          void addPasskey().then(async (saved) => {
            if (!saved) {
              setFailed(true);
              return;
            }
            dropOffer();
            await revalidator.revalidate();
          });
        }}
        onSkip={dropOffer}
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

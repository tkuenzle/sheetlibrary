import "./page-error.css";

import type { ReactNode } from "react";

import { Icon } from "./icon";
import type { IconName } from "./icons";

// Why a page isn't shown: the server can't be reached, something else went
// wrong, or the address leads nowhere. See openspec/specs/site-layout.
export type PageErrorKind = "unreachable" | "failed" | "not-found";

const pages: Record<
  PageErrorKind,
  { icon: IconName; title: string; text?: string }
> = {
  unreachable: {
    icon: "cloudOff",
    title: "Can’t reach Sheet Library",
    text: "Check your connection and try again.",
  },
  failed: { icon: "info", title: "Something went wrong" },
  "not-found": {
    icon: "info",
    title: "Page not found",
    text: "This address doesn’t lead to a page in Sheet Library.",
  },
};

// Browsers name a fetch that got no answer differently: Chrome "Failed to
// fetch", Firefox "NetworkError when attempting to fetch resource.", Safari
// "Load failed".
const fetchFailed = /failed to fetch|networkerror|load failed/i;

// Which note an error gets. Only a fetch that got no answer, or a browser
// that knows it is offline, means the server can't be reached. Any other
// error, such as a 500 or a bug, is "something went wrong".
export function errorKind(error: unknown, online: boolean): PageErrorKind {
  if (!online) return "unreachable";
  if (error instanceof TypeError && fetchFailed.test(error.message)) {
    return "unreachable";
  }
  return "failed";
}

// Whether the browser says it is online. The server always counts as online:
// a worker has a `navigator`, but no `onLine`.
export function isOnline(): boolean {
  return typeof window === "undefined" || navigator.onLine;
}

// The note in place of a page that can't be shown: an icon, the heading, a
// line, and what to do next, such as "Try again". It is the page's heading;
// only the design page, which has its own, shows it at another level.
export function PageError({
  kind,
  heading: Heading = "h1",
  children,
}: {
  kind: PageErrorKind;
  heading?: "h1" | "h3";
  children: ReactNode;
}) {
  const page = pages[kind];
  return (
    <div className="page-error">
      <Icon name={page.icon} size={48} />
      <Heading className="page-error-title">{page.title}</Heading>
      {page.text && <p>{page.text}</p>}
      <div className="page-error-action">{children}</div>
    </div>
  );
}

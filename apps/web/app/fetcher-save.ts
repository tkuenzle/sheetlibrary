import { useEffect, useRef } from "react";
import {
  type FetcherSubmitOptions,
  type SubmitTarget,
  useFetcher,
} from "react-router";

import type { ChangeAnswer } from "./changes";
import { useRouteCode } from "./route-code";
import { NameRefused } from "./ui/name-dialog";

// A dialog's save through a fetcher. `NameDialog` and `ConfirmDialog` wait
// for an async `onSave` that throws when the change fails, but
// `fetcher.submit()` resolves without the answer. So this submits, and
// settles once the fetcher is idle again, by its answer. Issue #188 may let
// the dialogs read the fetcher instead.

// How a save ends for the fetcher's answer: undefined when it went through,
// otherwise the error to throw. A NameRefused carries the note the naming
// dialog shows. No answer at all is what a redirect leaves: the change went
// through and the page moves on.
export function saveOutcome(
  answer: ChangeAnswer | undefined,
): Error | undefined {
  if (answer === undefined || answer.ok) return undefined;
  if (answer.refused !== undefined) return new NameRefused(answer.refused);
  return new Error("The change didn’t get through");
}

// Gives a function that submits through the fetcher with `key`, once the
// code of `routes` is there, and settles by the answer (saveOutcome). When
// the code can't load, it fails as a change that didn't get through.
export function useFetcherSave(
  key: string,
  routes: readonly string[],
): (target: SubmitTarget, options: FetcherSubmitOptions) => Promise<void> {
  const fetcher = useFetcher<ChangeAnswer>({ key });
  const ready = useRouteCode(routes);
  const waiting = useRef<{
    resolve: () => void;
    reject: (error: Error) => void;
    // Whether the fetcher has started, so an idle fetcher from before the
    // submission doesn't settle it.
    started: boolean;
  }>(undefined);

  useEffect(() => {
    const save = waiting.current;
    if (!save) return;
    if (fetcher.state !== "idle") {
      save.started = true;
      return;
    }
    if (!save.started) return;
    waiting.current = undefined;
    const error = saveOutcome(fetcher.data);
    if (error) save.reject(error);
    else save.resolve();
  }, [fetcher.state, fetcher.data]);

  return (target, options) =>
    ready().then(
      () =>
        new Promise<void>((resolve, reject) => {
          waiting.current = { resolve, reject, started: false };
          void fetcher.submit(target, options);
        }),
      () => {
        throw new Error("The change didn’t get through");
      },
    );
}

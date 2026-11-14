import {
  type Location,
  type NavigateFunction,
  useLocation,
  useNavigate,
} from "react-router";

import { Button } from "../ui/button";
import { errorKind, isOnline, PageError } from "../ui/page-error";

// Loads the address again. Loading the same address runs every loader again,
// the root's and the shell's too, so it also recovers from a failure in
// either. `replace` keeps Back where it was.
export function loadAgain(
  navigate: NavigateFunction,
  { pathname, search, hash }: Pick<Location, "pathname" | "search" | "hash">,
) {
  void navigate({ pathname, search, hash }, { replace: true });
}

// What a route's error boundary shows in place of its page: the note for
// the error, with "Try again". The frame around it stays: the shell's
// navigation, or a sheet's top bar. See openspec/specs/site-layout.
export function RouteError({ error }: { error: unknown }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <PageError kind={errorKind(error, isOnline())}>
      <Button
        icon="refresh"
        onClick={() => {
          loadAgain(navigate, location);
        }}
      >
        Try again
      </Button>
    </PageError>
  );
}

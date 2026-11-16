import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useRef,
  useState,
} from "react";
import { useNavigate, useSubmit } from "react-router";

import { ImportDialog } from "../editor/import-button";
import { PhotoImportDialog } from "../photos/photo-import-dialog";
import type { MenuItem } from "../ui/menu";
import { importedSheetPath, importSheet } from "./import";

// The three ways to add a sheet, behind "New sheet" in the shell's rail, the
// floating button on Sheets and the empty library's cards. The shell renders
// the provider, so every one of them opens the same dialogs, on any screen
// in the shell. See openspec/specs/library-page.

export type NewSheetWay = "write" | "photos" | "ultimate-guitar";

// The ways as the "New sheet" menu lists them, each passed to `pick`.
export function newSheetItems(pick: (way: NewSheetWay) => void): MenuItem[] {
  return [
    {
      label: "Write a new sheet",
      icon: "edit",
      onSelect: () => {
        pick("write");
      },
    },
    {
      label: "From photos…",
      icon: "photoCamera",
      onSelect: () => {
        pick("photos");
      },
    },
    {
      label: "From Ultimate Guitar…",
      icon: "link",
      onSelect: () => {
        pick("ultimate-guitar");
      },
    },
  ];
}

const NewSheetContext = createContext<((way: NewSheetWay) => void) | null>(
  null,
);

// Starts one of the ways. Outside the shell, as in a test of a screen alone,
// it does nothing.
export function useNewSheet(): (way: NewSheetWay) => void {
  return use(NewSheetContext) ?? noWay;
}

function noWay() {
  // Nothing to start outside the shell.
}

// "Write a new sheet" posts to the action of /sheets, which creates
// "Untitled" and opens it, from any screen. The imports open their dialog,
// create the sheet through the API and open it. A dialog stays until the
// sheet replaces the screen. When it closes, the focus goes back to what
// opened it. A sheet from photos takes the title read from them, and only
// opens to be named without one.
export function NewSheetProvider({ children }: { children: ReactNode }) {
  const submit = useSubmit();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"photos" | "ultimate-guitar">();
  const opener = useRef<HTMLElement | null>(null);

  const start = useCallback(
    (way: NewSheetWay) => {
      if (way === "write") {
        void submit({}, { method: "post", action: "/sheets" });
        return;
      }
      opener.current = openerOf(document.activeElement);
      setDialog(way);
    },
    [submit],
  );

  function closed() {
    setDialog(undefined);
    opener.current?.focus();
    opener.current = null;
  }

  return (
    <NewSheetContext value={start}>
      {children}
      <ImportDialog
        open={dialog === "ultimate-guitar"}
        onClose={closed}
        onImport={async (sheet, capo) => {
          const result = await importSheet(sheet);
          if ("error" in result) return result.error;
          void navigate(importedSheetPath(result.id, { capo }));
          return undefined;
        }}
      />
      <PhotoImportDialog
        open={dialog === "photos"}
        onClose={closed}
        onRead={async ({ content, title, artist }) => {
          const result = await importSheet(content, { title, artist });
          if ("error" in result) return false;
          void navigate(importedSheetPath(result.id, { title }));
          return true;
        }}
      />
    </NewSheetContext>
  );
}

// Where the focus goes back to after a dialog. A way picked in a menu was
// picked on an item that goes away with the list, so it is the menu's
// button.
function openerOf(element: Element | null): HTMLElement | null {
  if (!(element instanceof HTMLElement)) return null;
  const menu = element.closest(".menu");
  return menu?.querySelector<HTMLElement>("[aria-haspopup]") ?? element;
}

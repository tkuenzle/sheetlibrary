import type { MenuItem } from "../ui/menu";

// The sheet's menu, the same on the play view and in edit mode: what is
// done with the sheet as a whole. Renaming is part of editing, so it isn't
// here. Delete is off once the sheet is gone. See openspec/specs/play-page
// ("The sheet's menu on the play view").
export function sheetMenuItems({
  onChoose,
  onDelete,
  deleted = false,
  print = () => {
    window.print();
  },
}: {
  onChoose: () => void;
  onDelete: () => void;
  // The sheet was deleted elsewhere (edit mode only).
  deleted?: boolean;
  print?: () => void;
}): MenuItem[] {
  return [
    {
      label: "Choose collections…",
      icon: "collectionsBookmark",
      onSelect: onChoose,
    },
    { label: "Print", icon: "print", separated: true, onSelect: print },
    { label: "Delete", icon: "delete", disabled: deleted, onSelect: onDelete },
  ];
}

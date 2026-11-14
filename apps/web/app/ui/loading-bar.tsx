import "./loading-bar.css";

// The thin bar across the top of the window while a page loads. It is
// decoration: the new page's heading takes focus once it shows. `still`
// draws it without moving, as reduced motion does. See
// openspec/specs/site-layout.
export function LoadingBar({ still = false }: { still?: boolean }) {
  return (
    <div
      className={still ? "loading-bar loading-bar-still" : "loading-bar"}
      aria-hidden="true"
    >
      <span />
    </div>
  );
}

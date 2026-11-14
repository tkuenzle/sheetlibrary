import "./nav-bar.css";

import { Link } from "react-router";

import { currentOf, NavGlyph, type NavItem } from "./nav-rail";

// The navigation at the bottom of a phone: each item with its icon and its
// name. It lists nothing under an item, so an item is marked while one of
// its children is open.
export function NavBar({
  label = "Main",
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  return (
    <nav className="nav-bar" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          className="nav-bar-item"
          to={item.href}
          aria-current={currentOf(item)}
        >
          <span className="nav-bar-icon">
            <NavGlyph item={item} />
          </span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

import "./nav-rail.css";

import { Link } from "react-router";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Tooltip } from "./tooltip";

// A link under an item of the rail, such as one collection.
export interface NavSubItem {
  href: string;
  label: string;
  // Shown at the end of the row, with what screen readers read in its place:
  // "14", read as "14 sheets".
  count?: { text: string; label: string };
  current?: boolean;
}

// A place the navigation leads to. It shows an icon, or a letter in a circle
// as for the account.
export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
  initial?: string;
  current?: boolean;
  // Only the rail lists these, and only in its full form.
  children?: NavSubItem[];
}

// What `aria-current` says where an item's children aren't listed: the item
// stands for the child that is open.
export function currentOf(item: NavItem): "page" | "true" | undefined {
  if (item.current) return "page";
  return item.children?.some((child) => child.current) ? "true" : undefined;
}

export function NavGlyph({ item }: { item: NavItem }) {
  if (item.icon) return <Icon name={item.icon} />;
  return (
    <span className="nav-avatar" aria-hidden="true">
      {item.initial}
    </span>
  );
}

// The navigation at the left of a wide screen: the site's name, the items
// with what they hold listed under them, and the footer's items at the
// bottom. The items scroll on their own, so the name and the footer stay in
// view. Compact, it shows only the icons, each named for screen readers and
// in a tooltip, and lists nothing under them.
export function NavRail({
  label = "Main",
  name,
  items,
  footer = [],
  compact = false,
}: {
  label?: string;
  name?: { href: string; label: string };
  items: NavItem[];
  footer?: NavItem[];
  compact?: boolean;
}) {
  return (
    <nav
      className={compact ? "nav-rail nav-rail-compact" : "nav-rail"}
      aria-label={label}
    >
      {name && !compact && (
        <Link className="nav-rail-name" to={name.href}>
          {name.label}
        </Link>
      )}
      <ul className="nav-rail-items">
        {items.map((item) => (
          <RailItem key={item.href} item={item} compact={compact} />
        ))}
      </ul>
      {footer.length > 0 && (
        <ul className="nav-rail-footer">
          {footer.map((item) => (
            <RailItem key={item.href} item={item} compact={compact} />
          ))}
        </ul>
      )}
    </nav>
  );
}

function RailItem({ item, compact }: { item: NavItem; compact: boolean }) {
  if (compact) {
    return (
      <li>
        <Tooltip text={item.label} placement="right">
          <Link
            className="nav-rail-item"
            to={item.href}
            aria-label={item.label}
            aria-current={currentOf(item)}
          >
            <NavGlyph item={item} />
          </Link>
        </Tooltip>
      </li>
    );
  }
  const children = item.children ?? [];
  return (
    <li>
      <Link
        className="nav-rail-item"
        to={item.href}
        aria-current={item.current ? "page" : undefined}
      >
        <NavGlyph item={item} />
        {item.label}
      </Link>
      {children.length > 0 && (
        <ul className="nav-rail-sub">
          {children.map((child) => (
            <li key={child.href}>
              <Link
                className="nav-rail-sub-item"
                to={child.href}
                aria-current={child.current ? "page" : undefined}
              >
                <span className="nav-rail-sub-label">{child.label}</span>
                {child.count && (
                  <span className="nav-rail-count">
                    <span aria-hidden="true">{child.count.text}</span>
                    <span className="visually-hidden">{child.count.label}</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

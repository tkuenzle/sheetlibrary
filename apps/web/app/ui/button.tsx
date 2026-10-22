import "./button.css";

import type { ComponentProps } from "react";

import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Tooltip, type TooltipPlacement } from "./tooltip";

type ButtonProps = ComponentProps<"button"> & {
  // Filled for the main action, tonal for others next to it, text for the
  // least important ones, such as Cancel.
  variant?: "filled" | "tonal" | "text";
  // Large for the main action beside a docked toolbar.
  size?: "medium" | "small" | "large";
  // An icon before the text.
  icon?: IconName;
};

export function Button({
  variant = "filled",
  size = "medium",
  icon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        "button",
        `button-${variant}`,
        size !== "medium" && `button-${size}`,
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: IconName;
  // The button's name, read by screen readers and shown in its tooltip.
  label: string;
  // Filled for the main action, standard for the others.
  variant?: "filled" | "standard";
  size?: "medium" | "large";
  tooltipPlacement?: TooltipPlacement;
};

export function IconButton({
  icon,
  label,
  variant = "standard",
  size = "medium",
  tooltipPlacement,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip text={label} placement={tooltipPlacement}>
      <button
        type={type}
        aria-label={label}
        className={classNames(
          "button",
          "icon-button",
          `icon-button-${variant}`,
          variant === "filled" && "button-filled",
          size === "large" && "icon-button-large",
          className,
        )}
        {...props}
      >
        <Icon name={icon} size={size === "large" ? 28 : 24} />
      </button>
    </Tooltip>
  );
}

function classNames(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

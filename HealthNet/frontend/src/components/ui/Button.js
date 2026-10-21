import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  ...props
}) {
  const classes = [
    "hnu-btn",
    `hnu-btn-${variant}`,
    `hnu-btn-${size}`,
    block ? "hnu-btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}

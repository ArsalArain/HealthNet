import React from "react";
import Button from "./Button";

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "lg",
}) {
  if (!open) return null;

  return (
    <div className="hnu-modal-backdrop" onClick={onClose}>
      <div className={["hnu-modal", `hnu-modal-${size}`].join(" ")} onClick={(e) => e.stopPropagation()}>
        <div className="hnu-modal-header">
          <h3>{title}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="hnu-modal-body">{children}</div>
        {footer ? <div className="hnu-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

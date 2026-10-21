import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <section {...props} className={["hnu-card", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={["hnu-card-header", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardBody({ children, className = "" }) {
  return <div className={["hnu-card-body", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return <div className={["hnu-card-footer", className].filter(Boolean).join(" ")}>{children}</div>;
}

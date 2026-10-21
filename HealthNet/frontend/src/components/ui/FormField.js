import React from "react";

export default function FormField({ label, htmlFor, hint, error, children, className = "" }) {
  return (
    <div className={["hnu-field", className].filter(Boolean).join(" ")}>
      {label ? (
        <label className="hnu-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <small className="hnu-hint">{hint}</small> : null}
      {error ? <small className="hnu-error">{error}</small> : null}
    </div>
  );
}

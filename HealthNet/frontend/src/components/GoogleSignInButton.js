import React, { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, disabled }) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId || disabled) {
      return undefined;
    }

    let mounted = true;

    loadGoogleScript()
      .then(() => {
        if (!mounted || !window.google?.accounts?.id || !buttonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onCredential,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 388,
          text: "signin_with",
          shape: "pill",
        });
        setStatus("ready");
      })
      .catch(() => {
        if (mounted) {
          setStatus("error");
        }
      });

    return () => {
      mounted = false;
    };
  }, [clientId, disabled, onCredential]);

  if (!clientId) {
    return (
      <div className="google-fallback-wrap">
        <button type="button" className="google-fallback-btn" disabled>
          Google sign-in unavailable
        </button>
        <p className="google-fallback-note">
          Add REACT_APP_GOOGLE_CLIENT_ID in frontend .env to enable it.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="google-fallback-wrap">
        <button type="button" className="google-fallback-btn" disabled>
          Could not load Google sign-in
        </button>
        <p className="google-fallback-note">
          Check your network and Google OAuth client configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="google-auth-shell">
      <div ref={buttonRef} className="google-button-host" />
    </div>
  );
}
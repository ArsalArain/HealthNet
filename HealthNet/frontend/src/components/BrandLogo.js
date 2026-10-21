import React from "react";

export default function BrandLogo({ className = "", alt = "HealthNet logo" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 128 128"
      role="img"
      aria-label={alt}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="healthnet-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4dd2a7" />
          <stop offset="100%" stopColor="#21b476" />
        </linearGradient>
        <filter id="healthnet-logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0b8f63" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect x="0" y="0" width="128" height="128" rx="28" fill="none" />
      <g filter="url(#healthnet-logo-shadow)">
        <rect x="38" y="6" width="52" height="116" rx="10" fill="url(#healthnet-logo-gradient)" />
        <rect x="6" y="38" width="116" height="52" rx="10" fill="url(#healthnet-logo-gradient)" />
      </g>
      <path
        d="M12 64h19c3 0 5-1 7-3l5-5c3-3 9-2 11 2l10 21 18-44c2-5 10-4 11 1l8 28 5-8c2-3 4-4 8-4h14"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
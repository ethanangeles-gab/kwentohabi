import React from "react";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/assets/brand/kwentohabi-logo-warm.png"
      alt="KwentoHabi"
      width={500}
      height={500}
      className={`official-logo${compact ? " official-logo-compact" : ""}`}
      decoding="async"
      draggable={false}
    />
  );
}

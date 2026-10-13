"use client";

import type { ReactNode } from "react";

/** A card whose light follows the pointer. The look is `.spot` in globals.css. */
export function Spotlight({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={className ? `spot ${className}` : "spot"}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
        event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
      }}
    >
      {children}
    </div>
  );
}

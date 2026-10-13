"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/** Copies `value` to the clipboard and says so for a moment. */
export function CopyButton({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => setCopied(true),
          () => {},
        );
      }}
      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3.5 text-[13px] font-medium text-soft transition-colors duration-300 hover:bg-ink/5 hover:text-ink"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}

import { links } from "@mirlow/i18n";
import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { GlassButton } from "./controls";
import { Sheet } from "./Sheet";

const SEEN_KEY = "mirlow.welcomeSeen";

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // no storage: better never than every launch
  }
}

/**
 * A short note from the person who made Mirlow, shown once per PC: on the
 * first launch, and to existing users on the first launch after updating.
 */
export function WelcomeSheet() {
  const { t } = useI18n();
  const w = t.welcome;
  const [open, setOpen] = useState(() => !seen());
  const [copied, setCopied] = useState(false);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={w.title} closeLabel={t.settings.close}>
      <div className="space-y-3 pt-2 text-[14px] leading-relaxed text-soft">
        {w.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="text-ink">{w.signature}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <GlassButton
          tone="accent"
          onClick={() =>
            void navigator.clipboard.writeText(links.repository).then(() => setCopied(true), () => {})
          }
        >
          {copied ? w.copied : w.share}
        </GlassButton>
        <GlassButton onClick={() => onOpenChange(false)}>{w.start}</GlassButton>
      </div>
    </Sheet>
  );
}

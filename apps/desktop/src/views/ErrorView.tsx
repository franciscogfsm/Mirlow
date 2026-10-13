import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { GlassButton } from "../components/controls";
import { api, type ErrorKind } from "../lib/api";
import { useI18n } from "../lib/i18n";

/** Shown when the receiver cannot run. Says what happened and offers the way out. */
export function ErrorView({ kind }: { kind: ErrorKind | null }) {
  const { t } = useI18n();
  const e = t.error;
  const [log, setLog] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const message =
    kind === "engineMissing"
      ? e.engineMissing
      : kind === "discovery"
        ? e.discovery
        : kind === "crashed"
          ? e.crashed
          : e.unknown;

  const toggleDetails = async () => {
    if (log !== null) return setLog(null);
    setLog(await api.getEngineLog().catch(() => ""));
  };

  const copy = async () => {
    if (log === null) return;
    await navigator.clipboard.writeText(log).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-9 pb-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-warn/14 text-warn">
        <TriangleAlert size={26} strokeWidth={1.8} />
      </span>
      <h1 className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.025em]">
        {e.headline}
      </h1>
      <p className="mt-2.5 max-w-[320px] text-[13.5px] text-soft">{message}</p>

      <div className="mt-7 flex items-center gap-2.5">
        <GlassButton tone="accent" onClick={() => void api.restartEngine()}>
          {e.retry}
        </GlassButton>
        <GlassButton onClick={() => void toggleDetails()}>
          {log === null ? e.details : e.hideDetails}
        </GlassButton>
      </div>

      {log !== null && (
        <div className="mt-5 w-full max-w-[380px] text-left">
          <pre className="scroll-quiet max-h-36 select-text overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-raised/60 p-3 font-mono text-[11px] leading-relaxed text-soft">
            {log || "—"}
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            className="mt-2 cursor-pointer text-[12px] text-faint transition-colors hover:text-ink"
          >
            {copied ? e.copied : e.copy}
          </button>
        </div>
      )}
    </div>
  );
}

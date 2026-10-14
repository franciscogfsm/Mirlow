import { LiquidGlass } from "@mirlow/ui";
import { ArrowDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";

/** Shortly after opening, then every few hours for a Mirlow that stays in the tray. */
const FIRST_CHECK_MS = 4_000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

type Phase = "idle" | "downloading" | "installing" | "failed";

/**
 * A quiet pill that appears when a newer Mirlow is out. One click downloads,
 * verifies and installs it; the installer reopens Mirlow on the new version.
 */
export function UpdatePill({ hidden }: { hidden: boolean }) {
  const { t, format } = useI18n();
  const [version, setVersion] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const check = () => {
      api.checkUpdate().then((update) => setVersion(update?.version ?? null), () => {});
    };
    const first = window.setTimeout(check, FIRST_CHECK_MS);
    const every = window.setInterval(check, CHECK_EVERY_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, []);

  useEffect(() => {
    const stop = api.onUpdateProgress(({ downloaded, total }) => {
      if (!total) return;
      const next = Math.min(100, Math.round((downloaded / total) * 100));
      setPercent(next);
      if (next >= 100) setPhase("installing");
    });
    return () => void stop.then((unlisten) => unlisten());
  }, []);

  const update = async () => {
    setPercent(0);
    setPhase("downloading");
    // On success the app closes for the installer, so only failure returns.
    await api.installUpdate().catch(() => setPhase("failed"));
  };

  const busy = phase === "downloading" || phase === "installing";
  const label =
    phase === "downloading"
      ? format(t.update.downloading, { percent: String(percent) })
      : phase === "installing"
        ? t.update.installing
        : phase === "failed"
          ? t.update.failed
          : format(t.update.available, { version: version ?? "" });

  return (
    <AnimatePresence>
      {version && !hidden && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center px-4"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <LiquidGlass
            radius={999}
            bezel={12}
            depth={16}
            frost={1.2}
            className="pointer-events-auto max-w-full"
            contentClassName="flex h-9 items-center gap-3 pl-4 pr-1 text-[12.5px]"
          >
            <span className="truncate text-soft">{label}</span>
            <button
              type="button"
              onClick={() => void update()}
              disabled={busy}
              className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3 font-medium text-[var(--on-accent)] transition-opacity duration-300 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
            >
              <ArrowDown size={13} strokeWidth={2.4} />
              {phase === "failed" ? t.update.retry : t.update.action}
            </button>
          </LiquidGlass>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

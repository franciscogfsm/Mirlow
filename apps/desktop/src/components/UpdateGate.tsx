import { Mark } from "@mirlow/ui";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useI18n } from "../lib/i18n";

/** Right after opening, then every few hours for a Mirlow that stays in the tray. */
const FIRST_CHECK_MS = 1_000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

type Phase = "idle" | "downloading" | "installing" | "failed";

/**
 * Updates are not optional. Once a newer Mirlow is out, this covers the app and
 * installs it straight away; the installer reopens Mirlow on the new version.
 * A mirroring session is never cut short: the update waits until it ends.
 */
export function UpdateGate({ deferred }: { deferred: boolean }) {
  const { t, format } = useI18n();
  const [version, setVersion] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [percent, setPercent] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const check = () => {
      if (started.current) return;
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
    started.current = true;
    setPercent(0);
    setPhase("downloading");
    // On success the app closes for the installer, so only failure returns.
    await api.installUpdate().catch(() => setPhase("failed"));
  };

  useEffect(() => {
    if (version && !deferred && !started.current) void update();
  }, [version, deferred]);

  const status =
    phase === "installing"
      ? t.update.installing
      : phase === "failed"
        ? t.update.failed
        : format(t.update.downloading, { percent: String(percent) });

  return (
    <AnimatePresence>
      {version && !deferred && (
        <motion.div
          className="absolute inset-x-0 bottom-0 top-12 z-[60] flex flex-col items-center justify-center gap-6 bg-paper/90 px-8 text-center backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="alertdialog"
          aria-live="polite"
        >
          <Mark size={44} gradient />
          <div className="flex flex-col gap-2">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">
              {format(t.update.available, { version })}
            </h2>
            <p className="text-[13px] text-soft">{t.update.required}</p>
          </div>

          <div className="flex w-full max-w-[240px] flex-col items-center gap-3">
            <div className="h-1 w-full overflow-hidden rounded-full bg-line-strong">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${phase === "installing" ? 100 : percent}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="text-[12.5px] text-faint">{status}</span>
          </div>

          {phase === "failed" && (
            <button
              type="button"
              onClick={() => void update()}
              className="flex h-8 cursor-pointer items-center rounded-full bg-accent px-4 text-[12.5px] font-medium text-[var(--on-accent)] transition-opacity duration-300 hover:opacity-85"
            >
              {t.update.retry}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

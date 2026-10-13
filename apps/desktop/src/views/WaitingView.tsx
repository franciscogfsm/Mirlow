import { LiquidGlass } from "@mirlow/ui";
import { AnimatePresence, motion } from "motion/react";
import { Signal, type SignalMode } from "../components/Signal";
import type { Status } from "../lib/api";
import { useI18n } from "../lib/i18n";

interface Copy {
  headline: string;
  body?: string;
  mode: SignalMode;
}

/**
 * Everything short of a picture: starting, ready, a device connecting, sound
 * only, and recovering. One layout, so moving between them is a change of
 * words and rhythm, never a change of screen.
 */
export function WaitingView({
  status,
  onRename,
  onOpenHelp,
}: {
  status: Status;
  onRename: () => void;
  onOpenHelp: () => void;
}) {
  const { t, format } = useI18n();
  const device = status.client?.name;

  const copy: Copy = (() => {
    switch (status.phase) {
      case "starting":
        return { headline: t.starting.headline, body: t.starting.body, mode: "idle" };
      case "recovering":
        return { headline: t.recovering.headline, body: t.recovering.body, mode: "idle" };
      case "connecting":
      case "mirroring":
        return {
          headline: device
            ? format(t.connecting.headline, { device })
            : t.connecting.headlineUnknown,
          body: t.connecting.body,
          mode: "active",
        };
      case "audio":
        return {
          headline: device ? format(t.audio.headline, { device }) : t.audio.headlineUnknown,
          body: t.audio.body,
          mode: "active",
        };
      default:
        return { headline: t.waiting.headline, mode: "ready" };
    }
  })();

  const ready = status.phase === "ready";
  const steps = [t.waiting.step1, t.waiting.step2, format(t.waiting.step3, { name: status.name })];

  return (
    <div className="flex h-full flex-col items-center px-8 pb-5">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Signal mode={copy.mode} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status.phase === "mirroring" ? "connecting" : status.phase}
            className="mt-7 flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.03em]">
              {copy.headline}
            </h1>
            {copy.body && (
              <p className="mt-2 max-w-[300px] text-[13.5px] text-soft">{copy.body}</p>
            )}

            {ready && (
              <>
                <p className="mt-5 text-[12px] font-medium uppercase tracking-[0.08em] text-faint">
                  {t.waiting.nameLabel}
                </p>
                <LiquidGlass
                  as="button"
                  type="button"
                  radius={999}
                  bezel={14}
                  depth={20}
                  frost={1}
                  className="lg-press mt-2 max-w-full"
                  contentClassName="block max-w-[320px] truncate px-5 py-2.5 text-[16px] font-semibold tracking-[-0.01em]"
                  onClick={onRename}
                  title={t.settings.name.description}
                >
                  {status.name}
                </LiquidGlass>

                <ol className="mt-7 space-y-2 text-left text-[13.5px] text-soft">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[11px] font-semibold text-ink">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-5 max-w-[300px] text-[12px] text-faint">{t.waiting.hint}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        data-help
        onClick={onOpenHelp}
        className={`h-8 cursor-pointer rounded-full px-3 text-[12.5px] text-faint transition-all duration-500 hover:text-ink ${
          ready ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        tabIndex={ready ? 0 : -1}
      >
        {t.help.toggle}
      </button>
    </div>
  );
}

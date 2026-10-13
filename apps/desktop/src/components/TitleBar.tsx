import { Mark } from "@mirlow/ui";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Maximize, Minimize, Minus, Settings as SettingsIcon, Unplug, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { MIRROR_BAR } from "../lib/frame";
import { useI18n } from "../lib/i18n";
import { ChromeButton, GlassButton, GlassIconButton } from "./controls";

/** Below this window width the bar says less so that nothing is cut short. */
const COMPACT_QUERY = "(max-width: 620px)";

function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia(COMPACT_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}

/**
 * The strip across the top of the window. It is the handle the window is
 * dragged by, says in a word what Mirlow is doing, and holds the few controls
 * there are. While mirroring it also carries the session controls, so nothing
 * ever has to sit on top of the picture.
 */
export function TitleBar({
  label,
  compactLabel,
  tone,
  mirroring,
  fullscreen,
  onToggleFullscreen,
  onDisconnect,
  onOpenSettings,
}: {
  label: string;
  /** A shorter wording for when the window is narrow, as it is around a phone held upright. */
  compactLabel?: string;
  tone: "idle" | "live" | "warn";
  mirroring: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
}) {
  const { t } = useI18n();
  const appWindow = getCurrentWindow();
  const compact = useCompact();
  const slim = mirroring && !fullscreen;
  const text = compact && compactLabel ? compactLabel : label;
  const dot = slim
    ? tone === "warn"
      ? "bg-warn"
      : tone === "live"
        ? "bg-white"
        : "bg-white/40"
    : tone === "live"
      ? "bg-mint"
      : tone === "warn"
        ? "bg-warn"
        : "bg-faint";

  return (
    <header
      data-tauri-drag-region
      style={slim ? { height: MIRROR_BAR } : undefined}
      className={`relative z-30 flex shrink-0 items-center justify-between ${
        slim
          ? "gap-2 bg-black pl-3 pr-1.5 text-white [--ink:#fafafa] [--ink-faint:rgba(250,250,250,0.4)] [--ink-soft:rgba(250,250,250,0.72)]"
          : "h-12 gap-3 pl-4 pr-2"
      }`}
    >
      <div data-tauri-drag-region className="flex min-w-0 items-center gap-2">
        <Mark size={slim ? 16 : 20} gradient className="pointer-events-none shrink-0" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            data-tauri-drag-region
            className={`flex min-w-0 items-center gap-2 font-medium text-soft ${slim ? "text-[12px]" : "text-[12.5px]"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            role="status"
            aria-live="polite"
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span className="truncate" title={label}>
              {text}
            </span>
          </motion.span>
        </AnimatePresence>
      </div>

      <div className={`flex shrink-0 items-center ${slim ? "gap-1" : "gap-1.5"}`}>
        {mirroring && (
          <>
            {compact || slim ? (
              <GlassIconButton label={t.mirroring.disconnect} onClick={onDisconnect} size={slim ? 26 : 34}>
                <Unplug size={slim ? 13 : 15} />
              </GlassIconButton>
            ) : (
              <GlassButton onClick={onDisconnect} className="mr-0.5">
                <Unplug size={14} strokeWidth={2} />
                {t.mirroring.disconnect}
              </GlassButton>
            )}
            <GlassIconButton
              label={fullscreen ? t.mirroring.exitFullscreen : t.mirroring.fullscreen}
              onClick={onToggleFullscreen}
              size={slim ? 26 : 34}
            >
              {fullscreen ? <Minimize size={slim ? 13 : 15} /> : <Maximize size={slim ? 13 : 15} />}
            </GlassIconButton>
          </>
        )}
        <ChromeButton label={t.settings.open} compact={slim} onClick={onOpenSettings}>
          <SettingsIcon size={slim ? 14 : 16} strokeWidth={1.8} />
        </ChromeButton>
        {!fullscreen && (
          <>
            <ChromeButton label={t.window.minimize} compact={slim} onClick={() => void appWindow.minimize()}>
              <Minus size={slim ? 14 : 16} strokeWidth={1.8} />
            </ChromeButton>
            <ChromeButton label={t.window.close} compact={slim} danger onClick={() => void appWindow.close()}>
              <X size={slim ? 14 : 16} strokeWidth={1.8} />
            </ChromeButton>
          </>
        )}
      </div>
    </header>
  );
}

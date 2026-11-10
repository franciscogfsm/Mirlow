import { Mark } from "@mirlow/ui";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Camera,
  Circle,
  Maximize,
  Minimize,
  Minus,
  PictureInPicture2,
  Settings as SettingsIcon,
  Square,
  Unplug,
  X,
} from "lucide-react";
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
  release,
  mirroring,
  fullscreen,
  mini,
  recording,
  notice,
  onToggleFullscreen,
  onDisconnect,
  onOpenSettings,
  onScreenshot,
  onToggleRecording,
  onToggleMini,
}: {
  label: string;
  /** A shorter wording for when the window is narrow, as it is around a phone held upright. */
  compactLabel?: string;
  tone: "idle" | "live" | "warn";
  /** Set while the mouse and keys are going to the phone: how to get them back. */
  release?: string;
  mirroring: boolean;
  fullscreen: boolean;
  /** The small always-on-top window: only the capture controls fit. */
  mini: boolean;
  /** Set while recording: how long so far, as shown. */
  recording: string | null;
  /** A passing message (a file saved, say), clickable when it leads somewhere. */
  notice: { text: string; onClick?: () => void } | null;
  onToggleFullscreen: () => void;
  onDisconnect: () => void;
  onOpenSettings: () => void;
  onScreenshot: () => void;
  onToggleRecording: () => void;
  onToggleMini: () => void;
}) {
  const { t } = useI18n();
  const appWindow = getCurrentWindow();
  const compact = useCompact();
  const slim = mirroring && !fullscreen;
  const text = compact && compactLabel ? compactLabel : label;
  const key = release ? `release:${release}` : notice ? `notice:${notice.text}` : recording ? "recording" : text;
  const icon = slim ? 13 : 15;
  const iconSize = slim ? 26 : 34;
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
          {release ? (
            <motion.span
              key={key}
              data-tauri-drag-region
              className={`flex min-w-0 items-center gap-2 rounded-full bg-white/10 py-0.5 pl-1 pr-2.5 font-medium ${
                slim ? "text-[12px]" : "text-[12.5px]"
              }`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              role="status"
              aria-live="polite"
            >
              <kbd className="rounded-md border border-white/25 bg-white/15 px-1.5 font-sans text-[11px] font-semibold leading-[18px] text-white shadow-[0_1px_0_rgba(255,255,255,0.15)]">
                Esc
              </kbd>
              <span className="truncate text-white/85">{release}</span>
            </motion.span>
          ) : notice ? (
            <motion.button
              key={key}
              type="button"
              disabled={!notice.onClick}
              onClick={notice.onClick}
              className={`flex min-w-0 items-center gap-2 rounded-full bg-white/10 px-2.5 py-0.5 font-medium text-white/90 enabled:cursor-pointer enabled:hover:bg-white/15 ${
                slim ? "text-[12px]" : "text-[12.5px]"
              }`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              role="status"
              aria-live="polite"
            >
              <span className="truncate">{notice.text}</span>
            </motion.button>
          ) : recording ? (
            <motion.span
              key={key}
              data-tauri-drag-region
              className={`flex min-w-0 items-center gap-2 font-medium tabular-nums text-ink ${slim ? "text-[12px]" : "text-[12.5px]"}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              role="status"
            >
              <span className="recording-dot h-2 w-2 shrink-0 rounded-full bg-[#ff453a]" />
              <span className="truncate">{recording}</span>
            </motion.span>
          ) : (
            <motion.span
              key={key}
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
          )}
        </AnimatePresence>
      </div>

      <div className={`flex shrink-0 items-center ${slim ? "gap-1" : "gap-1.5"}`}>
        {mirroring && (
          <>
            <GlassIconButton label={t.mirroring.screenshot} onClick={onScreenshot} size={iconSize}>
              <Camera size={icon} />
            </GlassIconButton>
            <GlassIconButton
              label={recording ? t.mirroring.stopRecording : t.mirroring.record}
              onClick={onToggleRecording}
              size={iconSize}
            >
              {recording ? (
                <Square size={icon - 3} fill="#ff453a" stroke="#ff453a" />
              ) : (
                <Circle size={icon - 2} fill="#ff453a" stroke="#ff453a" />
              )}
            </GlassIconButton>
            {!fullscreen && (
              <GlassIconButton label={mini ? t.mirroring.exitMini : t.mirroring.mini} onClick={onToggleMini} size={iconSize}>
                <PictureInPicture2 size={icon} />
              </GlassIconButton>
            )}
          </>
        )}
        {mirroring && !mini && (
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
        {!mini && (
          <ChromeButton label={t.settings.open} compact={slim} onClick={onOpenSettings}>
            <SettingsIcon size={slim ? 14 : 16} strokeWidth={1.8} />
          </ChromeButton>
        )}
        {!fullscreen && !mini && (
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

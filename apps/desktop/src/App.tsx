import { localeTags } from "@mirlow/i18n";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HelpSheet } from "./components/HelpSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { TitleBar } from "./components/TitleBar";
import { UpdatePill } from "./components/UpdatePill";
import { api, type Settings, type Status, type VideoSize } from "./lib/api";
import { HOME_MIN, HOME_SIZE, MIRROR_BAR, MIRROR_FRAME, MIRROR_MIN } from "./lib/frame";
import { I18nProvider, resolveLocale, useI18n } from "./lib/i18n";
import { useDiagnostics } from "./lib/useDiagnostics";
import { useEngineStatus, useSettings } from "./lib/useEngine";
import { ErrorView } from "./views/ErrorView";
import { MirrorStage } from "./views/MirrorStage";
import { WaitingView } from "./views/WaitingView";

const RESIZE_MS = 420;

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

let resizeRun = 0;

/**
 * Glides the window to a new size instead of snapping to it, growing and
 * shrinking around its centre and staying on the screen it is on.
 */
async function animateWindowTo(target: { width: number; height: number }) {
  const appWindow = getCurrentWindow();
  const run = ++resizeRun;
  const [scale, size, position, monitor] = await Promise.all([
    appWindow.scaleFactor(),
    appWindow.innerSize(),
    appWindow.outerPosition(),
    currentMonitor(),
  ]);
  const from = { width: size.width / scale, height: size.height / scale };
  const origin = { x: position.x / scale, y: position.y / scale };
  if (Math.abs(from.width - target.width) < 2 && Math.abs(from.height - target.height) < 2) return;

  // Where the window should end up: same centre, nudged back on screen if needed.
  let endX = origin.x + (from.width - target.width) / 2;
  let endY = origin.y + (from.height - target.height) / 2;
  if (monitor) {
    const left = monitor.position.x / scale;
    const top = monitor.position.y / scale;
    const right = left + monitor.size.width / scale;
    const bottom = top + monitor.size.height / scale - 48; // leave the taskbar clear
    endX = Math.max(left + 8, Math.min(endX, right - target.width - 8));
    endY = Math.max(top + 8, Math.min(endY, bottom - target.height - 8));
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      if (run !== resizeRun) return resolve(); // a newer resize took over
      const t = reduce ? 1 : Math.min(1, (now - start) / RESIZE_MS);
      const k = easeOutQuint(t);
      const width = Math.round(from.width + (target.width - from.width) * k);
      const height = Math.round(from.height + (target.height - from.height) * k);
      const x = Math.round(origin.x + (endX - origin.x) * k);
      const y = Math.round(origin.y + (endY - origin.y) * k);
      void appWindow.setPosition(new LogicalPosition(x, y));
      void appWindow.setSize(new LogicalSize(width, height));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
const CONTROLS_IDLE_MS = 2600;

/** Sizes the window around a picture of the given proportions. */
async function fitWindowTo(video: VideoSize) {
  const appWindow = getCurrentWindow();
  if ((await appWindow.isFullscreen()) || (await appWindow.isMaximized())) return;

  const monitor = await currentMonitor();
  const scale = monitor?.scaleFactor ?? 1;
  const maxWidth = (monitor ? monitor.size.width / scale : 1600) * 0.9;
  const maxHeight = (monitor ? monitor.size.height / scale : 900) * 0.84;

  const aspect = video.width / video.height;
  const chrome = MIRROR_BAR + MIRROR_FRAME * 2;
  let height = Math.min(maxHeight - chrome, aspect < 1 ? 780 : 600);
  let width = height * aspect;
  if (width > maxWidth - MIRROR_FRAME * 2) {
    width = maxWidth - MIRROR_FRAME * 2;
    height = width / aspect;
  }

  // Drop the standing minimum first, or a portrait phone is held at 380px
  // wide and the picture gains thick bars on both sides.
  await appWindow.setMinSize(new LogicalSize(MIRROR_MIN.width, MIRROR_MIN.height)).catch(() => {});
  await animateWindowTo({
    width: Math.round(width + MIRROR_FRAME * 2),
    height: Math.round(height + chrome),
  });
}

function Shell({
  status,
  settings,
  onSettingsChange,
}: {
  status: Status;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
}) {
  const { t, format } = useI18n();
  const appWindow = getCurrentWindow();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  // Checked while the PC waits for a phone, so problems show before anyone looks for help.
  const diagnostics = useDiagnostics(status.phase === "ready" || helpOpen);

  const video = status.phase === "mirroring" ? status.video : null;
  const mirroring = video !== null;
  const videoKey = video ? `${video.width}x${video.height}` : "";

  const toggleFullscreen = useCallback(async () => {
    const next = !(await appWindow.isFullscreen());
    await appWindow.setFullscreen(next);
    setFullscreen(next);
  }, [appWindow]);

  // The window takes the shape of the picture while mirroring (and follows it
  // when the phone is rotated), then returns to its compact size.
  const wasMirroring = useRef(false);
  useEffect(() => {
    void (async () => {
      if (video) {
        await fitWindowTo(video);
      } else if (wasMirroring.current) {
        if (await appWindow.isFullscreen()) {
          await appWindow.setFullscreen(false);
          setFullscreen(false);
        }
        if (!(await appWindow.isMaximized())) await animateWindowTo(HOME_SIZE);
        await appWindow.setMinSize(new LogicalSize(HOME_MIN.width, HOME_MIN.height)).catch(() => {});
      }
      wasMirroring.current = video !== null;
    })();
    // `videoKey` stands for the picture's dimensions.
  }, [videoKey]);

  // In full screen the controls step out of the way until the pointer moves.
  useEffect(() => {
    if (!(mirroring && fullscreen)) {
      setControlsVisible(true);
      return;
    }
    let timer = 0;
    const wake = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
    };
    wake();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [mirroring, fullscreen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement;
      if (event.key === "F11" || (event.key.toLowerCase() === "f" && !typing && mirroring)) {
        event.preventDefault();
        void toggleFullscreen();
      } else if (event.key === "Escape" && fullscreen && !settingsOpen && !helpOpen) {
        event.preventDefault();
        void toggleFullscreen();
      } else if (event.key === "," && event.ctrlKey) {
        event.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen, fullscreen, mirroring, settingsOpen, helpOpen]);

  // No browser context menu or accidental page zoom in a desktop app.
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);

  const device = status.client?.name;
  const label = (() => {
    switch (status.phase) {
      case "mirroring":
        return device ? format(t.mirroring.from, { device }) : t.mirroring.fromUnknown;
      case "ready":
        return t.status.ready;
      default:
        return t.status[status.phase];
    }
  })();
  const tone =
    status.phase === "error" || status.phase === "recovering"
      ? "warn"
      : status.phase === "starting"
        ? "idle"
        : "live";

  // Keep the notification-area icon's wording in step with the interface.
  const trayStatus =
    status.phase === "ready" ? format(t.tray.ready, { name: status.name }) : label;
  useEffect(() => {
    void api.setTrayText({ status: trayStatus, open: t.tray.open, quit: t.tray.quit });
  }, [trayStatus, t]);

  const view = status.phase === "error" ? "error" : mirroring ? "stage" : "waiting";
  const barHidden = mirroring && fullscreen && !controlsVisible;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="ambient" data-dim={mirroring} aria-hidden="true">
        <i />
      </div>

      <motion.div
        className={mirroring && fullscreen ? "absolute inset-x-0 top-0 z-30" : "relative z-30"}
        animate={{ opacity: barHidden ? 0 : 1, y: barHidden ? -10 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ pointerEvents: barHidden ? "none" : "auto" }}
      >
        <TitleBar
          label={label}
          compactLabel={mirroring ? (device ?? t.mirroring.fromUnknown) : undefined}
          tone={tone}
          mirroring={mirroring}
          fullscreen={fullscreen}
          onToggleFullscreen={() => void toggleFullscreen()}
          onDisconnect={() => void api.restartEngine()}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </motion.div>

      <main
        className="relative z-10 min-h-0 flex-1"
        style={{ cursor: barHidden ? "none" : undefined }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {view === "error" && <ErrorView kind={status.error} />}
            {view === "stage" && video && (
              <MirrorStage
                video={video}
                fullscreen={fullscreen}
                controlsVisible={controlsVisible}
                hidden={settingsOpen || helpOpen}
                onToggleFullscreen={() => void toggleFullscreen()}
              />
            )}
            {view === "waiting" && (
              <WaitingView
                status={status}
                onRename={() => setSettingsOpen(true)}
                onOpenHelp={() => setHelpOpen(true)}
                diagnostics={diagnostics}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <UpdatePill hidden={mirroring || settingsOpen || helpOpen} />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={onSettingsChange}
      />
      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} state={diagnostics} />
    </div>
  );
}

export function App() {
  const status = useEngineStatus();
  const [settings, updateSettings] = useSettings();

  // Theme and language live on the document, so CSS and assistive technology see them.
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.theme === "system") delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
    root.lang = localeTags[resolveLocale(settings.language)];
  }, [settings]);

  // The window starts hidden and is shown once there is something to see,
  // so it never flashes empty.
  const ready = status !== null && settings !== null;
  useEffect(() => {
    if (ready) void getCurrentWindow().show();
  }, [ready]);

  if (!status || !settings) return null;

  return (
    <I18nProvider language={settings.language}>
      <Shell status={status} settings={settings} onSettingsChange={updateSettings} />
    </I18nProvider>
  );
}

import { localeTags } from "@mirlow/i18n";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedbackSheets } from "./components/FeedbackSheets";
import { HelpSheet } from "./components/HelpSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { TitleBar } from "./components/TitleBar";
import { UpdateGate } from "./components/UpdateGate";
import { WelcomeSheet } from "./components/WelcomeSheet";
import { api, type RemoteStatus, type Settings, type Status, type VideoSize } from "./lib/api";
import { HOME_MIN, HOME_SIZE, MIRROR_BAR, MIRROR_FRAME, MIRROR_MIN } from "./lib/frame";
import { I18nProvider, resolveLocale, useI18n } from "./lib/i18n";
import { requestSetup } from "./lib/androidSetup";
import { useDiagnostics } from "./lib/useDiagnostics";
import { useEngineStatus, useRemoteStatus, useSettings } from "./lib/useEngine";
import { ErrorView } from "./views/ErrorView";
import { MirrorStage } from "./views/MirrorStage";
import { WaitingView } from "./views/WaitingView";

const RESIZE_MS = 420;

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

let resizeRun = 0;

/**
 * Glides the window to a new size instead of snapping to it, growing and
 * shrinking around its centre (or ending with its corner `at`), and staying
 * on the screen it is on.
 */
async function animateWindowTo(target: { width: number; height: number }, at?: { x: number; y: number }) {
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
  let endX = at ? at.x : origin.x + (from.width - target.width) / 2;
  let endY = at ? at.y : origin.y + (from.height - target.height) / 2;
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

/** The smallest the mini window may be made, by hand. */
const MINI_MIN = { width: 150, height: 180 };

/**
 * Sizes the window around a picture of the given proportions. The `mini`
 * window is small and sits in the bottom-right corner of the screen.
 */
async function fitWindowTo(video: VideoSize, mini = false) {
  const appWindow = getCurrentWindow();
  if ((await appWindow.isFullscreen()) || (await appWindow.isMaximized())) return;

  const monitor = await currentMonitor();
  const scale = monitor?.scaleFactor ?? 1;
  const maxWidth = (monitor ? monitor.size.width / scale : 1600) * 0.9;
  const maxHeight = (monitor ? monitor.size.height / scale : 900) * 0.84;

  const aspect = video.width / video.height;
  const chrome = MIRROR_BAR + MIRROR_FRAME * 2;

  if (mini) {
    const screen = {
      x: monitor ? monitor.position.x / scale : 0,
      y: monitor ? monitor.position.y / scale : 0,
      width: monitor ? monitor.size.width / scale : 1600,
      height: monitor ? monitor.size.height / scale : 900,
    };
    // About two fifths of the screen's height for a phone held upright.
    const pictureHeight =
      aspect < 1 ? Math.min(screen.height * 0.42, 460) : Math.min(screen.width * 0.3, 520) / aspect;
    const width = Math.round(pictureHeight * aspect + MIRROR_FRAME * 2);
    const height = Math.round(pictureHeight + chrome);
    await appWindow.setMinSize(new LogicalSize(MINI_MIN.width, MINI_MIN.height)).catch(() => {});
    await animateWindowTo(
      { width, height },
      // Clear of the taskbar, in the corner where little else lives.
      { x: screen.x + screen.width - width - 16, y: screen.y + screen.height - 48 - height - 16 },
    );
    return;
  }
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
  remote,
  settings,
  onSettingsChange,
}: {
  status: Status;
  remote: RemoteStatus | null;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
}) {
  const { t, format } = useI18n();
  const appWindow = getCurrentWindow();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  // The small window that stays on top of everything.
  const [mini, setMini] = useState(false);
  // Where the window was before it went small, to go back to.
  const beforeMini = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  // When the recording in progress began.
  const [recordingSince, setRecordingSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // A passing message in the title bar: a file saved, a file sent.
  const [notice, setNotice] = useState<{ text: string; onClick?: () => void; sticky?: boolean } | null>(null);
  // Checked while the PC waits for a phone, so problems show before anyone looks for help.
  const diagnostics = useDiagnostics(status.phase === "ready" || helpOpen);

  // A paused picture keeps its place, so the window (and full screen) stay as
  // they are until it comes back, rather than shrinking away and back.
  const paused = status.phase === "paused";
  const video = status.phase === "mirroring" || paused ? status.video : null;
  const mirroring = video !== null;
  const videoKey = video ? `${video.width}x${video.height}` : "";
  // An Android phone over Wi-Fi takes clicks and keys on the picture itself.
  const direct = status.client?.direct === true;
  const control = mirroring && !direct && settings.control && remote?.state === "connected";
  // The pointer and keys are going to the phone.
  const [captured, setCaptured] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const next = !(await appWindow.isFullscreen());
    if (next && mini) return; // the mini window is left first, by its own button
    await appWindow.setFullscreen(next);
    setFullscreen(next);
  }, [appWindow, mini]);

  const toggleMini = useCallback(async () => {
    if (!video || fullscreen) return;
    if (!mini) {
      const [scale, size, position] = await Promise.all([
        appWindow.scaleFactor(),
        appWindow.innerSize(),
        appWindow.outerPosition(),
      ]);
      beforeMini.current = {
        x: position.x / scale,
        y: position.y / scale,
        width: size.width / scale,
        height: size.height / scale,
      };
      setMini(true);
      await fitWindowTo(video, true);
    } else {
      setMini(false);
      const before = beforeMini.current;
      if (before) await animateWindowTo(before, before);
      else await fitWindowTo(video);
      await appWindow.setMinSize(new LogicalSize(MIRROR_MIN.width, MIRROR_MIN.height)).catch(() => {});
    }
  }, [appWindow, video, mini, fullscreen]);

  // On top of everything while small. (Recording copies Mirlow's own window,
  // so windows covering it are left out and it need not stay on top.)
  const recording = recordingSince !== null;
  useEffect(() => {
    void appWindow.setAlwaysOnTop(mini).catch(() => {});
  }, [appWindow, mini]);

  const show = (text: string, onClick?: () => void, sticky = false) => setNotice({ text, onClick, sticky });
  const reveal = (path: string) => () => void revealItemInDir(path).catch(() => {});

  useEffect(() => {
    if (!notice || notice.sticky) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const screenshot = useCallback(() => {
    api
      .captureScreenshot()
      .then((path) => show(t.mirroring.savedPhoto, reveal(path)))
      .catch(() => show(t.mirroring.captureFailed));
  }, [t]);

  const toggleRecording = useCallback(() => {
    void api.captureRecord(!recording).catch(() => show(t.mirroring.captureFailed));
  }, [recording, t]);

  useEffect(() => {
    void api.captureRecording().then((on) => setRecordingSince(on ? Date.now() : null));
    const unlisten = api.onRecording((event) => {
      if (event.state === "started") {
        setRecordingSince(Date.now());
        return;
      }
      setRecordingSince(null);
      if (event.state === "saved") show(t.mirroring.savedVideo, reveal(event.path));
      else show(t.mirroring.captureFailed);
    });
    return () => void unlisten.then((stop) => stop());
  }, [t]);

  // The time on the recording, ticking.
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [recording]);
  const elapsed = recordingSince === null ? 0 : Math.max(0, Math.floor((now - recordingSince) / 1000));
  const recordingLabel = recording
    ? format(t.mirroring.recording, {
        time: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`,
      })
    : null;

  // The window takes the shape of the picture while mirroring (and follows it
  // when the phone is rotated), then returns to its compact size.
  const wasMirroring = useRef(false);
  useEffect(() => {
    void (async () => {
      if (video) {
        await fitWindowTo(video, mini);
      } else if (wasMirroring.current) {
        if (await appWindow.isFullscreen()) {
          await appWindow.setFullscreen(false);
          setFullscreen(false);
        }
        // The mini window goes back to where the window was before it.
        const before = mini ? beforeMini.current : null;
        if (mini) setMini(false);
        if (!(await appWindow.isMaximized())) await animateWindowTo(HOME_SIZE, before ?? undefined);
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
    const show = () => {
      setControlsVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS);
    };
    const wake = () => {
      // Moving the phone's pointer is not reaching for the controls.
      if (!document.pointerLockElement) show();
    };
    // Shown once more as control starts or ends, so the way out is seen.
    show();
    window.addEventListener("pointermove", wake);
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [mirroring, fullscreen, captured]);

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
      } else if (mirroring && event.ctrlKey && event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === "s") screenshot();
        else if (key === "r") toggleRecording();
        else if (key === "m") void toggleMini();
        else return;
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen, fullscreen, mirroring, settingsOpen, helpOpen, screenshot, toggleRecording, toggleMini]);

  // Files dropped on the window go to an Android phone being mirrored. (On
  // the picture itself, scrcpy takes them and does the same.)
  const device = status.client?.name;
  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent((event) => {
      if (!mirroring) return;
      const kind = event.payload.type;
      if (kind === "enter") {
        show(direct ? format(t.files.drop, { device: device ?? "Android" }) : t.files.onlyAndroid, undefined, true);
      } else if (kind === "leave") {
        setNotice(null);
      } else if (kind === "drop") {
        setNotice(null);
        if (!direct) show(t.files.onlyAndroid);
        else void api.androidSendFiles(event.payload.paths).catch(() => show(t.mirroring.captureFailed));
      }
    });
    return () => void unlisten.then((stop) => stop());
  }, [mirroring, direct, device, t]);

  useEffect(() => {
    const unlisten = api.onTransfer((transfer) => {
      const name = transfer.name;
      if (transfer.state === "sending") show(format(t.files.sending, { name }), undefined, true);
      else if (transfer.state === "sent") show(format(t.files.sent, { name }));
      else if (transfer.state === "installed") show(format(t.files.installed, { name }));
      else show(format(t.files.failed, { name }));
    });
    return () => void unlisten.then((stop) => stop());
  }, [t]);

  // No browser context menu or accidental page zoom in a desktop app.
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    window.addEventListener("contextmenu", block);
    return () => window.removeEventListener("contextmenu", block);
  }, []);

  const label = (() => {
    switch (status.phase) {
      case "mirroring":
        if (direct) return device ? format(t.wifi.hint, { device }) : t.wifi.hintUnknown;
        if (captured) return device ? format(t.control.active, { device }) : t.control.activeUnknown;
        if (control) return device ? format(t.control.hint, { device }) : t.control.hintUnknown;
        if (settings.control) return device ? format(t.control.pair, { device }) : t.control.pairUnknown;
        return device ? format(t.mirroring.from, { device }) : t.mirroring.fromUnknown;
      case "paused":
        if (!device) return status.sound ? t.paused.soundOnly : t.status.paused;
        return format(status.sound ? t.paused.labelSound : t.paused.label, { device });
      case "ready":
        return t.status.ready;
      default:
        return t.status[status.phase];
    }
  })();
  const tone =
    status.phase === "error" || status.phase === "recovering"
      ? "warn"
      : status.phase === "starting" || paused
        ? "idle"
        : "live";
  const compactLabel = !mirroring
    ? undefined
    : paused
      ? status.sound
        ? t.paused.soundOnly
        : t.status.paused
      : captured
        ? t.control.activeShort
        : (device ?? t.mirroring.fromUnknown);

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
          compactLabel={compactLabel}
          tone={tone}
          release={captured ? t.control.release : undefined}
          mirroring={mirroring}
          fullscreen={fullscreen}
          mini={mini}
          recording={recordingLabel}
          notice={notice}
          onToggleFullscreen={() => void toggleFullscreen()}
          onDisconnect={() => void api.restartEngine()}
          onOpenSettings={() => setSettingsOpen(true)}
          onScreenshot={screenshot}
          onToggleRecording={toggleRecording}
          onToggleMini={() => void toggleMini()}
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
                pause={paused ? { locked: status.locked, sound: status.sound, device } : null}
                control={control}
                android={status.client?.model === "Android"}
                pointerSpeed={settings.pointerSpeed}
                onCaptureChange={setCaptured}
                onToggleFullscreen={() => void toggleFullscreen()}
              />
            )}
            {view === "waiting" && (
              <WaitingView
                status={status}
                onRename={() => setSettingsOpen(true)}
                onOpenHelp={() => setHelpOpen(true)}
                onSetUpAndroid={() => {
                  requestSetup();
                  setSettingsOpen(true);
                }}
                diagnostics={diagnostics}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <UpdateGate deferred={mirroring} />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        remote={remote}
        android={status.client?.model === "Android"}
        onChange={onSettingsChange}
      />
      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} state={diagnostics} />
      <WelcomeSheet />
      <FeedbackSheets mirroring={mirroring} />
    </div>
  );
}

export function App() {
  const status = useEngineStatus();
  const [settings, updateSettings] = useSettings();
  const remote = useRemoteStatus();

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
    if (ready) void api.reveal();
  }, [ready]);

  if (!status || !settings) return null;

  return (
    <I18nProvider language={settings.language}>
      <Shell status={status} remote={remote} settings={settings} onSettingsChange={updateSettings} />
    </I18nProvider>
  );
}

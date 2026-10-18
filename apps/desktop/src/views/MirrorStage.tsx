import { Lock, Pause } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, type Rect, type VideoSize } from "../lib/api";
import { MIRROR_FRAME } from "../lib/frame";
import { useI18n } from "../lib/i18n";
import { pointerScale, useRemoteControl } from "../lib/useRemoteControl";

/** Space kept clear at the top of a full-screen stage while the controls show. */
const CONTROLS_HEIGHT = 56;
const WINDOWED_RADIUS = 20;
/**
 * How long a picture that comes back stays covered. The first frame shown on
 * waking can still be the one from before the pause; by now a fresh one has
 * replaced it.
 */
const RESUME_MS = 220;
/** Below this size (either side) the paused picture says only what happened. */
const ROOMY = 220;

/** Why the picture has stopped, and what carries on without it. */
export interface PauseInfo {
  /** The device's screen went to sleep: it was locked. */
  locked: boolean;
  /** Its sound can still be heard. */
  sound: boolean;
  device: string | undefined;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The largest box with the picture's proportions that fits inside `area`, centred. */
function fit(area: Box, aspect: number): Box {
  let width = area.width;
  let height = width / aspect;
  if (height > area.height) {
    height = area.height;
    width = height * aspect;
  }
  return {
    left: area.left + (area.width - width) / 2,
    top: area.top + (area.height - height) / 2,
    width,
    height,
  };
}

/**
 * What takes the picture's place while it is paused: a quiet, dark panel the
 * same shape as the screen, so a projector shows this and not the last frame.
 */
function PausedPanel({ pause, large, roomy }: { pause: PauseInfo; large: boolean; roomy: boolean }) {
  const { t, format } = useI18n();
  const { device, locked, sound } = pause;
  const headline = locked ? t.paused.locked : t.paused.stopped;
  const body = locked
    ? device
      ? format(t.paused.unlock, { device })
      : t.paused.unlockUnknown
    : device
      ? format(t.paused.waiting, { device })
      : t.paused.waitingUnknown;
  const Icon = locked ? Lock : Pause;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      role="status"
      aria-live="polite"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/80 ${
          large ? "h-16 w-16" : "h-11 w-11"
        }`}
      >
        <Icon size={large ? 24 : 17} strokeWidth={1.8} />
      </span>
      <p className={`mt-4 font-semibold tracking-[-0.02em] ${large ? "text-[24px]" : "text-[16px]"}`}>
        {headline}
      </p>
      {roomy && (
        <p className={`mt-1.5 text-white/55 ${large ? "max-w-[420px] text-[15px]" : "max-w-[250px] text-[12.5px]"}`}>
          {body}
        </p>
      )}
      <AnimatePresence initial={false}>
        {sound && (
          <motion.p
            key="sound"
            className={`flex items-center gap-2 whitespace-nowrap font-medium text-white/75 ${large ? "mt-7 text-[14px]" : "mt-5 text-[12px]"}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="sound-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {t.paused.sound}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Where the mirrored screen goes.
 *
 * The picture itself is drawn by a native window that the backend lays over
 * this component (see `video.rs`); the web view cannot draw it, and cannot
 * draw on top of it. So this component's job is to work out exactly which
 * rectangle the picture should occupy, keeping its proportions, and report it.
 * Everything outside that rectangle is ordinary interface.
 *
 * While the picture is paused (the phone was locked) the native window is
 * hidden, and the rectangle shows what happened instead.
 *
 * When the phone is paired as a Bluetooth mouse and keyboard (`control`),
 * clicking the picture hands the pointer and keys to the phone until Esc.
 */
export function MirrorStage({
  video,
  fullscreen,
  controlsVisible,
  hidden,
  pause,
  control,
  android,
  pointerSpeed,
  onCaptureChange,
  onToggleFullscreen,
}: {
  video: VideoSize;
  fullscreen: boolean;
  /** Full screen only: the controls are showing and need room. */
  controlsVisible: boolean;
  /** Something is open over the stage, so the picture must step aside. */
  hidden: boolean;
  /** Set while the picture has stopped. */
  pause: PauseInfo | null;
  /** A phone is connected over Bluetooth and can be worked from here. */
  control: boolean;
  /** The picture comes from an Android phone, whose pointer moves differently. */
  android: boolean;
  pointerSpeed: number;
  onCaptureChange: (captured: boolean) => void;
  onToggleFullscreen: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<Box | null>(null);
  const [settled, setSettled] = useState(false);
  const aspect = video.width / video.height;
  const paused = pause !== null;

  // Covered at once when the picture pauses; uncovered a moment after it returns.
  const [uncovered, setUncovered] = useState(!paused);
  useEffect(() => {
    if (paused) {
      setUncovered(false);
      return;
    }
    const timer = window.setTimeout(() => setUncovered(true), RESUME_MS);
    return () => window.clearTimeout(timer);
  }, [paused]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const bounds = container.getBoundingClientRect();
      setArea({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Let the window finish resizing and the frame animate in before the
  // picture is laid over it.
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 520);
    return () => window.clearTimeout(timer);
  }, []);

  let picture: Box | null = null;
  if (area && area.width > 0 && area.height > 0) {
    const frame = fullscreen ? 0 : MIRROR_FRAME;
    const usable: Box = {
      left: area.left + frame,
      top: area.top + frame,
      width: area.width - frame * 2,
      height: area.height - frame * 2,
    };
    picture = fit(usable, aspect);
    if (fullscreen && controlsVisible && picture.top < CONTROLS_HEIGHT) {
      picture = fit(
        { ...usable, top: usable.top + CONTROLS_HEIGHT, height: usable.height - CONTROLS_HEIGHT },
        aspect,
      );
    }
  }

  const { captured, capture } = useRemoteControl(
    pictureRef,
    control && !hidden,
    pointerScale(pointerSpeed, video, picture?.width ?? 0, android),
    !android,
  );
  useEffect(() => onCaptureChange(captured), [captured]);

  const radius = fullscreen ? 0 : WINDOWED_RADIUS;
  const visible = settled && !hidden && uncovered && picture !== null;
  const key = picture
    ? `${Math.round(picture.left)},${Math.round(picture.top)},${Math.round(picture.width)},${Math.round(picture.height)},${radius},${visible}`
    : "";

  useEffect(() => {
    if (!picture) return;
    const scale = window.devicePixelRatio || 1;
    const rect: Rect = {
      x: Math.round(picture.left * scale),
      y: Math.round(picture.top * scale),
      width: Math.round(picture.width * scale),
      height: Math.round(picture.height * scale),
    };
    void api.layoutVideo(rect, visible, Math.round(radius * scale));
    // `key` captures every value the native layout depends on.
  }, [key]);

  useEffect(
    () => () => {
      void api.layoutVideo({ x: 0, y: 0, width: 0, height: 0 }, false, 0);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      data-tauri-drag-region
      className="relative h-full w-full bg-black"
      onDoubleClick={onToggleFullscreen}
    >
      {picture && area && (
        <motion.div
          ref={pictureRef}
          // A picture that can be worked is not a handle to drag the window by.
          data-tauri-drag-region={control ? undefined : true}
          onClick={control ? capture : undefined}
          onDoubleClick={control ? (event) => event.stopPropagation() : undefined}
          className="absolute overflow-hidden bg-black shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)]"
          style={{
            left: picture.left - area.left,
            top: picture.top - area.top,
            width: picture.width,
            height: picture.height,
            borderRadius: radius,
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
        >
          <AnimatePresence>
            {pause && (
              <PausedPanel
                key="paused"
                pause={pause}
                large={fullscreen && picture.width >= 480 && picture.height >= 480}
                roomy={picture.width >= ROOMY && picture.height >= ROOMY}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

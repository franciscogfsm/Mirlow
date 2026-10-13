import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, type Rect, type VideoSize } from "../lib/api";
import { MIRROR_FRAME } from "../lib/frame";

/** Space kept clear at the top of a full-screen stage while the controls show. */
const CONTROLS_HEIGHT = 56;
const WINDOWED_RADIUS = 20;

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
 * Where the mirrored screen goes.
 *
 * The picture itself is drawn by a native window that the backend lays over
 * this component (see `video.rs`); the web view cannot draw it, and cannot
 * draw on top of it. So this component's job is to work out exactly which
 * rectangle the picture should occupy, keeping its proportions, and report it.
 * Everything outside that rectangle is ordinary interface.
 */
export function MirrorStage({
  video,
  fullscreen,
  controlsVisible,
  hidden,
  onToggleFullscreen,
}: {
  video: VideoSize;
  fullscreen: boolean;
  /** Full screen only: the controls are showing and need room. */
  controlsVisible: boolean;
  /** Something is open over the stage, so the picture must step aside. */
  hidden: boolean;
  onToggleFullscreen: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState<Box | null>(null);
  const [settled, setSettled] = useState(false);
  const aspect = video.width / video.height;

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

  const radius = fullscreen ? 0 : WINDOWED_RADIUS;
  const visible = settled && !hidden && picture !== null;
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
          data-tauri-drag-region
          className="absolute bg-black shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)]"
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
        />
      )}
    </div>
  );
}

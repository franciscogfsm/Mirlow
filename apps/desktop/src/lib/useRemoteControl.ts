import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { api, type VideoSize } from "./api";

/** The short side of most Android phones' screens, in pixels. */
const ANDROID_SHORT_SIDE = 1080;

/**
 * How far the phone's pointer goes for each count of the mouse.
 *
 * The backend reads the mouse itself, in counts that move the PC's cursor a
 * physical pixel each at Windows' usual pointer speed. At the middle of the
 * speed setting, moving the mouse across the picture moves the phone's
 * pointer across the same part of the phone's screen, as if the PC's own
 * cursor were on it. Each step of the setting either side is a quarter
 * faster or slower.
 *
 * An iPhone's pointer moves in points, about three of the picture's pixels
 * each. An Android phone's moves in the screen's own pixels, and its picture
 * arrives scaled to fit Miracast's frame, so the phone's screen is taken to
 * be as wide as most are: 1080 pixels across its short side.
 */
export function pointerScale(speed: number, video: VideoSize, pictureWidth: number, android: boolean): number {
  const physical = pictureWidth * (window.devicePixelRatio || 1);
  const across = android
    ? (video.width * ANDROID_SHORT_SIDE) / Math.max(1, Math.min(video.width, video.height))
    : video.width / 3;
  const matched = physical > 0 ? across / physical : 1;
  return matched * Math.pow(1.25, Math.min(10, Math.max(1, speed)) - 5);
}

/**
 * Lets the mouse and keyboard work the phone while the pointer is captured by
 * `target`. Clicking the picture captures it; Esc lets go, as it does for any
 * captured pointer.
 *
 * The mouse and keys themselves are read by the backend, straight from
 * Windows, for the least delay. Here the captured pointer hides the PC's
 * cursor and keeps it in the window, and the keys and clicks are kept from
 * the rest of the interface, so shortcuts such as F for full screen go only
 * to the phone.
 */
export function useRemoteControl(target: RefObject<HTMLElement | null>, enabled: boolean, scale: number) {
  const [captured, setCaptured] = useState(false);
  const capturedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;

  const capture = useCallback(() => {
    const element = target.current;
    if (!enabled || !element || document.pointerLockElement === element) return;
    void (element.requestPointerLock() as Promise<void> | undefined)?.catch(() => {});
  }, [enabled, target]);

  // A new speed, or a picture resized, takes effect without letting go.
  useEffect(() => {
    if (captured) void api.remoteCapture(true, scale);
  }, [captured, scale]);

  useEffect(() => {
    if (!enabled) {
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }

    const onLockChange = () => {
      const now = target.current !== null && document.pointerLockElement === target.current;
      if (now === capturedRef.current) return;
      capturedRef.current = now;
      setCaptured(now);
      void api.remoteCapture(now, scaleRef.current);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!capturedRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      // Esc belongs to the PC: it hands the pointer back.
      if (event.code === "Escape" && event.type === "keydown") document.exitPointerLock();
    };
    // The clicks and wheel are the phone's; the web view must not act on
    // them too (a middle click would start scrolling the page).
    const swallow = (event: Event) => {
      if (capturedRef.current) event.preventDefault();
    };
    const onBlur = () => {
      if (document.pointerLockElement) document.exitPointerLock();
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousedown", swallow);
    document.addEventListener("wheel", swallow, { passive: false });
    // Ahead of everything else, so the interface's own shortcuts stay quiet.
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", swallow);
      document.removeEventListener("wheel", swallow);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur);
      if (target.current && document.pointerLockElement === target.current) document.exitPointerLock();
      if (capturedRef.current) void api.remoteCapture(false, scaleRef.current);
      capturedRef.current = false;
      setCaptured(false);
    };
  }, [enabled, target]);

  return { captured, capture };
}

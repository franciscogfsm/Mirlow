import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { api, type VideoSize } from "./api";

/**
 * How long after losing the pointer by accident the picture takes it back by
 * itself. When the phone turns, the engine replaces its picture, and its new
 * window can take the focus from Mirlow for a moment.
 */
const RESUME_WITHIN_MS = 2500;
/** Long enough for an Esc that let go to have been noted first. */
const RESUME_AFTER_MS = 120;

/** The short side of most Android phones' screens, in pixels. */
const ANDROID_SHORT_SIDE = 1080;

/**
 * The short side of an Apple device's screen, in the points its pointer moves
 * in, told apart by the screen's shape: every iPhone since the X is 375 to 440
 * points across, the iPhone 8 and SE with their wider screens 375, and iPads
 * 744 to 1032.
 */
function appleShortSide(video: VideoSize): number {
  const shape = Math.max(video.width, video.height) / Math.max(1, Math.min(video.width, video.height));
  if (shape < 1.6) return 820;
  if (shape < 2) return 375;
  return 393;
}

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
 * The picture's size says nothing about the phone's screen: the phone scales
 * its stream to fit the PC's screen, more upright than on its side. So the
 * screen is taken to be as wide as the phone's kind usually is across its
 * short side, whichever way it is held. An iPhone's pointer moves in points;
 * an Android phone's in the screen's own pixels, 1080 across on most.
 */
export function pointerScale(speed: number, video: VideoSize, pictureWidth: number, android: boolean): number {
  const physical = pictureWidth * (window.devicePixelRatio || 1);
  const short = android ? ANDROID_SHORT_SIDE : appleShortSide(video);
  const across = (video.width * short) / Math.max(1, Math.min(video.width, video.height));
  const matched = physical > 0 ? across / physical : 1;
  return matched * Math.pow(1.25, Math.min(10, Math.max(1, speed)) - 5);
}

/**
 * Lets the mouse and keyboard work the phone while the pointer is captured by
 * `target`. Clicking the picture captures it; Esc lets go, as it does for any
 * captured pointer. For an iPhone or iPad (`apple`), Ctrl and the wheel zoom,
 * and the phone's own pointer acceleration is made up for.
 * A pointer lost any other way (the phone turned, the window resized) is
 * taken back by itself, so control carries on.
 *
 * The mouse and keys themselves are read by the backend, straight from
 * Windows, for the least delay. Here the captured pointer hides the PC's
 * cursor and keeps it in the window, and the keys and clicks are kept from
 * the rest of the interface, so shortcuts such as F for full screen go only
 * to the phone.
 */
export function useRemoteControl(
  target: RefObject<HTMLElement | null>,
  enabled: boolean,
  scale: number,
  apple: boolean,
) {
  const [captured, setCaptured] = useState(false);
  const capturedRef = useRef(false);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const appleRef = useRef(apple);
  appleRef.current = apple;

  const capture = useCallback(() => {
    const element = target.current;
    if (!enabled || !element || document.pointerLockElement === element) return;
    void (element.requestPointerLock() as Promise<void> | undefined)?.catch(() => {});
  }, [enabled, target]);

  // A new speed, or a picture resized or turned, takes effect without letting go.
  useEffect(() => {
    if (captured) void api.remoteCapture(true, scale, apple);
  }, [captured, scale, apple]);

  useEffect(() => {
    if (!enabled) {
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }

    // Esc was pressed: the pointer stays with the PC until the next click.
    let released = false;
    let resumeUntil = 0;
    let timer = 0;

    const relock = () => {
      const element = target.current;
      if (!element || document.pointerLockElement === element) return;
      void (element.requestPointerLock() as Promise<void> | undefined)?.catch(() => {});
    };
    const resume = () => {
      if (released || capturedRef.current || performance.now() > resumeUntil) return;
      void api.resumeCapture().then(
        (allowed) => {
          if (!allowed) resumeUntil = 0;
          // Otherwise taken back here, or as soon as the focus is back.
          else if (document.hasFocus()) relock();
        },
        () => {},
      );
    };
    const onLockChange = () => {
      const now = target.current !== null && document.pointerLockElement === target.current;
      if (now === capturedRef.current) return;
      capturedRef.current = now;
      setCaptured(now);
      void api.remoteCapture(now, scaleRef.current, appleRef.current);
      window.clearTimeout(timer);
      if (now) {
        released = false;
        resumeUntil = 0;
      } else if (!released) {
        resumeUntil = performance.now() + RESUME_WITHIN_MS;
        timer = window.setTimeout(resume, RESUME_AFTER_MS);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Escape") released = true;
      if (!capturedRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      // Esc belongs to the PC: it hands the pointer back.
      if (event.code === "Escape" && event.type === "keydown") document.exitPointerLock();
    };
    const onFocus = () => {
      if (!released && !capturedRef.current && performance.now() <= resumeUntil) relock();
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
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", swallow);
      document.removeEventListener("wheel", swallow);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur);
      if (target.current && document.pointerLockElement === target.current) document.exitPointerLock();
      if (capturedRef.current) void api.remoteCapture(false, scaleRef.current, appleRef.current);
      capturedRef.current = false;
      setCaptured(false);
    };
  }, [enabled, target]);

  return { captured, capture };
}

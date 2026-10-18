import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { api } from "./api";

/** HID modifier bits, by `KeyboardEvent.code`. */
const MODIFIERS: Record<string, number> = {
  ControlLeft: 0x01,
  ShiftLeft: 0x02,
  AltLeft: 0x04,
  MetaLeft: 0x08,
  ControlRight: 0x10,
  ShiftRight: 0x20,
  AltRight: 0x40,
  MetaRight: 0x80,
};

/**
 * HID keyboard usages, by `KeyboardEvent.code`. Codes name the key's place on
 * the keyboard, not the character it types, which is what HID sends too: the
 * phone applies its own keyboard layout.
 */
const USAGES: Record<string, number> = {
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Backquote: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,
  PrintScreen: 0x46,
  ScrollLock: 0x47,
  Pause: 0x48,
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,
  NumLock: 0x53,
  NumpadDivide: 0x54,
  NumpadMultiply: 0x55,
  NumpadSubtract: 0x56,
  NumpadAdd: 0x57,
  NumpadEnter: 0x58,
  NumpadDecimal: 0x63,
  IntlBackslash: 0x64,
  ContextMenu: 0x65,
};
for (let i = 0; i < 26; i++) USAGES[`Key${String.fromCharCode(65 + i)}`] = 0x04 + i;
for (let i = 1; i <= 9; i++) USAGES[`Digit${i}`] = 0x1e + i - 1;
USAGES.Digit0 = 0x27;
for (let i = 1; i <= 12; i++) USAGES[`F${i}`] = 0x3a + i - 1;
for (let i = 1; i <= 9; i++) USAGES[`Numpad${i}`] = 0x59 + i - 1;
USAGES.Numpad0 = 0x62;

/** A wheel notch, in the pixels a browser reports for it. */
const NOTCH = 100;

/**
 * Lets the mouse and keyboard work the phone while the pointer is captured by
 * `target`. Clicking the picture captures it; Esc lets go, as it does for any
 * captured pointer. While captured, nothing reaches the rest of the
 * interface, so shortcuts such as F for full screen go to the phone instead.
 */
export function useRemoteControl(target: RefObject<HTMLElement | null>, enabled: boolean) {
  const [captured, setCaptured] = useState(false);
  const capturedRef = useRef(false);

  const capture = useCallback(() => {
    const element = target.current;
    if (!enabled || !element || document.pointerLockElement === element) return;
    // Raw movement, without Windows' pointer acceleration: the phone adds its own.
    const request = element.requestPointerLock({ unadjustedMovement: true }) as Promise<void> | undefined;
    request?.catch(() => element.requestPointerLock());
  }, [enabled, target]);

  useEffect(() => {
    if (!enabled) {
      if (document.pointerLockElement) document.exitPointerLock();
      return;
    }

    let buttons = 0;
    let modifiers = 0;
    let keys: number[] = [];
    // Movement is gathered and sent once a frame; clicks and keys go at once.
    let dx = 0;
    let dy = 0;
    let wheel = 0;
    let frame = 0;

    const flush = () => {
      frame = 0;
      const x = Math.trunc(dx);
      const y = Math.trunc(dy);
      const notches = Math.trunc(wheel);
      dx -= x;
      dy -= y;
      wheel -= notches;
      if (x || y || notches) void api.remotePointer({ dx: x, dy: y, wheel: notches, buttons });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const sendButtons = (next: number) => {
      if (next === buttons) return;
      if (frame) cancelAnimationFrame(frame);
      flush();
      buttons = next;
      void api.remotePointer({ dx: 0, dy: 0, wheel: 0, buttons });
    };
    const sendKeys = () => void api.remoteKeys(modifiers, keys.slice(0, 6));
    const release = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      dx = dy = wheel = 0;
      if (buttons) sendButtons(0);
      if (modifiers || keys.length) {
        modifiers = 0;
        keys = [];
        sendKeys();
      }
    };

    const onLockChange = () => {
      const now = target.current !== null && document.pointerLockElement === target.current;
      capturedRef.current = now;
      setCaptured(now);
      if (!now) release();
    };
    const onMove = (event: MouseEvent) => {
      if (!capturedRef.current) return;
      dx += event.movementX;
      dy += event.movementY;
      schedule();
    };
    const onButton = (event: MouseEvent) => {
      if (!capturedRef.current) return;
      event.preventDefault();
      // The browser's 1 / 2 / 4 for left / right / middle is HID's order too.
      sendButtons(event.buttons & 0x07);
    };
    const onWheel = (event: WheelEvent) => {
      if (!capturedRef.current) return;
      event.preventDefault();
      const pixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 33 : event.deltaY;
      // Up on the wheel is positive in HID and negative in the browser.
      wheel -= pixels / NOTCH;
      schedule();
    };
    const onKey = (event: KeyboardEvent) => {
      if (!capturedRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      // Esc belongs to the PC: it hands the pointer back.
      if (event.code === "Escape") {
        if (event.type === "keydown") document.exitPointerLock();
        return;
      }
      // The phone repeats a held key itself.
      if (event.repeat) return;
      const down = event.type === "keydown";
      const modifier = MODIFIERS[event.code];
      if (modifier) {
        modifiers = down ? modifiers | modifier : modifiers & ~modifier;
      } else {
        const usage = USAGES[event.code];
        if (!usage) return;
        keys = keys.filter((key) => key !== usage);
        if (down) keys.push(usage);
      }
      sendKeys();
    };
    const onBlur = () => {
      if (document.pointerLockElement) document.exitPointerLock();
      release();
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onButton);
    document.addEventListener("mouseup", onButton);
    document.addEventListener("wheel", onWheel, { passive: false });
    // Ahead of everything else, so the interface's own shortcuts stay quiet.
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onButton);
      document.removeEventListener("mouseup", onButton);
      document.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", onBlur);
      if (target.current && document.pointerLockElement === target.current) document.exitPointerLock();
      release();
      capturedRef.current = false;
      setCaptured(false);
    };
  }, [enabled, target]);

  return { captured, capture };
}

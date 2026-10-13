/**
 * One shared pointer listener that tells every glass surface where the light
 * is. Each registered element gets four custom properties, updated at most
 * once per frame:
 *
 *   --lg-x, --lg-y   pointer position relative to the element, in pixels
 *   --lg-angle       direction from the element's centre to the pointer
 *   --lg-near        0..1, how close the pointer is (1 = on the element)
 */

const surfaces = new Set<HTMLElement>();
let pointerX = -1;
let pointerY = -1;
let frame = 0;
let listening = false;

function update() {
  frame = 0;
  for (const element of surfaces) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const centreX = rect.left + rect.width / 2;
    const centreY = rect.top + rect.height / 2;
    const dx = pointerX - centreX;
    const dy = pointerY - centreY;

    // Distance from the element's edge, not its centre, so large and small
    // surfaces respond alike.
    const outsideX = Math.max(Math.abs(dx) - rect.width / 2, 0);
    const outsideY = Math.max(Math.abs(dy) - rect.height / 2, 0);
    const near = Math.max(0, 1 - Math.hypot(outsideX, outsideY) / 320);

    const style = element.style;
    style.setProperty("--lg-x", `${(pointerX - rect.left).toFixed(1)}px`);
    style.setProperty("--lg-y", `${(pointerY - rect.top).toFixed(1)}px`);
    style.setProperty("--lg-angle", `${(Math.atan2(dy, dx) * (180 / Math.PI) + 90).toFixed(1)}deg`);
    style.setProperty("--lg-near", near.toFixed(3));
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

function onPointerMove(event: PointerEvent) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  schedule();
}

function onPointerLeave() {
  for (const element of surfaces) element.style.setProperty("--lg-near", "0");
}

/** Starts lighting `element`; returns a function that stops. */
export function trackLight(element: HTMLElement): () => void {
  surfaces.add(element);
  if (!listening) {
    listening = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
  }
  if (pointerX >= 0) schedule();

  return () => {
    surfaces.delete(element);
    if (surfaces.size === 0 && listening) {
      listening = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", schedule, { capture: true });
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    }
  };
}

/** Home window, matching `tauri.conf.json`. */
export const HOME_SIZE = { width: 440, height: 640 };
export const HOME_MIN = { width: 380, height: 540 };

/**
 * While mirroring, the window may shrink to the phone. The standing minimum
 * is wider than a portrait picture, and that extra width becomes black bars
 * down both sides.
 */
export const MIRROR_MIN = { width: 260, height: 320 };

/** Caption height while a picture is showing. The title bar uses this exact height. */
export const MIRROR_BAR = 34;

/**
 * Hairline around the mirrored picture, on every side. Thin enough to read as
 * the bezel of a current iPhone, and no thicker.
 */
export const MIRROR_FRAME = 4;

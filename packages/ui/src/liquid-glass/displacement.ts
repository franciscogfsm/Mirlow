/**
 * Displacement maps for optical glass.
 *
 * A pane of glass is modelled as a rounded rectangle whose rim (the "bezel")
 * curves down to the surface it rests on. Light passing straight through the
 * flat middle is undisturbed; light passing through the curved rim is bent
 * towards the centre of the pane, following Snell's law. We bake that bend
 * into an image whose red and green channels hold the horizontal and vertical
 * offset for every pixel, which an SVG feDisplacementMap then applies to
 * whatever is behind the element.
 */

export interface GlassShape {
  /** Size of the pane in CSS pixels. */
  width: number;
  height: number;
  /** Corner radius in CSS pixels. */
  radius: number;
  /** Width of the curved rim in CSS pixels. */
  bezel: number;
}

const REFRACTIVE_INDEX = 1.5;
const PROFILE_SAMPLES = 256;

/**
 * How far a ray is shifted sideways at each point across the rim, from the
 * outer edge (index 0) to where the rim meets the flat middle (last index).
 * Values are normalised so the largest shift is 1.
 */
const rimProfile: Float32Array = (() => {
  const profile = new Float32Array(PROFILE_SAMPLES);
  let max = 0;
  for (let i = 0; i < PROFILE_SAMPLES; i++) {
    const t = (i + 0.5) / PROFILE_SAMPLES;
    // Surface height across the rim: a squircle, which meets the flat top
    // without a visible crease (a circular arc would leave one).
    const u = 1 - t;
    const height = Math.pow(1 - Math.pow(u, 4), 0.25);
    const slope = Math.pow(u, 3) / Math.pow(1 - Math.pow(u, 4), 0.75);
    // Vertical ray meeting a surface tilted by `slope`.
    const incidence = Math.atan(slope);
    const refraction = Math.asin(Math.sin(incidence) / REFRACTIVE_INDEX);
    // The ray then travels through the glass beneath that point.
    const shift = Math.tan(incidence - refraction) * (height + 0.35);
    profile[i] = shift;
    if (shift > max) max = shift;
  }
  for (let i = 0; i < PROFILE_SAMPLES; i++) profile[i] = profile[i]! / max;
  return profile;
})();

const cache = new Map<string, string>();
const CACHE_LIMIT = 48;

/**
 * Returns a data URL for the displacement map of `shape`. A value of 128 in a
 * channel means "no shift"; the map is meant to be used with a displacement
 * scale equal to twice the largest shift wanted, in pixels.
 */
export function createDisplacementMap(shape: GlassShape): string {
  const width = Math.max(1, Math.round(shape.width));
  const height = Math.max(1, Math.round(shape.height));
  const radius = Math.max(0, Math.min(shape.radius, width / 2, height / 2));
  const bezel = Math.max(1, Math.min(shape.bezel, width / 2, height / 2));
  const key = `${width}x${height}r${radius}b${bezel}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "";

  const image = context.createImageData(width, height);
  const data = image.data;
  const halfW = width / 2;
  const halfH = height / 2;
  const innerW = halfW - radius;
  const innerH = halfH - radius;

  for (let y = 0; y < height; y++) {
    const py = y + 0.5 - halfH;
    const signY = py < 0 ? -1 : 1;
    const qy = Math.abs(py) - innerH;

    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - halfW;
      const signX = px < 0 ? -1 : 1;
      const qx = Math.abs(px) - innerW;

      // Distance from the edge of the rounded rectangle, and the direction
      // pointing straight out of it.
      let depth: number;
      let outX: number;
      let outY: number;
      if (qx > 0 && qy > 0) {
        const length = Math.hypot(qx, qy);
        depth = radius - length;
        outX = (qx / length) * signX;
        outY = (qy / length) * signY;
      } else if (qx > qy) {
        depth = radius - qx;
        outX = signX;
        outY = 0;
      } else {
        depth = radius - qy;
        outX = 0;
        outY = signY;
      }

      let shift = 0;
      if (depth >= 0 && depth < bezel) {
        const index = Math.min(PROFILE_SAMPLES - 1, Math.floor((depth / bezel) * PROFILE_SAMPLES));
        shift = rimProfile[index]!;
      }

      // Rays bend towards the centre, so each pixel shows what lies further in.
      const offset = (y * width + x) * 4;
      data[offset] = Math.round(128 - outX * shift * 127);
      data[offset + 1] = Math.round(128 - outY * shift * 127);
      data[offset + 2] = 128;
      data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const url = canvas.toDataURL("image/png");

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, url);
  return url;
}

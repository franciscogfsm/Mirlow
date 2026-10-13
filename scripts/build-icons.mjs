// Draws the app icon at every size Windows asks for, from the mark itself.
//
//   node scripts/build-icons.mjs
//
// Each size is drawn on its own rather than scaled down from a large picture:
// the small ones, which are what the taskbar and the notification area show,
// get a heavier stroke and no edge highlight, so they stay sharp.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const icons = path.join(path.dirname(fileURLToPath(import.meta.url)), "../apps/desktop/src-tauri/icons");

function svg(size) {
  const small = size <= 32;
  const inset = small ? 0 : 1.25;
  const side = 32 - inset * 2;
  const edge = small
    ? ""
    : `<rect x="${inset + 0.2}" y="${inset + 0.2}" width="${side - 0.4}" height="${side - 0.4}" rx="7.3" fill="none" stroke="#fff" stroke-opacity="0.26" stroke-width="0.5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <rect x="${inset}" y="${inset}" width="${side}" height="${side}" rx="7.5" fill="#0a0a0a"/>${edge}
  <path d="M8.5 22V14.2a3.75 3.75 0 0 1 7.5 0v4.9M16 14.2a3.75 3.75 0 0 1 7.5 0V22" fill="none" stroke="#fff" stroke-width="${small ? 3.3 : 2.9}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

const png = (size) => sharp(Buffer.from(svg(size))).png().toBuffer();

/** An .ico holding one PNG per size, which Windows has read since Vista. */
function ico(entries) {
  const header = Buffer.alloc(6 + 16 * entries.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = header.length;
  entries.forEach(({ size, data }, at) => {
    const entry = 6 + 16 * at;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...entries.map((each) => each.data)]);
}

const files = { "32x32.png": 32, "128x128.png": 128, "128x128@2x.png": 256, "icon.png": 512 };
for (const [name, size] of Object.entries(files)) writeFileSync(path.join(icons, name), await png(size));

const sizes = [16, 20, 24, 32, 40, 48, 64, 256];
const entries = await Promise.all(sizes.map(async (size) => ({ size, data: await png(size) })));
writeFileSync(path.join(icons, "icon.ico"), ico(entries));
console.log(`icons written to ${icons}`);

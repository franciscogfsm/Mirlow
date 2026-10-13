// Draws the app icon at every size Windows asks for, and the setup wizard's
// artwork, from the mark itself.
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
// --- Installer artwork --------------------------------------------------------
// The setup wizard shows two bitmaps: a tall one beside the first and last
// pages, and a small one in the header of the pages between. Both are drawn at
// twice the size the wizard asks for, so they stay sharp on dense screens.

const mark = (x, y, size, colour) =>
  `<g transform="translate(${x} ${y}) scale(${size / 32})"><path d="M8.5 22V14.2a3.75 3.75 0 0 1 7.5 0v4.9M16 14.2a3.75 3.75 0 0 1 7.5 0V22" fill="none" stroke="${colour}" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/></g>`;

const sidebar = `<svg xmlns="http://www.w3.org/2000/svg" width="328" height="628">
  <defs><radialGradient id="light" cx="0.2" cy="0.08" r="0.9"><stop offset="0" stop-color="#3a3a3a"/><stop offset="0.55" stop-color="#151515"/><stop offset="1" stop-color="#0a0a0a"/></radialGradient></defs>
  <rect width="328" height="628" fill="url(#light)"/>
  ${mark(84, 214, 160, "#fff")}
</svg>`;

const header = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="114">
  <rect width="300" height="114" fill="#fff"/>
  <rect x="113" y="20" width="74" height="74" rx="17.5" fill="#0a0a0a"/>
  ${mark(113, 20, 74, "#fff")}
</svg>`;

/** A 24-bit .bmp, the only picture format the wizard reads. */
async function bmp(source) {
  const { data, info } = await sharp(Buffer.from(source)).flatten({ background: "#fff" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const row = Math.ceil((info.width * 3) / 4) * 4;
  const out = Buffer.alloc(54 + row * info.height);
  out.write("BM");
  out.writeUInt32LE(out.length, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14);
  out.writeInt32LE(info.width, 18);
  out.writeInt32LE(info.height, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(24, 28);
  out.writeUInt32LE(row * info.height, 34);
  for (let y = 0; y < info.height; y++) {
    const to = 54 + (info.height - 1 - y) * row;
    for (let x = 0; x < info.width; x++) {
      const from = (y * info.width + x) * 3;
      out[to + x * 3] = data[from + 2];
      out[to + x * 3 + 1] = data[from + 1];
      out[to + x * 3 + 2] = data[from];
    }
  }
  return out;
}

const installer = path.join(icons, "../windows");
writeFileSync(path.join(installer, "installer-sidebar.bmp"), await bmp(sidebar));
writeFileSync(path.join(installer, "installer-header.bmp"), await bmp(header));

console.log(`icons written to ${icons}, installer artwork to ${installer}`);

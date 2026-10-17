// node render.mjs snap 1.2 5 9 ...   -> PNG stills
// node render.mjs video out.mp4 [fps] -> frames piped into ffmpeg
import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

const [mode, ...args] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--force-color-profile=srgb", "--hide-scrollbars", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve("index.html")).href, { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);
page.on("console", (m) => console.log("page:", m.text()));
page.on("pageerror", (e) => console.log("ERR:", e.message));

if (mode === "snap") {
  for (const t of args.map(Number)) {
    await page.evaluate((t) => window.seek(t), t);
    await page.screenshot({ path: `snap-${t.toFixed(2)}.png` });
  }
} else {
  const out = args[0], fps = Number(args[1] ?? 60);
  const dur = await page.evaluate(() => window.DURATION);
  const n = Math.round(dur * fps);
  const ff = spawn("ffmpeg", ["-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "ignore", "inherit"] });
  const cdp = await page.createCDPSession();
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.seek(t), i / fps);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 120 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
}
await browser.close();

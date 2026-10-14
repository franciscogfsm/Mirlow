// Runs the Tauri CLI with MSYS2's UCRT64 tools first on PATH.
//
// The GNU Rust toolchain compiles C dependencies (ring, through the updater)
// with MSYS2's gcc. Its compiler loads its DLLs from PATH, so another MinGW
// earlier on PATH (Git for Windows adds one) makes it fail without a message.
// Set MSYS_ROOT if MSYS2 is not installed in C:\msys64.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const env = { ...process.env };
const msysBin = path.join(process.env.MSYS_ROOT ?? "C:\\msys64", "ucrt64", "bin");
if (process.platform === "win32" && existsSync(msysBin)) {
  const key = Object.keys(env).find((name) => name.toUpperCase() === "PATH") ?? "Path";
  env[key] = `${msysBin}${path.delimiter}${env[key] ?? ""}`;
}

const cli = createRequire(import.meta.url).resolve("@tauri-apps/cli/tauri.js");
const { status } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});
process.exit(status ?? 1);

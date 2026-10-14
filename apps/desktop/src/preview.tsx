/**
 * Development only: renders the interface in an ordinary browser, with the
 * backend replaced by canned answers, so each state can be looked at (and
 * screenshotted) without a phone or even the engine. It is not part of the
 * production build, which only includes index.html.
 *
 *   npm run dev -w @mirlow/desktop
 *   http://127.0.0.1:5183/preview.html?phase=ready&theme=dark&lang=pt&sheet=settings
 *
 * phase: starting | ready | connecting | mirroring | audio | recovering | error
 * (With `mirroring` the stage stays empty: the picture is a native window
 * that only exists inside the real app.)
 */
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import type { AndroidStatus, Diagnostics, Phase, Settings, Status } from "./lib/api";
import "./styles.css";

const params = new URLSearchParams(location.search);
const phase = (params.get("phase") ?? "ready") as Phase;

let settings: Settings = {
  name: params.get("name") ?? "LIVING-ROOM-PC",
  sound: true,
  compatibility: false,
  theme: (params.get("theme") ?? "system") as Settings["theme"],
  language: (params.get("lang") ?? "system") as Settings["language"],
};

const status: Status = {
  phase,
  name: settings.name,
  client:
    phase === "connecting" || phase === "audio" || phase === "mirroring"
      ? { name: "Ana's iPhone", model: "iPhone16,1" }
      : null,
  video: phase === "mirroring" ? { width: 1170, height: 2532 } : null,
  error: phase === "error" ? "crashed" : null,
  softwareDecoding: false,
};

const diagnostics: Diagnostics = {
  firewallAllowed: params.get("firewall") === "ok",
  // preview.html?wifi=off shows a PC with its Wi-Fi switched off, and so no network.
  network:
    params.get("wifi") === "off"
      ? null
      : { name: "Home Wi-Fi", category: params.get("network") === "public" ? "public" : "private" },
  wifiOff: params.get("wifi") === "off",
  android: (params.get("android") as AndroidStatus | null) ?? "listening",
};

mockWindows("main");
mockIPC((command, payload) => {
  switch (command) {
    case "get_status":
      return status;
    case "get_settings":
      return settings;
    case "update_settings":
      settings = (payload as { settings: Settings }).settings;
      return settings;
    case "get_diagnostics":
      return diagnostics;
    case "get_engine_log":
      return "UxPlay 1.74: An Open-Source AirPlay mirroring and audio-streaming server.\n[mirlow] the engine exited unexpectedly";
    case "check_update":
      return params.get("update") ? { version: params.get("update") } : null;
    case "install_update":
      return new Promise((_, reject) => setTimeout(() => reject("offline"), 2000));
    case "fix_all":
      return new Promise((resolve) =>
        setTimeout(() => {
          diagnostics.firewallAllowed = true;
          diagnostics.wifiOff = false;
          diagnostics.network = { name: "Home Wi-Fi", category: "private" };
          if (diagnostics.android === "needsFeature" || diagnostics.android === "wifiOff") {
            diagnostics.android = "listening";
          }
          resolve(diagnostics);
        }, 1500),
      );
    case "plugin:app|version":
      return "0.1.0";
    case "plugin:window|is_fullscreen":
    case "plugin:window|is_maximized":
      return false;
    default:
      return null;
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Open a sheet straight away when asked to, for screenshots.
const sheet = params.get("sheet");
if (sheet) {
  window.setTimeout(() => {
    if (sheet === "settings") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: ",", ctrlKey: true }));
    } else {
      document.querySelector<HTMLButtonElement>("button[data-help]")?.click();
    }
  }, 600);
}

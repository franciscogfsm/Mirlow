import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Mirrors `engine::Phase` in the Rust backend. */
export type Phase =
  | "starting"
  | "ready"
  | "connecting"
  | "mirroring"
  | "audio"
  | "recovering"
  | "error";

export type ErrorKind = "engineMissing" | "discovery" | "crashed" | "unknown";

export interface Client {
  name: string;
  model: string;
}

export interface VideoSize {
  width: number;
  height: number;
}

export interface Status {
  phase: Phase;
  name: string;
  client: Client | null;
  video: VideoSize | null;
  error: ErrorKind | null;
  softwareDecoding: boolean;
}

export type ThemeSetting = "system" | "light" | "dark";
export type LanguageSetting = "system" | "en" | "pt";

export interface Settings {
  name: string;
  sound: boolean;
  compatibility: boolean;
  theme: ThemeSetting;
  language: LanguageSetting;
}

/** Mirrors `miracast::AndroidStatus` in the Rust backend. */
export type AndroidStatus =
  | "starting"
  | "listening"
  | "needsFeature"
  | "wifiOff"
  | "unsupported"
  | "disabled";

export interface Diagnostics {
  firewallAllowed: boolean;
  network: { name: string; category: "public" | "private" | "domain" } | null;
  /** The PC has Wi-Fi and it is switched off. */
  wifiOff: boolean;
  android: AndroidStatus;
}

/** A rectangle in physical pixels, relative to the window's client area. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const api = {
  getStatus: () => invoke<Status>("get_status"),
  onStatus: (handler: (status: Status) => void): Promise<UnlistenFn> =>
    listen<Status>("engine:status", (event) => handler(event.payload)),
  getSettings: () => invoke<Settings>("get_settings"),
  updateSettings: (settings: Settings) => invoke<Settings>("update_settings", { settings }),
  restartEngine: () => invoke<void>("restart_engine"),
  getEngineLog: () => invoke<string>("get_engine_log"),
  getDiagnostics: () => invoke<Diagnostics>("get_diagnostics"),
  fixAll: () => invoke<Diagnostics>("fix_all"),
  openNetworkSettings: () => invoke<void>("open_network_settings"),
  openWindowsSettings: (page: "ms-settings:optionalfeatures" | "ms-settings:project") =>
    invoke<void>("open_windows_settings", { page }),
  setTrayText: (text: { status: string; open: string; quit: string }) =>
    invoke<void>("set_tray_text", text),
  layoutVideo: (rect: Rect, visible: boolean, radius: number) =>
    invoke<void>("layout_video", { rect, visible, radius }),
};

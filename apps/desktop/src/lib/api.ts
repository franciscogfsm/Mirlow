import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/** Mirrors `engine::Phase` in the Rust backend. */
export type Phase =
  | "starting"
  | "ready"
  | "connecting"
  | "mirroring"
  | "paused"
  | "audio"
  | "recovering"
  | "error";

export type ErrorKind = "engineMissing" | "discovery" | "crashed" | "unknown";

export interface Client {
  name: string;
  model: string;
  /** A code to type on the device to let it connect, while it waits for one. */
  pin: string | null;
  /** The picture takes the mouse and keyboard itself (an Android phone over Wi-Fi). */
  direct?: boolean;
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
  /** The device is sending sound that can be heard. */
  sound: boolean;
  /** The device's screen went to sleep (it was locked); the picture is paused until it wakes. */
  locked: boolean;
}

export type ThemeSetting = "system" | "light" | "dark";
export type LanguageSetting = "system" | "en" | "pt";

export interface Settings {
  name: string;
  sound: boolean;
  compatibility: boolean;
  theme: ThemeSetting;
  language: LanguageSetting;
  /** Offer this PC to the phone as a Bluetooth mouse and keyboard. */
  control: boolean;
  /** How far the phone's pointer goes for a move of the mouse, 1 to 10. */
  pointerSpeed: number;
  /** Look for Android phones paired for mirroring over Wi-Fi. Switched with `androidEnable`. */
  androidWifi: boolean;
}

/** An Android phone connected over Wi-Fi, ready to mirror. Mirrors `scrcpy::Phone`. */
export interface Phone {
  serial: string;
  name: string;
}

/** A QR code: `size` rows of `size` modules, "1" dark and "0" light. */
export interface Qr {
  size: number;
  modules: string;
}

/** Mirrors `scrcpy::Pairing`. */
export type Pairing =
  | { state: "idle" }
  | { state: "waiting"; qr: Qr }
  | { state: "searching" }
  | { state: "pairing" }
  | { state: "paired" }
  | { state: "refused" }
  | { state: "notFound" };

/** Android over Wi-Fi, as `scrcpy::Link` reports it. */
export interface AndroidLink {
  enabled: boolean;
  available: boolean;
  phones: Phone[];
  pairing: Pairing;
  mirroring: string | null;
}

/** Mirrors `remote::RemoteState` in the Rust backend. */
export type RemoteState =
  | "off"
  | "starting"
  | "noBluetooth"
  | "bluetoothOff"
  | "unsupported"
  | "waiting"
  | "connected";

/** Mirrors `remote::Support`: whether this PC can be a Bluetooth mouse and keyboard at all. */
export type Support = "checking" | "supported" | "bluetoothOff" | "noBluetooth" | "unsupported";

export interface RemoteStatus {
  state: RemoteState;
  /** Found out on its own, whether or not the feature is on. */
  support: Support;
  /** The connected device's Bluetooth name. */
  host: string | null;
  /** The name this PC goes by in the phone's Bluetooth list. */
  pcName: string;
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
  checkUpdate: () => invoke<{ version: string } | null>("check_update"),
  installUpdate: () => invoke<void>("install_update"),
  onUpdateProgress: (handler: (progress: { downloaded: number; total: number | null }) => void) =>
    listen<{ downloaded: number; total: number | null }>("update:progress", (event) =>
      handler(event.payload),
    ),
  openNetworkSettings: () => invoke<void>("open_network_settings"),
  getAndroidLink: () => invoke<AndroidLink>("get_android_link"),
  onAndroidLink: (handler: (link: AndroidLink) => void): Promise<UnlistenFn> =>
    listen<AndroidLink>("android:link", (event) => handler(event.payload)),
  androidEnable: (enabled: boolean) => invoke<void>("android_enable", { enabled }),
  /** Shows a QR code for the phone to scan; the link reports how pairing goes. */
  androidPair: () => invoke<void>("android_pair"),
  androidPairCode: (code: string) => invoke<void>("android_pair_code", { code }),
  androidCancelPairing: () => invoke<void>("android_cancel_pairing"),
  androidMirror: (serial: string) => invoke<void>("android_mirror", { serial }),
  getRemoteStatus: () => invoke<RemoteStatus>("get_remote_status"),
  onRemoteStatus: (handler: (status: RemoteStatus) => void): Promise<UnlistenFn> =>
    listen<RemoteStatus>("remote:status", (event) => handler(event.payload)),
  /** The picture has taken the pointer, or let it go; the backend reads the mouse itself meanwhile. */
  remoteCapture: (captured: boolean, scale: number, zoom: boolean) =>
    invoke<void>("remote_capture", { captured, scale, zoom }),
  /** The picture lost the pointer by accident: may it take it back? Brings Mirlow forward if so. */
  resumeCapture: () => invoke<boolean>("resume_capture"),
  openWindowsSettings: (
    page: "ms-settings:optionalfeatures" | "ms-settings:project" | "ms-settings:bluetooth",
  ) =>
    invoke<void>("open_windows_settings", { page }),
  /** Shows the window in front of everything, as Mirlow opens. */
  reveal: () => invoke<void>("reveal"),
  setTrayText: (text: { status: string; open: string; quit: string }) =>
    invoke<void>("set_tray_text", text),
  layoutVideo: (rect: Rect, visible: boolean, radius: number) =>
    invoke<void>("layout_video", { rect, visible, radius }),
};

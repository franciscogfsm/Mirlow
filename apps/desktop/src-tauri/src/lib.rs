mod awake;
mod diagnostics;
mod engine;
mod letterbox;
mod miracast;
mod remote;
mod scrcpy;
mod settings;
mod tray;
mod updater;
mod video;

use engine::{Engine, Status};
use miracast::Miracast;
use remote::Remote;
use scrcpy::Scrcpy;
use settings::Settings;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, RunEvent, State};

struct AppState {
    settings: Arc<Mutex<Settings>>,
    config_dir: PathBuf,
    engine_dir: PathBuf,
}

#[tauri::command]
fn get_status(engine: State<'_, Engine>) -> Status {
    engine.status()
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

/// Saves new settings. The engine is restarted only if a setting it reads at
/// launch (name, sound, decoding, live picture for mouse and keyboard) changed.
#[tauri::command]
fn update_settings(
    settings: Settings,
    state: State<'_, AppState>,
    engine: State<'_, Engine>,
    miracast: State<'_, Miracast>,
    remote: State<'_, Remote>,
) -> Result<Settings, String> {
    let mut next = settings.normalized();
    let restart = {
        let mut current = state.settings.lock().unwrap();
        // Android over Wi-Fi is switched by its own commands, which pairing
        // also uses; settings sent from before a pairing must not undo it.
        next.android_wifi = current.android_wifi;
        let restart = current.name != next.name
            || current.sound != next.sound
            || current.compatibility != next.compatibility
            || current.control != next.control;
        remote.enable(next.control);
        *current = next.clone();
        restart
    };
    next.save(&state.config_dir).map_err(|error| error.to_string())?;
    if restart {
        engine.restart();
        miracast.refresh();
    }
    Ok(next)
}

#[tauri::command]
fn restart_engine(app: AppHandle, engine: State<'_, Engine>) {
    miracast::disconnect(&app);
    scrcpy::stop(&app);
    engine.restart();
}

#[tauri::command]
fn get_android_link(scrcpy: State<'_, Scrcpy>) -> scrcpy::Link {
    scrcpy.link()
}

/// Turns Android over Wi-Fi on or off, and saves that.
fn set_android_wifi(state: &AppState, scrcpy: &Scrcpy, enabled: bool) {
    let saved = {
        let mut settings = state.settings.lock().unwrap();
        if settings.android_wifi == enabled {
            None
        } else {
            settings.android_wifi = enabled;
            Some(settings.clone())
        }
    };
    if let Some(settings) = saved {
        let _ = settings.save(&state.config_dir);
        scrcpy.enable(enabled);
    }
}

#[tauri::command]
fn android_enable(enabled: bool, state: State<'_, AppState>, scrcpy: State<'_, Scrcpy>) {
    set_android_wifi(&state, &scrcpy, enabled);
}

/// Shows a QR code for an Android phone to scan, and pairs with it.
#[tauri::command]
fn android_pair(state: State<'_, AppState>, scrcpy: State<'_, Scrcpy>) {
    set_android_wifi(&state, &scrcpy, true);
    scrcpy.pair();
}

/// Pairs with the Android phone showing `code`.
#[tauri::command]
fn android_pair_code(code: String, state: State<'_, AppState>, scrcpy: State<'_, Scrcpy>) {
    set_android_wifi(&state, &scrcpy, true);
    scrcpy.pair_with_code(code);
}

#[tauri::command]
fn android_cancel_pairing(scrcpy: State<'_, Scrcpy>) {
    scrcpy.cancel_pairing();
}

/// Mirrors the paired Android phone connected as `serial`.
#[tauri::command]
fn android_mirror(serial: String, scrcpy: State<'_, Scrcpy>) -> Result<(), String> {
    scrcpy.mirror(&serial)
}

#[tauri::command]
fn get_remote_status(remote: State<'_, Remote>) -> remote::RemoteStatus {
    remote.status()
}

/// The picture has taken the pointer, or let it go. While it has it, the
/// mouse goes to the phone, its movement multiplied by `scale`.
#[tauri::command]
fn remote_capture(captured: bool, scale: f64, apple: bool, remote: State<'_, Remote>) {
    remote.capture(captured, scale, apple);
}

/// Called when the picture lost the pointer without being asked to (the
/// phone turned, and the engine's new picture took the focus for a moment).
/// True when it may take it back: Esc was not pressed, and the focus is with
/// Mirlow or the engine, not another app. Brings Mirlow forward if need be.
#[tauri::command]
fn resume_capture(app: AppHandle, engine: State<'_, Engine>, remote: State<'_, Remote>) -> bool {
    if remote.escaped_within(std::time::Duration::from_secs(2)) {
        return false;
    }
    #[cfg(windows)]
    {
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId};
        let mut owner = 0u32;
        // SAFETY: plain queries; the id is written into a local.
        unsafe { GetWindowThreadProcessId(GetForegroundWindow(), Some(&mut owner)) };
        let engine_pid = engine.pid();
        if owner == 0 || (owner != std::process::id() && owner != engine_pid) {
            return false;
        }
        if owner == engine_pid {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }
        true
    }
    #[cfg(not(windows))]
    {
        let _ = (app, engine);
        false
    }
}

#[tauri::command]
fn get_engine_log(engine: State<'_, Engine>) -> String {
    engine.log()
}

/// The programs that receive a phone, and so must get through the firewall:
/// the engine for AirPlay, and the app itself for Miracast.
fn receivers(app: &AppHandle) -> Vec<PathBuf> {
    let mut programs = vec![app.state::<AppState>().engine_dir.join("bin").join("mirlow-engine.exe")];
    programs.extend(std::env::current_exe().ok());
    // Firewall rules hold plain paths; a "\\?\C:\..." one would never match.
    programs
        .into_iter()
        .map(|path| match path.to_str().and_then(|text| text.strip_prefix(r"\\?\")) {
            Some(plain) if !plain.starts_with("UNC\\") => PathBuf::from(plain),
            _ => path,
        })
        .collect()
}

#[tauri::command]
async fn get_diagnostics(app: AppHandle) -> diagnostics::Diagnostics {
    diagnostics::collect(app.state::<Miracast>().status(), &receivers(&app))
}

/// Puts right everything that stops a phone from finding this PC: switches
/// the Wi-Fi on, then, behind one Windows permission prompt, lets Mirlow
/// through the firewall, makes a public network private and installs
/// Wireless Display for Android. Returns what things look like afterwards.
#[tauri::command]
async fn fix_all(app: AppHandle) -> diagnostics::Diagnostics {
    use miracast::AndroidStatus;
    let programs = receivers(&app);
    let miracast = app.state::<Miracast>();
    let before = diagnostics::collect(miracast.status(), &programs);

    if before.wifi_off || before.android == AndroidStatus::WifiOff {
        diagnostics::turn_on_wifi();
    }
    let fixes = diagnostics::Fixes {
        firewall: if before.firewall_allowed { &[] } else { &programs },
        private_network: before.network.as_ref().is_some_and(|network| network.category == "public"),
        wireless_display: before.android == AndroidStatus::NeedsFeature,
    };
    if fixes.any() && diagnostics::fix(&fixes) && !fixes.firewall.is_empty() {
        app.state::<Engine>().restart();
    }

    miracast.retry();
    // Listening again takes a moment; wait for the answer, within reason.
    for _ in 0..50 {
        if miracast.status() != AndroidStatus::Starting {
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    diagnostics::collect(miracast.status(), &programs)
}

#[tauri::command]
fn open_network_settings() {
    diagnostics::open_network_settings();
}

/// Opens a page of Windows Settings the help sheet points to.
#[tauri::command]
fn open_windows_settings(page: &str) {
    const PAGES: [&str; 3] = ["ms-settings:optionalfeatures", "ms-settings:project", "ms-settings:bluetooth"];
    if PAGES.contains(&page) {
        diagnostics::open_settings(page);
    }
}

/// Tells the native video window where the interface wants the picture.
#[tauri::command]
fn layout_video(app: AppHandle, rect: video::Rect, visible: bool, radius: i32) {
    video::layout(&app, rect, radius, visible);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// Notes why Mirlow stopped, should anything panic. A release build stops at
/// once when something does, and would otherwise leave no trace of why.
fn note_panics() {
    let Some(dir) = std::env::var_os("LOCALAPPDATA").map(|dir| PathBuf::from(dir).join("app.mirlow.desktop")) else {
        return;
    };
    let previous = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let seconds = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |since| since.as_secs());
        let thread = std::thread::current().name().unwrap_or("unnamed").to_string();
        let line = format!("{seconds} Mirlow {} [{thread}] {info}\n", env!("CARGO_PKG_VERSION"));
        let _ = std::fs::create_dir_all(&dir);
        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("crash.log")) {
            use std::io::Write;
            let _ = file.write_all(line.as_bytes());
        }
        previous(info);
    }));
}

pub fn run() {
    note_panics();
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Opening Mirlow again (from the desktop icon, say) brings back the
            // one that is already running.
            tray::reveal_window(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(video::Video::default())
        // Closing the window keeps Mirlow running in the notification area, so
        // the PC stays discoverable. Quitting is done from the tray menu.
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_status,
            get_settings,
            update_settings,
            restart_engine,
            get_android_link,
            android_enable,
            android_pair,
            android_pair_code,
            android_cancel_pairing,
            android_mirror,
            get_engine_log,
            get_remote_status,
            remote_capture,
            resume_capture,
            get_diagnostics,
            fix_all,
            open_network_settings,
            open_windows_settings,
            layout_video,
            tray::set_tray_text,
            tray::reveal,
            updater::check_update,
            updater::install_update,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let config_dir = app.path().app_config_dir()?;
            let data_dir = app.path().app_local_data_dir()?;
            let resource_dir = app.path().resource_dir().ok();
            let engine_dir = engine::locate(resource_dir.as_deref());

            let settings = Arc::new(Mutex::new(Settings::load(&config_dir)));
            app.manage(AppState {
                settings: settings.clone(),
                config_dir,
                engine_dir: engine_dir.clone(),
            });
            let engine = Engine::start(handle.clone(), engine_dir, data_dir, settings.clone());
            let control = settings.lock().unwrap().control;
            app.manage(Remote::start(handle.clone(), engine.clone(), control));
            awake::start(engine.clone());
            let scrcpy_dir = scrcpy::locate(resource_dir.as_deref());
            app.manage(Scrcpy::start(handle.clone(), engine.clone(), settings.clone(), scrcpy_dir));
            app.manage(Miracast::start(handle, settings, engine.clone()));
            app.manage(engine);
            tray::create(app.handle())?;
            // The interface shows the window when it is ready. Should it
            // never be, the window still appears rather than staying hidden.
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(5));
                let hidden = handle
                    .get_webview_window("main")
                    .is_some_and(|window| !window.is_visible().unwrap_or(true));
                if hidden {
                    tray::reveal_window(&handle);
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the Mirlow application");

    app.run(|app, event| {
        if let RunEvent::Exit = event {
            app.state::<Remote>().shutdown();
            app.state::<Scrcpy>().shutdown();
            app.state::<Miracast>().shutdown();
            app.state::<Engine>().shutdown();
        }
    });
}

mod diagnostics;
mod engine;
mod miracast;
mod settings;
mod tray;
mod video;

use engine::{Engine, Status};
use miracast::Miracast;
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
/// launch (name, sound, decoding) changed.
#[tauri::command]
fn update_settings(
    settings: Settings,
    state: State<'_, AppState>,
    engine: State<'_, Engine>,
    miracast: State<'_, Miracast>,
) -> Result<Settings, String> {
    let next = settings.normalized();
    let restart = {
        let mut current = state.settings.lock().unwrap();
        let restart = current.name != next.name
            || current.sound != next.sound
            || current.compatibility != next.compatibility;
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
    engine.restart();
}

#[tauri::command]
fn get_engine_log(engine: State<'_, Engine>) -> String {
    engine.log()
}

#[tauri::command]
async fn get_diagnostics() -> diagnostics::Diagnostics {
    diagnostics::collect()
}

/// Asks Windows (with its permission prompt) to let the engine through the
/// firewall, then restarts the engine so it announces itself again.
#[tauri::command]
async fn allow_firewall(app: AppHandle) -> bool {
    let exe = app.state::<AppState>().engine_dir.join("bin").join("mirlow-engine.exe");
    let allowed = diagnostics::allow_firewall(&exe);
    if allowed {
        app.state::<Engine>().restart();
    }
    allowed
}

#[tauri::command]
fn open_network_settings() {
    diagnostics::open_network_settings();
}

/// Tells the native video window where the interface wants the picture.
#[tauri::command]
fn layout_video(app: AppHandle, rect: video::Rect, visible: bool, radius: i32) {
    video::layout(&app, rect, radius, visible);
}

/// Rounds the window's bottom corners while a picture fills it (0 to undo).
#[tauri::command]
fn shape_window(app: AppHandle, radius: i32) {
    video::shape_window(&app, radius);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Opening Mirlow again (from the desktop icon, say) brings back the
            // one that is already running.
            tray::show_window(app);
        }))
        .plugin(tauri_plugin_opener::init())
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
            get_engine_log,
            get_diagnostics,
            allow_firewall,
            open_network_settings,
            layout_video,
            shape_window,
            tray::set_tray_text,
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
            app.manage(Miracast::start(handle, settings, engine.clone()));
            app.manage(engine);
            tray::create(app.handle())?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the Mirlow application");

    app.run(|app, event| {
        if let RunEvent::Exit = event {
            app.state::<Miracast>().shutdown();
            app.state::<Engine>().shutdown();
        }
    });
}

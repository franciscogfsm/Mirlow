//! The notification-area icon. Mirlow is the kind of app you leave running:
//! closing its window tucks it away here, where it keeps the PC discoverable,
//! and it comes back with a click or as soon as a device starts mirroring.

use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, State, Wry};

const TRAY_ID: &str = "mirlow";

pub struct Tray {
    open: MenuItem<Wry>,
    quit: MenuItem<Wry>,
    status: Mutex<MenuItem<Wry>>,
}

/// Brings the main window back, wherever it was.
pub fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Shows the main window in front of everything, as Mirlow opens. Windows
/// lets a newly started program open its window behind the one in use, where
/// it looks as if Mirlow only went to the notification area; being on top for
/// a moment puts it where it can be seen.
pub fn reveal_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_always_on_top(true);
        let _ = window.set_focus();
        let _ = window.set_always_on_top(false);
    }
}

/// Shows the main window as Mirlow opens. The interface does it once it has
/// something to show; this is for when it never does.
#[tauri::command]
pub fn reveal(app: AppHandle) {
    reveal_window(&app);
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    // Placeholder text; the interface replaces it with the user's language
    // as soon as it loads (see `set_tray_text`).
    let status = MenuItem::with_id(app, "status", "Mirlow", false, None::<&str>)?;
    let open = MenuItem::with_id(app, "open", "Open Mirlow", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&status, &open, &quit])?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("Mirlow")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;

    app.manage(Tray { open, quit, status: Mutex::new(status) });
    Ok(())
}

/// Sets the tray's wording. Called by the interface, which owns translations
/// and knows what the receiver is doing.
#[tauri::command]
pub fn set_tray_text(app: AppHandle, tray: State<'_, Tray>, status: String, open: String, quit: String) {
    let _ = tray.status.lock().unwrap().set_text(&status);
    let _ = tray.open.set_text(&open);
    let _ = tray.quit.set_text(&quit);
    if let Some(icon) = app.tray_by_id(TRAY_ID) {
        let _ = icon.set_tooltip(Some(format!("Mirlow: {status}")));
    }
}

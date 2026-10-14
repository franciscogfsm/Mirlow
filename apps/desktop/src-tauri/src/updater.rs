//! Keeps Mirlow up to date from its GitHub releases.
//!
//! Each release carries a `latest.json` naming the newest version and its
//! installer, signed with a key only the maintainer holds; the public half is
//! in `tauri.conf.json`. An installer whose signature does not match is
//! refused, so a tampered download can never be installed.

use crate::engine::Engine;
use crate::miracast::Miracast;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Available {
    pub version: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    downloaded: usize,
    total: Option<u64>,
}

/// The newer version, if there is one. Being offline counts as "no".
#[tauri::command]
pub async fn check_update(app: AppHandle) -> Option<Available> {
    let update = app.updater().ok()?.check().await.ok()??;
    Some(Available { version: update.version })
}

/// Downloads the newer version, checks its signature, and installs it over
/// this one. Windows asks for permission once; the installer then reopens
/// Mirlow by itself. Progress is reported as `update:progress` events.
#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?
        .ok_or("Mirlow is already up to date.")?;

    let events = app.clone();
    let mut downloaded = 0;
    let bytes = update
        .download(
            move |chunk, total| {
                downloaded += chunk;
                let _ = events.emit("update:progress", Progress { downloaded, total });
            },
            || {},
        )
        .await
        .map_err(|error| error.to_string())?;

    // The installer replaces the engine, so it must not be running.
    app.state::<Miracast>().shutdown();
    app.state::<Engine>().shutdown();
    update.install(bytes).map_err(|error| error.to_string())?;
    app.restart();
}

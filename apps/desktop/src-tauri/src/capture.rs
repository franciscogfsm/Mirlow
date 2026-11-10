//! Screenshots and recordings of the mirrored picture.
//!
//! Whatever the phone, the picture is a window inside Mirlow's (see
//! [`crate::video`]), drawn by the AirPlay engine, Miracast or scrcpy. Rather
//! than reach into each of those, the picture is copied from the screen where
//! that window is, which looks the same whichever drew it. Its sound is the
//! PC's own output, recorded as it plays.
//!
//! Recordings are H.264 video and AAC sound in an MP4, encoded by Windows'
//! own Media Foundation (on the graphics card where there is one), so nothing
//! has to be bundled for it.
//!
//! shortcut: copying from the screen also copies whatever covers the picture,
//! so Mirlow keeps itself on top while it records; Windows.Graphics.Capture
//! would not need that, if it ever matters.

mod media;

pub use media::{Area, Picture};
use media::{fitted, name_in, platform, record, run_with_com};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

/// Sent when a recording has been saved, or could not be.
pub const EVENT: &str = "capture:recording";

/// What became of a recording.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "state")]
pub enum Recording {
    Started,
    Saved { path: String },
    Failed,
}

/// The recording in progress, if there is one.
#[derive(Default)]
pub struct Recorder {
    stop: Mutex<Option<Arc<AtomicBool>>>,
}

/// Saves what the picture shows now as a PNG in Pictures\Mirlow.
pub fn screenshot(app: &AppHandle) -> Result<PathBuf, String> {
    let area = crate::video::picture_on_screen(app).ok_or("Nothing is being mirrored.")?;
    let dir = app.path().picture_dir().map_err(|error| error.to_string())?.join("Mirlow");
    let path = name_in(&dir, "png")?;
    let (width, height) = (area.2, area.3);
    run_with_com(move || {
        let pixels = media::opaque(platform::Grabber::new(width, height)?.grab(area)?);
        platform::save_png(&path, width as u32, height as u32, &pixels)?;
        Ok(path)
    })
}

/// Starts recording the picture and the PC's sound into Videos\Mirlow, until
/// [`stop`] or the picture goes away.
pub fn start(app: &AppHandle) -> Result<(), String> {
    let recorder = app.state::<Recorder>();
    let mut current = recorder.stop.lock().unwrap();
    if current.is_some() {
        return Ok(());
    }
    let area = crate::video::picture_on_screen(app).ok_or("Nothing is being mirrored.")?;
    let dir = app.path().video_dir().map_err(|error| error.to_string())?.join("Mirlow");
    let path = name_in(&dir, "mp4")?;
    let stop = Arc::new(AtomicBool::new(false));
    *current = Some(stop.clone());
    drop(current);

    let (width, height) = fitted(area.2, area.3);
    let app = app.clone();
    let _ = app.emit(EVENT, Recording::Started);
    thread::spawn(move || {
        let source = {
            let app = app.clone();
            move || crate::video::picture_state(&app)
        };
        let result = {
            let _com = platform::Com::new();
            record(&path, width, height, source, &stop)
        };
        app.state::<Recorder>().stop.lock().unwrap().take();
        let _ = app.emit(
            EVENT,
            match result {
                Ok(()) => Recording::Saved { path: path.to_string_lossy().into_owned() },
                Err(error) => {
                    let _ = std::fs::remove_file(&path);
                    app.state::<crate::engine::Engine>().note(format!("recording failed: {error}"));
                    Recording::Failed
                }
            },
        );
    });
    Ok(())
}

/// Ends the recording; [`EVENT`] tells when it is saved.
pub fn stop(app: &AppHandle) {
    if let Some(stop) = app.state::<Recorder>().stop.lock().unwrap().as_ref() {
        stop.store(true, Ordering::SeqCst);
    }
}

pub fn recording(app: &AppHandle) -> bool {
    app.state::<Recorder>().stop.lock().unwrap().is_some()
}


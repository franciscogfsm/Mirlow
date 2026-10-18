//! Keeps the PC awake while a device is connected.
//!
//! Watching a phone on the PC involves no input on the PC, so Windows takes it
//! for idle: it turns the screen off after a few minutes (five, on many
//! laptops) and then goes to sleep, which drops the Wi-Fi and with it the
//! connection. While a screen is mirrored, the screen stays on and the PC
//! awake; while a device is connected without a picture (locked, or playing
//! sound), the PC stays awake and the screen may turn off as usual.

use crate::engine::{Engine, Phase};
use std::time::Duration;

/// How often the engine's state is looked at. A few seconds late is nothing
/// next to minutes before Windows would act.
const EVERY: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Need {
    Nothing,
    System,
    Display,
}

fn need(phase: Phase) -> Need {
    match phase {
        Phase::Mirroring => Need::Display,
        Phase::Connecting | Phase::Paused | Phase::Audio => Need::System,
        _ => Need::Nothing,
    }
}

/// Starts watching. The request belongs to the thread that made it, so one
/// thread makes them all, for as long as Mirlow runs.
pub fn start(engine: Engine) {
    let _ = std::thread::Builder::new().name("awake".into()).spawn(move || {
        let mut current = Need::Nothing;
        loop {
            let next = need(engine.status().phase);
            if next != current {
                platform::request(next);
                current = next;
            }
            std::thread::sleep(EVERY);
        }
    });
}

#[cfg(windows)]
mod platform {
    use super::Need;
    use windows::Win32::System::Power::{
        SetThreadExecutionState, ES_CONTINUOUS, ES_DISPLAY_REQUIRED, ES_SYSTEM_REQUIRED,
    };

    pub fn request(need: Need) {
        let flags = match need {
            Need::Nothing => ES_CONTINUOUS,
            Need::System => ES_CONTINUOUS | ES_SYSTEM_REQUIRED,
            Need::Display => ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED,
        };
        // SAFETY: a plain request with no pointers involved.
        unsafe { SetThreadExecutionState(flags) };
    }
}

#[cfg(not(windows))]
mod platform {
    pub fn request(_need: super::Need) {}
}

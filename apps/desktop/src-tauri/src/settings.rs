//! User settings, stored as a small JSON file in the app's config folder.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    /// The name this PC shows up as on the iPhone.
    pub name: String,
    /// Play the phone's audio on this PC.
    pub sound: bool,
    /// Decode video in software instead of on the GPU.
    pub compatibility: bool,
    /// "system", "light" or "dark".
    pub theme: String,
    /// "system", or a language code the interface is translated into.
    pub language: String,
    /// Offer this PC to the phone as a Bluetooth mouse and keyboard.
    pub control: bool,
    /// How far the phone's pointer goes for a move of the mouse, 1 to 10.
    /// At 5 it keeps pace with the PC's own cursor over the picture.
    pub pointer_speed: u8,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            name: default_name(),
            sound: true,
            compatibility: false,
            theme: "system".into(),
            language: "system".into(),
            control: false,
            pointer_speed: 5,
        }
    }
}

/// The computer's own name, which is what people expect to look for.
fn default_name() -> String {
    std::env::var("COMPUTERNAME")
        .ok()
        .map(|name| name.trim().to_string())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "Mirlow".into())
}

/// Receiver names travel in mDNS labels, which hold at most 63 bytes, and are
/// passed to the engine as a command-line value, so control characters and a
/// leading dash (which the engine would read as another option) are dropped.
pub fn sanitize_name(raw: &str) -> String {
    let cleaned: String = raw.chars().filter(|c| !c.is_control()).collect();
    let mut name = String::new();
    for c in cleaned.trim().trim_start_matches('-').trim_start().chars() {
        if name.len() + c.len_utf8() > 63 {
            break;
        }
        name.push(c);
    }
    let name = name.trim_end().to_string();
    if name.is_empty() {
        default_name()
    } else {
        name
    }
}

impl Settings {
    pub fn normalized(mut self) -> Self {
        self.name = sanitize_name(&self.name);
        if !matches!(self.theme.as_str(), "system" | "light" | "dark") {
            self.theme = "system".into();
        }
        if !matches!(self.language.as_str(), "system" | "en" | "pt") {
            self.language = "system".into();
        }
        self.pointer_speed = self.pointer_speed.clamp(1, 10);
        self
    }

    pub fn load(dir: &Path) -> Self {
        fs::read_to_string(file(dir))
            .ok()
            .and_then(|text| serde_json::from_str::<Settings>(&text).ok())
            .unwrap_or_default()
            .normalized()
    }

    pub fn save(&self, dir: &Path) -> std::io::Result<()> {
        fs::create_dir_all(dir)?;
        let text = serde_json::to_string_pretty(self).map_err(std::io::Error::other)?;
        fs::write(file(dir), text)
    }
}

fn file(dir: &Path) -> PathBuf {
    dir.join("settings.json")
}

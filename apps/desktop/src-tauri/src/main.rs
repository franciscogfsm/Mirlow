// Keep a console window from opening alongside the app in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mirlow_lib::run()
}

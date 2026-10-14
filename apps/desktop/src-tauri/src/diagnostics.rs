//! Answers "why can't my iPhone see this PC?" from what Windows can tell us:
//! whether the firewall lets the engine through, and what kind of network the
//! PC is on.

use crate::miracast::AndroidStatus;
use serde::Serialize;
use std::path::Path;
use std::process::Command;

/// Name of the Windows Firewall rule Mirlow manages (also created by the installer).
pub const FIREWALL_RULE: &str = "Mirlow";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Network {
    pub name: String,
    /// "public", "private" or "domain".
    pub category: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostics {
    /// Whether Mirlow's firewall rule exists.
    pub firewall_allowed: bool,
    /// The network the PC is connected to, if any.
    pub network: Option<Network>,
    /// Whether an Android phone can find this PC.
    pub android: AndroidStatus,
}

pub fn collect(android: AndroidStatus) -> Diagnostics {
    Diagnostics { firewall_allowed: firewall_rule_exists(), network: current_network(), android }
}

fn hidden(program: &str) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}

fn firewall_rule_exists() -> bool {
    // netsh exits with 0 when the rule exists and 1 when it does not, in every
    // display language.
    hidden("netsh")
        .args(["advfirewall", "firewall", "show", "rule"])
        .arg(format!("name={FIREWALL_RULE}"))
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn current_network() -> Option<Network> {
    let output = hidden("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-NetConnectionProfile | Select-Object Name, @{n='Category';e={[int]$_.NetworkCategory}} | ConvertTo-Json -Compress",
        ])
        .output()
        .ok()?;
    let value: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;
    let profiles = match value {
        serde_json::Value::Array(items) => items,
        single @ serde_json::Value::Object(_) => vec![single],
        _ => return None,
    };

    let mut networks: Vec<Network> = profiles
        .iter()
        .filter_map(|profile| {
            let category = match profile.get("Category")?.as_i64()? {
                0 => "public",
                1 => "private",
                _ => "domain",
            };
            Some(Network {
                name: profile.get("Name")?.as_str()?.to_string(),
                category: category.into(),
            })
        })
        .collect();
    // A public network is the one that needs pointing out.
    networks.sort_by_key(|network| network.category != "public");
    networks.into_iter().next()
}

/// Replaces every firewall rule for the engine and the app with ones that let
/// them in: the engine for AirPlay, the app for the Miracast connection an
/// Android phone opens. Windows asks the user for permission; returns whether
/// the rule was added.
pub fn allow_firewall(programs: &[&Path]) -> bool {
    // Removing existing rules first matters: if the Windows prompt was ever
    // dismissed, it left "block" rules behind, and those win over "allow".
    let script = programs
        .iter()
        .map(|program| {
            let exe = program.display();
            format!(
                "netsh advfirewall firewall delete rule name=all program=\"{exe}\" & \
                 netsh advfirewall firewall add rule name=\"{FIREWALL_RULE}\" dir=in action=allow \
                 program=\"{exe}\" enable=yes profile=any"
            )
        })
        .collect::<Vec<_>>()
        .join(" & ");
    run_elevated("cmd.exe", &format!("/d /c \"{script}\"")).is_some() && firewall_rule_exists()
}

/// Installs Windows' "Wireless Display" optional feature, which holds the
/// Miracast receiver Android phones connect to. Windows asks the user for
/// permission and downloads it from Windows Update; returns whether it worked.
pub fn install_wireless_display() -> bool {
    const SUCCESS: u32 = 0;
    const SUCCESS_REBOOT_REQUIRED: u32 = 3010;
    matches!(
        run_elevated(
            "dism.exe",
            "/Online /Add-Capability /CapabilityName:App.WirelessDisplay.Connect~~~~0.0.1.0 /NoRestart /Quiet",
        ),
        Some(SUCCESS | SUCCESS_REBOOT_REQUIRED)
    )
}

pub fn open_network_settings() {
    open_settings("ms-settings:network-status");
}

pub fn open_settings(page: &str) {
    let _ = hidden("cmd").args(["/d", "/c", "start", "", page]).spawn();
}

/// Runs a program with administrator rights and waits for it. Returns its exit
/// code, or `None` if it never ran (the user declined the permission prompt).
#[cfg(windows)]
fn run_elevated(program: &str, parameters: &str) -> Option<u32> {
    use windows::core::{w, HSTRING, PCWSTR};
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{GetExitCodeProcess, WaitForSingleObject, INFINITE};
    use windows::Win32::UI::Shell::{ShellExecuteExW, SEE_MASK_NOCLOSEPROCESS, SHELLEXECUTEINFOW};
    use windows::Win32::UI::WindowsAndMessaging::SW_HIDE;

    let program = HSTRING::from(program);
    let parameters = HSTRING::from(parameters);
    let mut info = SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_NOCLOSEPROCESS,
        lpVerb: w!("runas"),
        lpFile: PCWSTR(program.as_ptr()),
        lpParameters: PCWSTR(parameters.as_ptr()),
        nShow: SW_HIDE.0,
        ..Default::default()
    };
    unsafe {
        // Fails if the user declines the permission prompt.
        if ShellExecuteExW(&mut info).is_err() || info.hProcess.is_invalid() {
            return None;
        }
        WaitForSingleObject(info.hProcess, INFINITE);
        let mut code = 0u32;
        let _ = GetExitCodeProcess(info.hProcess, &mut code);
        let _ = CloseHandle(info.hProcess);
        Some(code)
    }
}

#[cfg(not(windows))]
fn run_elevated(_program: &str, _parameters: &str) -> Option<u32> {
    None
}

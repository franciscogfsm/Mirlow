//! Answers "why can't my iPhone see this PC?" from what Windows can tell us:
//! whether the firewall lets the engine through, and what kind of network the
//! PC is on.

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
}

pub fn collect() -> Diagnostics {
    Diagnostics { firewall_allowed: firewall_rule_exists(), network: current_network() }
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

/// Replaces every firewall rule for the engine with one that allows it in.
/// Windows asks the user for permission; returns whether the rule was added.
pub fn allow_firewall(engine_exe: &Path) -> bool {
    // Removing existing rules first matters: if the Windows prompt was ever
    // dismissed, it left "block" rules behind, and those win over "allow".
    let exe = engine_exe.display();
    let script = format!(
        "netsh advfirewall firewall delete rule name=all program=\"{exe}\" & \
         netsh advfirewall firewall add rule name=\"{FIREWALL_RULE}\" dir=in action=allow \
         program=\"{exe}\" enable=yes profile=any"
    );
    run_elevated("cmd.exe", &format!("/d /c \"{script}\"")) && firewall_rule_exists()
}

pub fn open_network_settings() {
    let _ = hidden("cmd").args(["/d", "/c", "start", "", "ms-settings:network-status"]).spawn();
}

#[cfg(windows)]
fn run_elevated(program: &str, parameters: &str) -> bool {
    use windows::core::{w, HSTRING, PCWSTR};
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{WaitForSingleObject, INFINITE};
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
            return false;
        }
        WaitForSingleObject(info.hProcess, INFINITE);
        let _ = CloseHandle(info.hProcess);
    }
    true
}

#[cfg(not(windows))]
fn run_elevated(_program: &str, _parameters: &str) -> bool {
    false
}

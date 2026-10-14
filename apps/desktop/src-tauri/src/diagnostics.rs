//! Answers "why can't my phone see this PC?" from what Windows can tell us,
//! and puts right what it can: the firewall, the kind of network the PC is
//! on, the Wi-Fi radio, and the Wireless Display feature Android phones need.

use crate::miracast::AndroidStatus;
use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

/// Name of the Windows Firewall rule Mirlow manages (also created by the installer).
pub const FIREWALL_RULE: &str = "Mirlow";

/// The Windows feature that holds the Miracast receiver. Not installed by
/// default since Windows 10 2004.
const WIRELESS_DISPLAY: &str = "App.WirelessDisplay.Connect~~~~0.0.1.0";

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
    /// Whether the firewall lets in every part of Mirlow that receives a phone.
    pub firewall_allowed: bool,
    /// The network the PC is connected to, if any.
    pub network: Option<Network>,
    /// The PC has Wi-Fi but it is switched off (Airplane mode, or the Wi-Fi
    /// toggle). Neither an iPhone nor an Android phone can reach it then,
    /// unless an iPhone shares a wired network with it.
    pub wifi_off: bool,
    /// Whether an Android phone can find this PC.
    pub android: AndroidStatus,
}

/// `programs` are the executables that must be let through the firewall.
pub fn collect(android: AndroidStatus, programs: &[PathBuf]) -> Diagnostics {
    let (network, firewall_on) = network_and_firewall();
    Diagnostics {
        // A firewall that is off (or replaced by an antivirus's own, which
        // turns Windows' off) blocks nothing, so there is nothing to allow.
        firewall_allowed: !firewall_on || firewall_allows(programs),
        network,
        wifi_off: wifi_off(),
        android,
    }
}

/// True when the PC has a Wi-Fi radio and none of them is on. A PC with no
/// Wi-Fi at all is not "off": it is on Ethernet, and that is fine for iPhones.
#[cfg(windows)]
fn wifi_off() -> bool {
    use windows::Devices::Radios::{Radio, RadioKind, RadioState};
    let Ok(radios) = Radio::GetRadiosAsync().and_then(|request| request.get()) else { return false };
    let states: Vec<RadioState> = radios
        .into_iter()
        .filter(|radio| radio.Kind() == Ok(RadioKind::WiFi))
        .filter_map(|radio| radio.State().ok())
        .collect();
    !states.is_empty() && !states.contains(&RadioState::On)
}

#[cfg(not(windows))]
fn wifi_off() -> bool {
    false
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

/// Whether Mirlow's rule covers every one of `programs`. Older versions only
/// let the AirPlay engine in, so the rule existing is not enough.
fn firewall_allows(programs: &[PathBuf]) -> bool {
    // netsh exits with 0 when the rule exists and 1 when it does not, in every
    // display language. The paths it lists are as given, whatever the language.
    let Ok(output) = hidden("netsh")
        .args(["advfirewall", "firewall", "show", "rule"])
        .arg(format!("name={FIREWALL_RULE}"))
        .arg("verbose")
        .output()
    else {
        return false;
    };
    if !output.status.success() {
        return false;
    }
    // netsh wraps long lines, often in the middle of a path ("C:\Program
    // Files\...\mirlow-engine.exe" does not fit), so whitespace and line
    // breaks are dropped on both sides before comparing.
    let squeeze = |text: &str| -> String {
        text.chars().filter(|c| !c.is_whitespace()).collect::<String>().to_lowercase()
    };
    let listed = squeeze(&String::from_utf8_lossy(&output.stdout));
    programs.iter().all(|program| {
        let path = program.display().to_string();
        // netsh prints in the console's code page, so a path with accents may
        // not read back as written; the rule existing is then the best guess.
        !path.is_ascii() || listed.contains(&squeeze(&path))
    })
}

/// The network the PC is on, and whether Windows Firewall is on for it. Asked
/// in one go, since starting PowerShell is the slow part.
fn network_and_firewall() -> (Option<Network>, bool) {
    // The firewall's state comes from its COM interface, which answers the
    // same in every display language. If even that fails, the firewall
    // service is not running at all.
    const SCRIPT: &str = "\
        $n = @(Get-NetConnectionProfile | Select-Object Name, @{n='Category';e={[int]$_.NetworkCategory}}); \
        $on = $true; \
        try { $p = New-Object -ComObject HNetCfg.FwPolicy2; $t = $p.CurrentProfileTypes; \
              $on = @(1, 2, 4 | Where-Object { ($t -band $_) -and $p.FirewallEnabled($_) }).Count -gt 0 } \
        catch { $on = $false }; \
        @{ networks = $n; firewallOn = $on } | ConvertTo-Json -Compress -Depth 3";
    let Some(value) = hidden("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", SCRIPT])
        .output()
        .ok()
        .and_then(|output| serde_json::from_slice::<serde_json::Value>(&output.stdout).ok())
    else {
        // Unknown: assume the firewall is on, so its rule is still checked.
        return (None, true);
    };
    let firewall_on = value.get("firewallOn").and_then(|on| on.as_bool()).unwrap_or(true);
    (current_network(value.get("networks")), firewall_on)
}

fn current_network(value: Option<&serde_json::Value>) -> Option<Network> {
    let profiles = match value? {
        serde_json::Value::Array(items) => items.clone(),
        single @ serde_json::Value::Object(_) => vec![single.clone()],
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

/// What [`fix`] is asked to put right.
pub struct Fixes<'a> {
    /// Executables to let through the firewall; empty if it already does.
    pub firewall: &'a [PathBuf],
    /// Make public networks private, so Windows lets other devices see the PC.
    pub private_network: bool,
    /// Install Windows' Wireless Display feature for Android phones.
    pub wireless_display: bool,
}

impl Fixes<'_> {
    pub fn any(&self) -> bool {
        !self.firewall.is_empty() || self.private_network || self.wireless_display
    }
}

/// Puts everything in `fixes` right in one go, behind a single Windows
/// permission prompt. Returns false if the user declined it. Installing
/// Wireless Display downloads it from Windows Update and can take minutes.
pub fn fix(fixes: &Fixes) -> bool {
    let mut script = vec!["$ErrorActionPreference = 'Continue'".to_string()];
    for program in fixes.firewall {
        let exe = program.display().to_string().replace('\'', "''");
        // Removing existing rules first matters: if the Windows prompt was ever
        // dismissed, it left "block" rules behind, and those win over "allow".
        script.push(format!(
            "Get-NetFirewallApplicationFilter -Program '{exe}' | Get-NetFirewallRule | Remove-NetFirewallRule"
        ));
        script.push(format!(
            "New-NetFirewallRule -DisplayName '{FIREWALL_RULE}' -Direction Inbound -Action Allow \
             -Program '{exe}' -Profile Any | Out-Null"
        ));
    }
    if fixes.private_network {
        script.push(
            "Get-NetConnectionProfile | Where-Object NetworkCategory -eq 'Public' | \
             Set-NetConnectionProfile -NetworkCategory Private"
                .into(),
        );
    }
    if fixes.wireless_display {
        script.push(format!(
            "dism.exe /Online /Add-Capability /CapabilityName:{WIRELESS_DISPLAY} /NoRestart /Quiet"
        ));
    }
    let parameters = format!(
        "-NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand {}",
        encode_command(&script.join("\n"))
    );
    run_elevated("powershell.exe", &parameters).is_some()
}

/// PowerShell's -EncodedCommand takes base64 of UTF-16LE, which spares the
/// script from every layer of quoting between here and there.
fn encode_command(script: &str) -> String {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bytes: Vec<u8> = script.encode_utf16().flat_map(u16::to_le_bytes).collect();
    let mut encoded = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let n = (chunk[0] as u32) << 16
            | (*chunk.get(1).unwrap_or(&0) as u32) << 8
            | *chunk.get(2).unwrap_or(&0) as u32;
        for i in 0..4 {
            if i <= chunk.len() {
                encoded.push(ALPHABET[(n >> (18 - 6 * i) & 63) as usize] as char);
            } else {
                encoded.push('=');
            }
        }
    }
    encoded
}

/// Switches the Wi-Fi radio on, if Windows lets apps do that (it does unless
/// the user has turned that permission off). Needs no administrator rights.
/// When it cannot, opens the Wi-Fi page of Settings so the user can.
#[cfg(windows)]
pub fn turn_on_wifi() {
    use windows::Devices::Radios::{Radio, RadioAccessStatus, RadioKind, RadioState};
    let allowed = Radio::RequestAccessAsync()
        .and_then(|request| request.get())
        .is_ok_and(|access| access == RadioAccessStatus::Allowed);
    if allowed {
        if let Ok(radios) = Radio::GetRadiosAsync().and_then(|request| request.get()) {
            for radio in radios {
                if radio.Kind() == Ok(RadioKind::WiFi) && radio.State() != Ok(RadioState::On) {
                    let _ = radio.SetStateAsync(RadioState::On).and_then(|request| request.get());
                }
            }
        }
    }
    // Airplane mode, or radio access refused: only the user can switch it on.
    if wifi_off() {
        open_settings("ms-settings:network-wifi");
    }
}

#[cfg(not(windows))]
pub fn turn_on_wifi() {}

#[cfg(test)]
mod tests {
    #[test]
    fn encodes_like_powershell() {
        // [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes(...))
        assert_eq!(super::encode_command("ab"), "YQBiAA==");
        assert_eq!(super::encode_command("abc"), "YQBiAGMA");
        assert_eq!(super::encode_command("é'"), "6QAnAA==");
    }
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

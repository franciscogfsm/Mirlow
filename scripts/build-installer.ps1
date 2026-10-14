# Builds the Windows installer and collects everything a release needs in
# .\release\ :
#   Mirlow-Setup-x64.exe        the installer (the name the website links to)
#   THIRD-PARTY-RUNTIME.md      the exact list of bundled libraries for this build
#   latest.json                 what the app's updater reads: the newest version
#                               and the installer's signature
#   SHA256SUMS.txt              checksums of the above
# It also records the installer's version and checksum in
# packages\i18n\src\release.ts, which the website reads.
#
#   .\scripts\build-installer.ps1               build the installer
#   .\scripts\build-installer.ps1 -Engine       rebuild the AirPlay engine first
#   .\scripts\build-installer.ps1 -BuildOnly    stop after the installer (to
#                                               code-sign it), then run
#                                               scripts\finish-release.ps1
param(
    [switch]$Engine,
    [switch]$BuildOnly,
    [string]$MsysRoot = 'C:\msys64',
    # Rust's build output. Kept outside the repository so that a synced folder
    # (OneDrive, Dropbox) does not have to churn through gigabytes of it.
    [string]$TargetDir = (Join-Path $env:LOCALAPPDATA 'MirlowBuild\cargo-target')
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent

if ($Engine) { & (Join-Path $PSScriptRoot 'build-engine.ps1') -MsysRoot $MsysRoot }

$engineExe = Join-Path $repo 'apps\desktop\src-tauri\resources\engine\bin\mirlow-engine.exe'
if (-not (Test-Path $engineExe)) {
    throw "The engine has not been built yet. Run this script with -Engine, or run scripts\build-engine.ps1."
}

# The runtime's bin folder holds only executables and DLLs. Anything else was
# left behind by running the engine from there (drivers create cache folders
# in the working directory) and must not be shipped.
Get-ChildItem (Split-Path $engineExe -Parent) -Directory | Remove-Item -Recurse -Force -Confirm:$false

# cargo, plus the MinGW tools (windres, dlltool) the GNU Rust toolchain uses.
$env:PATH = "$env:USERPROFILE\.cargo\bin;$MsysRoot\ucrt64\bin;$env:PATH"
$env:CARGO_TARGET_DIR = $TargetDir

Push-Location (Join-Path $repo 'apps\desktop')
try {
    npm run tauri -- build
    if ($LASTEXITCODE -ne 0) { throw "tauri build failed (exit code $LASTEXITCODE)." }
} finally {
    Pop-Location
}

$built = Get-ChildItem (Join-Path $TargetDir 'release\bundle\nsis\*-setup.exe') |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $built) { throw 'No installer was produced.' }

# Only this build's files, so nothing stale is checksummed or published.
$release = Join-Path $repo 'release'
if (Test-Path $release) { Remove-Item $release -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory -Force $release | Out-Null
$installer = Join-Path $release 'Mirlow-Setup-x64.exe'
Copy-Item $built.FullName $installer -Force
Copy-Item (Join-Path $repo 'apps\desktop\src-tauri\resources\engine\THIRD-PARTY-RUNTIME.md') $release -Force

if ($BuildOnly) {
    'Installer: {0} ({1:N1} MB)' -f $installer, ((Get-Item $installer).Length / 1MB)
    return
}

& (Join-Path $PSScriptRoot 'finish-release.ps1')

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
param(
    [switch]$Engine,
    [string]$MsysRoot = 'C:\msys64',
    # Rust's build output. Kept outside the repository so that a synced folder
    # (OneDrive, Dropbox) does not have to churn through gigabytes of it.
    [string]$TargetDir = (Join-Path $env:LOCALAPPDATA 'MirlowBuild\cargo-target'),
    # The key that signs updates. Installed copies of Mirlow only accept an
    # update signed with it, so keep a backup: without it, no release can
    # reach them through the updater again.
    [string]$UpdaterKey = (Join-Path $env:USERPROFILE '.tauri\mirlow-updater.key')
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

if (-not (Test-Path $UpdaterKey)) {
    throw "The update signing key is missing: $UpdaterKey. Restore it from your backup."
}
# The key has no password; with none given, Tauri assumes an empty one.
$env:TAURI_SIGNING_PRIVATE_KEY = $UpdaterKey

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

$release = Join-Path $repo 'release'
New-Item -ItemType Directory -Force $release | Out-Null
$installer = Join-Path $release 'Mirlow-Setup-x64.exe'
Copy-Item $built.FullName $installer -Force
Copy-Item (Join-Path $repo 'apps\desktop\src-tauri\resources\engine\THIRD-PARTY-RUNTIME.md') $release -Force

# The updater's manifest. It points at the installer this release attaches to
# GitHub, under the same name the website links to.
$signature = "$($built.FullName).sig"
if (-not (Test-Path $signature)) { throw 'The installer was not signed for the updater.' }
$version = (Get-Content (Join-Path $repo 'apps\desktop\src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json).version
$manifest = [ordered]@{
    version   = $version
    pub_date  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    platforms = [ordered]@{
        'windows-x86_64' = [ordered]@{
            signature = (Get-Content $signature -Raw).Trim()
            url       = "https://github.com/franciscogfsm/Mirlow/releases/download/v$version/Mirlow-Setup-x64.exe"
        }
    }
}
# Without a byte-order mark, which the updater's JSON parser rejects.
[IO.File]::WriteAllText((Join-Path $release 'latest.json'), ($manifest | ConvertTo-Json -Depth 4))

$sums = Get-ChildItem $release -File | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } | ForEach-Object {
    '{0}  {1}' -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name
}
Set-Content (Join-Path $release 'SHA256SUMS.txt') $sums -Encoding ascii

# What the website says about this build: its version and the installer's
# checksum (which is also what its VirusTotal link is made from).
$hash = (Get-FileHash $installer -Algorithm SHA256).Hash.ToLower()
$releaseInfo = @(
    '// Written by scripts/build-installer.ps1. Do not edit by hand.'
    '//'
    '// Describes the installer of the current release. The website shows the'
    '// checksum and links to the VirusTotal report for it, so publish the site'
    '// together with the installer this was generated from.'
    'export const release = {'
    "  version: `"$version`","
    "  sha256: `"$hash`","
    '} as const;'
)
Set-Content (Join-Path $repo 'packages\i18n\src\release.ts') $releaseInfo -Encoding ascii

'Installer: {0} ({1:N1} MB)' -f $installer, ((Get-Item $installer).Length / 1MB)

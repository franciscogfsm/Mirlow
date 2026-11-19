# Builds the Linux package, release\Mirlow-amd64.deb, in WSL (Ubuntu 24.04).
# The interface is built here first, since WSL's Node may be too old for it.
# See scripts\linux\build.sh for the one-time setup inside WSL.
#
#   .\scripts\build-linux.ps1            build the package
#   .\scripts\build-linux.ps1 -Engine    rebuild the AirPlay engine first
param(
    [switch]$Engine,
    [string]$Distro = 'Ubuntu'
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent

Push-Location (Join-Path $repo 'apps\desktop')
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Building the interface failed (exit code $LASTEXITCODE)." }
} finally { Pop-Location }

# C:\Users\... as WSL sees it.
$drive = $repo.Substring(0, 1).ToLower()
$wslRepo = "/mnt/$drive" + ($repo.Substring(2) -replace '\\', '/')
$env:MIRLOW_ENGINE = if ($Engine) { '1' } else { '0' }
$env:WSLENV = 'MIRLOW_ENGINE'
wsl.exe -d $Distro -- bash "$wslRepo/scripts/linux/build.sh" "$wslRepo"
if ($LASTEXITCODE -ne 0) { throw "The Linux build failed (exit code $LASTEXITCODE)." }

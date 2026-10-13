# Builds the AirPlay engine (patched UxPlay) and its bundled runtime.
#   .\scripts\build-engine.ps1                 build + assemble runtime
#   .\scripts\build-engine.ps1 -InstallDeps    also install the MSYS2 packages first
param(
    [switch]$InstallDeps,
    [string]$MsysRoot = 'C:\msys64'
)
$ErrorActionPreference = 'Stop'

$bash = Join-Path $MsysRoot 'usr\bin\bash.exe'
if (-not (Test-Path $bash)) {
    throw "MSYS2 was not found at $MsysRoot. Install it from https://www.msys2.org or pass -MsysRoot."
}

$script = (Join-Path $PSScriptRoot 'engine\build-engine.sh') -replace '\\', '/'
$env:MSYSTEM = 'UCRT64'
$env:CHERE_INVOKING = '1'

$scriptArgs = @()
if ($InstallDeps) { $scriptArgs += '--install-deps' }

& $bash -l $script @scriptArgs
if ($LASTEXITCODE -ne 0) { throw "Engine build failed (exit code $LASTEXITCODE)." }

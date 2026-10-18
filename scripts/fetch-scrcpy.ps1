# Downloads scrcpy, which mirrors and controls Android phones over Wi-Fi, and
# puts the files Mirlow ships in apps\desktop\src-tauri\resources\scrcpy\ .
#
# The version is pinned and the download checked against its published
# checksum. To move to a newer scrcpy, change both values below.
#
#   .\scripts\fetch-scrcpy.ps1          fetch it if it is not there yet
#   .\scripts\fetch-scrcpy.ps1 -Force   fetch it again
param([switch]$Force)
$ErrorActionPreference = 'Stop'

$version = 'v5.0.1'
$sha256 = 'b12a2c4ee8be317422451fc7dcf8ee20a71b5ea7ef9ad73ddd825a25316227a5'

$repo = Split-Path $PSScriptRoot -Parent
$target = Join-Path $repo 'apps\desktop\src-tauri\resources\scrcpy'
$marker = Join-Path $target 'VERSION'
if (-not $Force -and (Test-Path $marker) -and ((Get-Content $marker -Raw).Trim() -eq $version)) {
    "scrcpy $version is already in place."
    return
}

$work = Join-Path ([IO.Path]::GetTempPath()) "mirlow-scrcpy-$([guid]::NewGuid())"
New-Item -ItemType Directory -Force $work | Out-Null
try {
    $zip = Join-Path $work 'scrcpy.zip'
    $url = "https://github.com/Genymobile/scrcpy/releases/download/$version/scrcpy-win64-$version.zip"
    "Downloading $url"
    Invoke-WebRequest $url -OutFile $zip -UseBasicParsing
    $actual = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $sha256) { throw "The scrcpy download does not match its checksum ($actual)." }

    Expand-Archive $zip -DestinationPath $work
    $source = Join-Path $work "scrcpy-win64-$version"

    if (Test-Path $target) { Remove-Item $target -Recurse -Force -Confirm:$false }
    New-Item -ItemType Directory -Force $target | Out-Null
    # Everything but the conveniences for running scrcpy by hand.
    Get-ChildItem $source -File |
        Where-Object { $_.Name -notin @('open_a_terminal_here.bat', 'scrcpy-noconsole.vbs') } |
        Copy-Item -Destination $target
    Set-Content $marker $version -Encoding ascii
    "scrcpy $version is in $target"
} finally {
    Remove-Item $work -Recurse -Force -Confirm:$false -ErrorAction SilentlyContinue
}

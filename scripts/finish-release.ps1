# The second half of building a release, run on the installer in .\release\
# once it is final (for a published release: after it has been code-signed,
# since signing changes the file). Writes:
#   latest.json                 what the app's updater reads: the newest version
#                               and the installer's updater signature
#   SHA256SUMS.txt              checksums of everything in .\release\
#   packages\i18n\src\release.ts  the version and checksum the website shows
#
# The updater key comes from TAURI_SIGNING_PRIVATE_KEY (the key itself) or
# else from the file -UpdaterKey.
param(
    # The key that signs updates. Installed copies of Mirlow only accept an
    # update signed with it, so keep a backup: without it, no release can
    # reach them through the updater again.
    [string]$UpdaterKey = (Join-Path $env:USERPROFILE '.tauri\mirlow-updater.key')
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent

$release = Join-Path $repo 'release'
$installer = Join-Path $release 'Mirlow-Setup-x64.exe'
if (-not (Test-Path $installer)) { throw "No installer at $installer. Run scripts\build-installer.ps1 first." }
$version = (Get-Content (Join-Path $repo 'apps\desktop\src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json).version

# The updater's signature. The key has no password; with none given, Tauri
# assumes an empty one.
$keyArgs = @()
if (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
    if (-not (Test-Path $UpdaterKey)) {
        throw "The update signing key is missing: $UpdaterKey. Restore it from your backup."
    }
    $keyArgs = '--private-key-path', $UpdaterKey
}
# Through node rather than npm, which would split the paths at their spaces.
# Input is piped in so it never asks for the password at a terminal: what is
# typed there is not taken as the empty password the key has.
'' | node (Join-Path $repo 'node_modules\@tauri-apps\cli\tauri.js') signer sign @keyArgs --app-version $version $installer
if ($LASTEXITCODE -ne 0) { throw "Signing the update failed (exit code $LASTEXITCODE)." }
$signatureFile = "$installer.sig"
$signature = (Get-Content $signatureFile -Raw).Trim()
Remove-Item $signatureFile

# The updater's manifest. It points at the installer this release attaches to
# GitHub, under the same name the website links to.
$manifest = [ordered]@{
    version   = $version
    pub_date  = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    platforms = [ordered]@{
        'windows-x86_64' = [ordered]@{
            signature = $signature
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
    '// Written by scripts/finish-release.ps1. Do not edit by hand.'
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

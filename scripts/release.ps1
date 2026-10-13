# Publishes a new release in one go: sets the version everywhere, builds the
# installer, commits, tags, pushes, and creates the GitHub Release with the
# installer attached. Pushing also redeploys the website with the new checksum.
#
#   .\scripts\release.ps1                 next patch version (0.1.0 -> 0.1.1)
#   .\scripts\release.ps1 minor           next minor version (0.1.0 -> 0.2.0)
#   .\scripts\release.ps1 major           next major version (0.1.0 -> 1.0.0)
#   .\scripts\release.ps1 0.3.0           exactly this version
#   .\scripts\release.ps1 -All            also commit whatever is uncommitted
#   .\scripts\release.ps1 -Engine         rebuild the AirPlay engine first
#   .\scripts\release.ps1 -Notes "..."    release notes (default: generated from commits)
#
# If the build fails, nothing has been committed or pushed. Fix the problem and
# run it again with the version it printed, e.g. .\scripts\release.ps1 0.1.1
param(
    [Parameter(Position = 0)]
    [string]$Version = 'patch',
    [switch]$All,
    [switch]$Engine,
    [string]$Notes
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

function Invoke-Checked {
    param([string]$What, [scriptblock]$Command)
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit code $LASTEXITCODE)." }
}

function Edit-File {
    param([string]$Path, [string]$Pattern, [string]$Replacement)
    $full = Join-Path $repo $Path
    $text = [IO.File]::ReadAllText($full)
    $regex = New-Object Regex $Pattern, 'Multiline'
    if (-not $regex.IsMatch($text)) { throw "No version found in $Path." }
    # Written without a byte-order mark, which JSON and TOML parsers reject.
    [IO.File]::WriteAllText($full, $regex.Replace($text, $Replacement, 1))
}

# --- Checks, before anything is changed --------------------------------------

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'The GitHub CLI (gh) is needed to publish. Install it from https://cli.github.com'
}
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { throw "Releases are made from main; this is '$branch'." }

$pending = @(git status --porcelain)
if ($pending.Count -gt 0 -and -not $All) {
    $pending | ForEach-Object { Write-Host "  $_" }
    throw 'There are uncommitted changes. Commit them first, or run with -All to include them in the release.'
}

Invoke-Checked 'git fetch' { git fetch origin --tags --quiet }
if (@(git rev-list 'HEAD..origin/main').Count -gt 0) {
    throw 'origin/main has commits you do not have. Run "git pull" first.'
}

$current = (Get-Content (Join-Path $repo 'apps\desktop\src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json).version
if ($Version -in 'patch', 'minor', 'major') {
    $major, $minor, $patch = $current.Split('.') | ForEach-Object { [int]$_ }
    switch ($Version) {
        'major' { $major++; $minor = 0; $patch = 0 }
        'minor' { $minor++; $patch = 0 }
        'patch' { $patch++ }
    }
    $Version = "$major.$minor.$patch"
} elseif ($Version -notmatch '^\d+\.\d+\.\d+$') {
    throw "'$Version' is not a version. Use patch, minor, major, or a number like 0.2.0."
}
$tag = "v$Version"
if (git tag --list $tag) { throw "$tag already exists. Pick another version." }

Write-Host "Releasing Mirlow $Version (was $current)" -ForegroundColor Cyan

# --- Version ------------------------------------------------------------------

if ($Version -ne $current) {
    Invoke-Checked 'npm version' {
        npm version $Version --workspaces --include-workspace-root --no-git-tag-version --allow-same-version | Out-Null
    }
    Edit-File 'apps\desktop\src-tauri\tauri.conf.json' '^(\s*"version":\s*")[^"]+' "`${1}$Version"
    Edit-File 'apps\desktop\src-tauri\Cargo.toml' '^(version\s*=\s*")[^"]+' "`${1}$Version"
}

# --- Build --------------------------------------------------------------------

& (Join-Path $PSScriptRoot 'build-installer.ps1') -Engine:$Engine

$assets = 'Mirlow-Setup-x64.exe', 'THIRD-PARTY-RUNTIME.md', 'SHA256SUMS.txt' |
    ForEach-Object { Join-Path $repo "release\$_" }
$assets | ForEach-Object { if (-not (Test-Path $_)) { throw "Missing $_." } }

# --- Publish ------------------------------------------------------------------

if ($All) {
    Invoke-Checked 'git add' { git add -A }
} else {
    Invoke-Checked 'git add' {
        git add package.json package-lock.json apps/*/package.json packages/*/package.json `
            apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml `
            apps/desktop/src-tauri/Cargo.lock packages/i18n/src/release.ts
    }
}
Invoke-Checked 'git commit' { git commit --quiet -m "Release $Version" }
Invoke-Checked 'git tag' { git tag $tag }
Invoke-Checked 'git push' { git push origin main $tag }

if ($Notes) {
    Invoke-Checked 'gh release create' { gh release create $tag $assets --title "Mirlow $Version" --notes $Notes }
} else {
    Invoke-Checked 'gh release create' { gh release create $tag $assets --title "Mirlow $Version" --generate-notes }
}

$hash = (Get-FileHash $assets[0] -Algorithm SHA256).Hash.ToLower()
Write-Host ''
Write-Host "Mirlow $Version is published." -ForegroundColor Green
Write-Host 'The website is redeploying with the new checksum.'
Write-Host 'Still to do by hand: upload the installer to VirusTotal, so the report link on the site works:'
Write-Host "  https://www.virustotal.com/gui/file/$hash"

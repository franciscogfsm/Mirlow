# Starts a new release: sets the version everywhere, commits, tags and pushes.
# The tag starts .github/workflows/release.yml on GitHub, which builds the
# installer from that exact source, has it code-signed by SignPath, and
# publishes the GitHub Release. Approve the signing request on signpath.io
# when it arrives; the workflow then finishes by itself and also updates the
# website's checksum on main (run "git pull" afterwards).
#
#   .\scripts\release.ps1                 next patch version (0.1.0 -> 0.1.1)
#   .\scripts\release.ps1 minor           next minor version (0.1.0 -> 0.2.0)
#   .\scripts\release.ps1 major           next major version (0.1.0 -> 1.0.0)
#   .\scripts\release.ps1 0.3.0           exactly this version
#   .\scripts\release.ps1 -All            also commit whatever is uncommitted
#   .\scripts\release.ps1 -Notes "..."    release notes (default: generated from commits)
#
# Try the installer locally first with scripts\build-installer.ps1.
param(
    [Parameter(Position = 0)]
    [string]$Version = 'patch',
    [switch]$All,
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

# --- Publish ------------------------------------------------------------------

if ($All) {
    Invoke-Checked 'git add' { git add -A }
} else {
    Invoke-Checked 'git add' {
        git add package.json package-lock.json apps/*/package.json packages/*/package.json `
            apps/desktop/src-tauri/tauri.conf.json apps/desktop/src-tauri/Cargo.toml `
            apps/desktop/src-tauri/Cargo.lock
    }
}
Invoke-Checked 'git commit' { git commit --quiet -m "Release $Version" }
# Notes travel in the tag, where the release workflow reads them.
if ($Notes) {
    Invoke-Checked 'git tag' { git tag -a $tag -m $Notes }
} else {
    Invoke-Checked 'git tag' { git tag $tag }
}
Invoke-Checked 'git push' { git push origin main $tag }

$slug = (git remote get-url origin) -replace '^.*github\.com[:/]', '' -replace '\.git$', ''
Write-Host ''
Write-Host "Mirlow $Version is on its way." -ForegroundColor Green
Write-Host "Building on GitHub:  https://github.com/$slug/actions/workflows/release.yml"
Write-Host 'Approve the signing request on https://app.signpath.io when it arrives.'
Write-Host 'Then upload the published installer to VirusTotal, so the report link on the site works.'

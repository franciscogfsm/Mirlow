# Updates the numbers on the website's /stats page: collects downloads, stars
# and feedback from GitHub and publishes them as stats.json on the stats-data
# branch, which the page reads. The more often it runs, the finer the
# downloads-per-day chart; once a day is enough.
#
#   npm run stats
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$out = Join-Path ([IO.Path]::GetTempPath()) 'mirlow-stats'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory $out | Out-Null

Set-Location $repo
git fetch origin stats-data --depth=1 --quiet 2>$null
$previous = Join-Path $out 'previous.json'
if ($LASTEXITCODE -eq 0) { git show origin/stats-data:stats.json | Set-Content $previous -Encoding utf8 }

$env:GITHUB_TOKEN = (gh auth token)
node (Join-Path $repo 'scripts\stats\collect.mjs') $previous (Join-Path $out 'stats.json')
if ($LASTEXITCODE -ne 0) { throw 'Collecting the stats failed.' }
Remove-Item $previous -ErrorAction SilentlyContinue
# Vercel builds every branch it sees; this one is data, not a site.
[IO.File]::WriteAllText((Join-Path $out 'vercel.json'), '{ "git": { "deploymentEnabled": false } }')

# A single commit, replaced each time, so the branch never grows.
Set-Location $out
git init -q -b stats-data
git add stats.json vercel.json
git -c user.name=stats -c user.email=stats@mirlow commit -q -m Stats
git push -q -f https://github.com/franciscogfsm/Mirlow.git stats-data
if ($LASTEXITCODE -ne 0) { throw 'Publishing the stats failed.' }
Write-Host 'Stats updated: https://mirlow.vercel.app/stats/' -ForegroundColor Green

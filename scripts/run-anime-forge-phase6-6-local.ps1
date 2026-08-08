param(
  [string]$EvidenceDir = "",
  [switch]$Install,
  [switch]$SkipFullRegression,
  [switch]$SkipBrowserReviewRegression,
  [switch]$OpenReview
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptRoot
Set-Location $RepoRoot

if ([string]::IsNullOrWhiteSpace($EvidenceDir)) {
  $EvidenceDir = Join-Path $RepoRoot "tmp/anime-forge-phase6-6-local-evidence"
} elseif ([System.IO.Path]::IsPathRooted($EvidenceDir)) {
  $EvidenceDir = [System.IO.Path]::GetFullPath($EvidenceDir)
} else {
  $EvidenceDir = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $EvidenceDir))
}

function Resolve-Tool([string]$EnvName,[string[]]$Fallbacks) {
  $configured = [Environment]::GetEnvironmentVariable($EnvName)
  if (-not [string]::IsNullOrWhiteSpace($configured)) {
    if (Test-Path $configured) { return (Resolve-Path $configured).Path }
    $cmd = Get-Command $configured -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw "$EnvName points to unavailable command: $configured"
  }
  foreach ($candidate in $Fallbacks) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
  }
  throw "Required tool missing for $EnvName. Tried: $($Fallbacks -join ', ')"
}

function Invoke-Step([string]$Name,[scriptblock]$Action) {
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "STEP_FAILED:$Name exit=$LASTEXITCODE"
  }
}

$Node = Resolve-Tool "PHASE66_NODE_PATH" @("node.exe","node")
$Npm = Resolve-Tool "PHASE66_NPM_PATH" @("npm.cmd","npm")
$Rsvg = Resolve-Tool "RSVG_CONVERT_PATH" @("rsvg-convert.exe","rsvg-convert")
$Ffmpeg = Resolve-Tool "FFMPEG_PATH" @("ffmpeg.exe","ffmpeg")
$Ffprobe = Resolve-Tool "FFPROBE_PATH" @("ffprobe.exe","ffprobe")
$Python = $null
if (-not $SkipBrowserReviewRegression) {
  $Python = Resolve-Tool "PHASE66_PYTHON_PATH" @("python.exe","python","py.exe","py")
}

# Propagate the resolved Node executable to browser regression child processes.
$env:PHASE66_NODE_PATH = $Node
$NodeDir = Split-Path -Parent $Node
if (-not [string]::IsNullOrWhiteSpace($NodeDir)) {
  $env:PATH = "$NodeDir;$env:PATH"
}
$env:RSVG_CONVERT_PATH = $Rsvg
$env:FFMPEG_PATH = $Ffmpeg
$env:FFPROBE_PATH = $Ffprobe
$env:ANIME_PHASE6_6_EVIDENCE_DIR = $EvidenceDir

Write-Host "Repo:     $RepoRoot"
Write-Host "Evidence: $EvidenceDir"
Write-Host "Node:     $Node"
Write-Host "rsvg:     $Rsvg"
Write-Host "ffmpeg:   $Ffmpeg"
if ($Python) { Write-Host "Python:   $Python" }

if ($Install -or -not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
  Invoke-Step "Install npm dependencies" { & $Npm ci --ignore-scripts }
}

Invoke-Step "Phase 6.6 local execution doctor" { & $Node scripts/phase6-6-doctor.mjs --evidence $EvidenceDir }

$focusedTests = @(
  "packages/world/native-character-morphogenesis-runtime/tests/character-drawing-compiler.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/drawing-ir.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/drawing-mesh-deformation.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/lower-body-morphology.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/lower-body-performance.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/surface-weighting.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/mesh-silhouette-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/head-surface-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/face-surface-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/hair-surface-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/garment-surface-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/cel-shading-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/temporal-drawing-stability.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/full-body-drawing.test.mjs",
  "packages/world/native-character-morphogenesis-runtime/tests/drawing-presentation.test.mjs",
  "apps/reality-studio/tests/native-drawing-review-model.test.mjs"
)
Invoke-Step "Focused RED/GREEN gates" { & $Node --test @focusedTests }

if (-not $SkipFullRegression) {
  Invoke-Step "Full native morphology regression" { & $Npm test --workspace @taowind/native-character-morphogenesis-runtime }
}

if (-not $SkipBrowserReviewRegression) {
  $PlaywrightPackageAvailable = $false
  & $Python -c "import playwright" *> $null
  if ($LASTEXITCODE -eq 0) { $PlaywrightPackageAvailable = $true }

  if (-not $PlaywrightPackageAvailable -and $Install) {
    Invoke-Step "Install Python Playwright package" { & $Python -m pip install "playwright>=1.45,<2" }
    $PlaywrightPackageAvailable = $true
  }
  if (-not $PlaywrightPackageAvailable) {
    throw "PLAYWRIGHT_MISSING: install with '$Python -m pip install playwright', or use -Install. -SkipBrowserReviewRegression is development-only and not equivalent to full Phase 6.6 validation."
  }

  $ChromiumAvailable = $false
  $ChromiumProbe = 'import os,sys; from playwright.sync_api import sync_playwright; p=sync_playwright().start(); path=p.chromium.executable_path; p.stop(); print(path); sys.exit(0 if path and os.path.isfile(path) else 2)'
  & $Python -c $ChromiumProbe *> $null
  if ($LASTEXITCODE -eq 0) { $ChromiumAvailable = $true }
  if (-not $ChromiumAvailable -and $Install) {
    Invoke-Step "Install Chromium browser for Human Review regression" { & $Python -m playwright install chromium }
    & $Python -c $ChromiumProbe *> $null
    if ($LASTEXITCODE -eq 0) { $ChromiumAvailable = $true }
  }
  if (-not $ChromiumAvailable) {
    throw "PLAYWRIGHT_CHROMIUM_MISSING: install with '$Python -m playwright install chromium', or use -Install. -SkipBrowserReviewRegression is development-only and not equivalent to full Phase 6.6 validation."
  }

  Invoke-Step "Reality Studio Human Review browser regression" { & $Python apps/reality-studio/tests/browser_native_drawing_review_test.py }
}

Invoke-Step "Build 120-frame Phase 6.6 media" { & $Node scripts/build-anime-forge-phase6-6-native-drawing-infrastructure.mjs }

$evidenceSteps = @(
  @{ Name = "Head surface evidence"; Build = "scripts/build-anime-forge-phase6-6-head-surface-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-head-surface-evidence.mjs" },
  @{ Name = "Face surface evidence"; Build = "scripts/build-anime-forge-phase6-6-face-surface-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-face-surface-evidence.mjs" },
  @{ Name = "Hair surface evidence"; Build = "scripts/build-anime-forge-phase6-6-hair-surface-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-hair-surface-evidence.mjs" },
  @{ Name = "Garment surface evidence"; Build = "scripts/build-anime-forge-phase6-6-garment-surface-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-garment-surface-evidence.mjs" },
  @{ Name = "Cel shading evidence"; Build = "scripts/build-anime-forge-phase6-6-cel-shading-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-cel-shading-evidence.mjs" },
  @{ Name = "Mesh silhouette evidence"; Build = "scripts/build-anime-forge-phase6-6-mesh-silhouette-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-mesh-silhouette-evidence.mjs" },
  @{ Name = "Temporal stability evidence"; Build = "scripts/build-anime-forge-phase6-6-temporal-stability-evidence.mjs"; Verify = "scripts/verify-anime-forge-phase6-6-temporal-stability-evidence.mjs" }
)

foreach ($entry in $evidenceSteps) {
  Invoke-Step "$($entry.Name) build" { & $Node $entry.Build }
  Invoke-Step "$($entry.Name) verify" { & $Node $entry.Verify --evidence $EvidenceDir }
}

Invoke-Step "Bind spatial + temporal evidence into Evidence Ledger" { & $Node scripts/bind-anime-forge-phase6-6-direct-visual-evidence.mjs --evidence $EvidenceDir }
Invoke-Step "Verify bound Phase 6.6 evidence bundle" { & $Node scripts/verify-anime-forge-phase6-6-native-drawing-infrastructure.mjs --evidence $EvidenceDir }

$Mp4 = Join-Path $EvidenceDir "episode.mp4"
$Ledger = Join-Path $EvidenceDir "evidence-ledger.json"
$Temporal = Join-Path $EvidenceDir "temporal-drawing-stability-evidence.json"
$Bridge = Join-Path $EvidenceDir "direct-visual-bridge.json"
if (-not (Test-Path $Mp4)) { throw "FINAL_MEDIA_MISSING:$Mp4" }
if (-not (Test-Path $Ledger)) { throw "LEDGER_MISSING:$Ledger" }
if (-not (Test-Path $Temporal)) { throw "TEMPORAL_EVIDENCE_MISSING:$Temporal" }
if (-not (Test-Path $Bridge)) { throw "DIRECT_VISUAL_BRIDGE_MISSING:$Bridge" }

$LedgerJson = Get-Content -Raw $Ledger | ConvertFrom-Json
$TemporalJson = Get-Content -Raw $Temporal | ConvertFrom-Json
$Mp4Hash = (Get-FileHash -Algorithm SHA256 $Mp4).Hash.ToLowerInvariant()
$FullValidation = (-not $SkipFullRegression) -and (-not $SkipBrowserReviewRegression)
$ValidationStatus = if ($FullValidation) { "engineering-evidence-passed-awaiting-human-review" } else { "development-partial-pass-not-release-evidence" }
$Summary = [ordered]@{
  format = "rncs.phase6-6-local-validation-summary.v0.4"
  status = $ValidationStatus
  full_validation = $FullValidation
  evidence_dir = $EvidenceDir
  mp4 = [ordered]@{ path = $Mp4; sha256 = $Mp4Hash; bytes = (Get-Item $Mp4).Length }
  ledger_root = $LedgerJson.ledger_root
  direct_visual_bridge_root = $LedgerJson.direct_visual_bridge_root
  temporal_evidence_root = $LedgerJson.temporal_drawing_stability_evidence_root
  temporal_report_root = $LedgerJson.temporal_report_root
  temporal_status = $TemporalJson.status
  browser_review_regression = $(if ($SkipBrowserReviewRegression) { "skipped-development-only" } else { "passed" })
  full_regression = $(if ($SkipFullRegression) { "skipped-development-only" } else { "passed" })
  human_visual_acceptance = "pending"
  review_workspace = "apps/reality-studio/web/native-drawing-review.html"
  automatic_commit = $false
  boundary = "Local execution can prove engineering evidence. Human visual acceptance remains separate. Any skip flag forces a development-only summary and cannot be used as full Phase 6.6 validation."
}
$SummaryFile = Join-Path $EvidenceDir "local-validation-summary.json"
$Summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $SummaryFile

if ($FullValidation) {
  Write-Host "`n=== Phase 6.6 local engineering evidence PASS ===" -ForegroundColor Green
} else {
  Write-Host "`n=== Phase 6.6 development partial pass — NOT release evidence ===" -ForegroundColor Yellow
}
Write-Host "MP4:        $Mp4"
Write-Host "SHA-256:    $Mp4Hash"
Write-Host "Ledger:     $($LedgerJson.ledger_root)"
Write-Host "Temporal:   $($TemporalJson.status)"
Write-Host "Browser QA: $($Summary.browser_review_regression)"
Write-Host "Review UI:  apps/reality-studio/web/native-drawing-review.html"
Write-Host "Human Gate: pending"
Write-Host "Summary:    $SummaryFile"

if ($OpenReview) {
  Write-Host "`nOpening Reality Studio Human Review..." -ForegroundColor Cyan
  & (Join-Path $ScriptRoot "open-anime-forge-phase6-6-review.ps1") -EvidenceDir $EvidenceDir
}

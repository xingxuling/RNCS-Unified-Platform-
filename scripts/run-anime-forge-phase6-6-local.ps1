param(
  [string]$EvidenceDir = "",
  [string]$RasterBackend = "",
  [switch]$Install,
  [switch]$SkipFullRegression,
  [switch]$SkipBrowserReviewRegression,
  [switch]$SkipPackage,
  [switch]$NoOpenReview,
  [switch]$OpenReview
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptRoot
Set-Location $RepoRoot

if ([string]::IsNullOrWhiteSpace($RasterBackend)) {
  $RasterBackend = if ($env:OS -eq "Windows_NT") { "resvg-js" } else { "librsvg" }
}
$RasterBackend = $RasterBackend.ToLowerInvariant()
if ($RasterBackend -notin @("librsvg","resvg-js")) { throw "RASTER_BACKEND_UNSUPPORTED:$RasterBackend" }

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
$Rsvg = $null
if ($RasterBackend -eq "librsvg") {
  $Rsvg = Resolve-Tool "RSVG_CONVERT_PATH" @("rsvg-convert.exe","rsvg-convert")
}
$Ffmpeg = Resolve-Tool "FFMPEG_PATH" @("ffmpeg.exe","ffmpeg")
$Ffprobe = Resolve-Tool "FFPROBE_PATH" @("ffprobe.exe","ffprobe")
$Python = $null
if (-not $SkipBrowserReviewRegression) {
  $Python = Resolve-Tool "PHASE66_PYTHON_PATH" @("python.exe","python","py.exe","py")
}

# Propagate the resolved Node executable to browser regression child processes.
$env:PHASE66_NODE_PATH = $Node
$env:PHASE66_RASTER_BACKEND = $RasterBackend
$NodeDir = Split-Path -Parent $Node
if (-not [string]::IsNullOrWhiteSpace($NodeDir)) {
  $env:PATH = "$NodeDir;$env:PATH"
}
if ($Rsvg) { $env:RSVG_CONVERT_PATH = $Rsvg } else { Remove-Item Env:RSVG_CONVERT_PATH -ErrorAction SilentlyContinue }
$env:FFMPEG_PATH = $Ffmpeg
$env:FFPROBE_PATH = $Ffprobe
$env:ANIME_PHASE6_6_EVIDENCE_DIR = $EvidenceDir

Write-Host "Repo:     $RepoRoot"
Write-Host "Evidence: $EvidenceDir"
Write-Host "Node:     $Node"
Write-Host "Raster:   $RasterBackend"
if ($Rsvg) { Write-Host "rsvg:     $Rsvg" }
Write-Host "ffmpeg:   $Ffmpeg"
if ($Python) { Write-Host "Python:   $Python" }

if ($Install -or -not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
  Invoke-Step "Install npm dependencies" { & $Npm ci --ignore-scripts }
}

if ($RasterBackend -eq "resvg-js") {
  $ResvgVersion = & $Node -e "try { const p=require('./node_modules/@resvg/resvg-js/package.json'); console.log(p.version) } catch { process.exit(2) }"
  if ($LASTEXITCODE -ne 0 -or $ResvgVersion.Trim() -ne "2.6.2") {
    if ($Install) {
      Invoke-Step "Install pinned resvg-js 2.6.2 without manifest pollution" { & $Npm install --no-save --package-lock=false --ignore-scripts "@resvg/resvg-js@2.6.2" }
    } else {
      throw "SVG_RASTER_RESVG_JS_MISSING_OR_UNPINNED: install with -Install or npm install --no-save --package-lock=false --ignore-scripts @resvg/resvg-js@2.6.2"
    }
  }
}

Invoke-Step "Phase 6.6 local execution doctor" { & $Node scripts/phase6-6-doctor.mjs --raster-backend $RasterBackend --evidence $EvidenceDir }

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
  "packages/world/native-character-morphogenesis-runtime/tests/svg-raster-provider.test.mjs",
  "apps/reality-studio/tests/native-drawing-review-model.test.mjs"
)
Invoke-Step "Focused RED/GREEN gates" { & $Node --test @focusedTests }

if (-not $SkipFullRegression) {
  Invoke-Step "Full native morphology regression" { & $Npm test --workspace @taowind/native-character-morphogenesis-runtime }
}

if (-not $SkipBrowserReviewRegression) {
  Invoke-Step "Build VSR and RSR runtime bundles for Reality Studio" { & $Npm run build:world }

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

if ($RasterBackend -eq "librsvg") {
  Invoke-Step "Official librsvg/resvg raster parity evidence" { & $Node scripts/build-anime-forge-phase6-6-raster-parity-evidence.mjs }
  Invoke-Step "Verify official librsvg/resvg raster parity evidence" { & $Node scripts/verify-anime-forge-phase6-6-raster-parity-evidence.mjs --evidence $EvidenceDir }
} else {
  Write-Host "Raster parity: CROSS_PLATFORM_CANDIDATE (Windows resvg-js local run; librsvg baseline remains CI/Linux evidence)." -ForegroundColor Yellow
}

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
$Raster = Join-Path $EvidenceDir "raster-provider-receipts.json"
$Backend = Join-Path $EvidenceDir "backend-receipt.json"
if (-not (Test-Path $Mp4)) { throw "FINAL_MEDIA_MISSING:$Mp4" }
if (-not (Test-Path $Ledger)) { throw "LEDGER_MISSING:$Ledger" }
if (-not (Test-Path $Temporal)) { throw "TEMPORAL_EVIDENCE_MISSING:$Temporal" }
if (-not (Test-Path $Bridge)) { throw "DIRECT_VISUAL_BRIDGE_MISSING:$Bridge" }
if (-not (Test-Path $Raster)) { throw "RASTER_PROVIDER_RECEIPTS_MISSING:$Raster" }
if (-not (Test-Path $Backend)) { throw "RASTER_BACKEND_RECEIPT_MISSING:$Backend" }

$LedgerJson = Get-Content -Raw $Ledger | ConvertFrom-Json
$TemporalJson = Get-Content -Raw $Temporal | ConvertFrom-Json
$RasterJson = Get-Content -Raw $Raster | ConvertFrom-Json
$BackendJson = Get-Content -Raw $Backend | ConvertFrom-Json
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
  raster_backend = $RasterJson.backend
  raster_provider_id = $RasterJson.provider_id
  raster_provider_version = $RasterJson.provider_version
  raster_provider_receipt_set_root = $RasterJson.receipt_set_root
  raster_provider_receipt_count = $RasterJson.receipt_count
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
Write-Host "Raster:     $($RasterJson.backend) $($RasterJson.provider_version) receipts=$($RasterJson.receipt_count)"
Write-Host "Browser QA: $($Summary.browser_review_regression)"
Write-Host "Review UI:  apps/reality-studio/web/native-drawing-review.html"
Write-Host "Human Gate: pending"
Write-Host "Summary:    $SummaryFile"

if ($SkipPackage) {
  Write-Host "`nEvidence package: skipped-development-only" -ForegroundColor Yellow
} elseif ($FullValidation) {
  Invoke-Step "Package full local evidence" { & (Join-Path $ScriptRoot "package-anime-forge-phase6-6-local-evidence.ps1") -EvidenceDir $EvidenceDir }
} else {
  Write-Host "`nEvidence package: blocked because validation is partial" -ForegroundColor Yellow
}

if (-not $NoOpenReview) {
  Write-Host "`nOpening Reality Studio Human Review..." -ForegroundColor Cyan
  & (Join-Path $ScriptRoot "open-anime-forge-phase6-6-review.ps1") -EvidenceDir $EvidenceDir
}

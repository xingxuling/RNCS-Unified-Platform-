param(
  [string]$EvidenceDir = "",
  [switch]$Install,
  [switch]$SkipFullRegression
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

$env:RSVG_CONVERT_PATH = $Rsvg
$env:FFMPEG_PATH = $Ffmpeg
$env:FFPROBE_PATH = $Ffprobe
$env:ANIME_PHASE6_6_EVIDENCE_DIR = $EvidenceDir

Write-Host "Repo:     $RepoRoot"
Write-Host "Evidence: $EvidenceDir"
Write-Host "Node:     $Node"
Write-Host "rsvg:     $Rsvg"
Write-Host "ffmpeg:   $Ffmpeg"

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
$Summary = [ordered]@{
  format = "rncs.phase6-6-local-validation-summary.v0.1"
  status = "engineering-evidence-passed-awaiting-human-review"
  evidence_dir = $EvidenceDir
  mp4 = [ordered]@{ path = $Mp4; sha256 = $Mp4Hash; bytes = (Get-Item $Mp4).Length }
  ledger_root = $LedgerJson.ledger_root
  direct_visual_bridge_root = $LedgerJson.direct_visual_bridge_root
  temporal_evidence_root = $LedgerJson.temporal_drawing_stability_evidence_root
  temporal_report_root = $LedgerJson.temporal_report_root
  temporal_status = $TemporalJson.status
  human_visual_acceptance = "pending"
  review_workspace = "apps/reality-studio/web/native-drawing-review.html"
  automatic_commit = $false
  boundary = "Local execution can prove engineering evidence. Human visual acceptance remains a separate manual gate."
}
$SummaryFile = Join-Path $EvidenceDir "local-validation-summary.json"
$Summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $SummaryFile

Write-Host "`n=== Phase 6.6 local engineering evidence PASS ===" -ForegroundColor Green
Write-Host "MP4:        $Mp4"
Write-Host "SHA-256:    $Mp4Hash"
Write-Host "Ledger:     $($LedgerJson.ledger_root)"
Write-Host "Temporal:   $($TemporalJson.status)"
Write-Host "Review UI:  apps/reality-studio/web/native-drawing-review.html"
Write-Host "Human Gate: pending"
Write-Host "Summary:    $SummaryFile"

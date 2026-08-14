param(
  [string]$EvidenceDir = "",
  [string]$OutputZip = ""
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptRoot

if ([string]::IsNullOrWhiteSpace($EvidenceDir)) {
  $EvidenceDir = Join-Path $RepoRoot "tmp/anime-forge-phase6-6-local-evidence"
} elseif ([System.IO.Path]::IsPathRooted($EvidenceDir)) {
  $EvidenceDir = [System.IO.Path]::GetFullPath($EvidenceDir)
} else {
  $EvidenceDir = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $EvidenceDir))
}
if (-not (Test-Path $EvidenceDir)) { throw "EVIDENCE_DIR_MISSING:$EvidenceDir" }

$SummaryFile = Join-Path $EvidenceDir "local-validation-summary.json"
if (-not (Test-Path $SummaryFile)) { throw "LOCAL_VALIDATION_SUMMARY_MISSING:$SummaryFile" }
$Summary = Get-Content -Raw $SummaryFile | ConvertFrom-Json
if ($Summary.status -ne "engineering-evidence-passed-awaiting-human-review" -or $Summary.full_validation -ne $true) {
  throw "EVIDENCE_PACKAGE_REQUIRES_FULL_LOCAL_VALIDATION:$($Summary.status)"
}
if ($Summary.human_visual_acceptance -ne "pending") { throw "EVIDENCE_PACKAGE_UNEXPECTED_HUMAN_STATE:$($Summary.human_visual_acceptance)" }

$Required = @(
  "episode.mp4","episode.wav","ffprobe-report.json","raster-provider-receipts.json","backend-receipt.json","frame-manifest.json",
  "evidence-ledger.json","evidence-summary.json","direct-visual-bridge.json","temporal-drawing-stability-evidence.json","temporal-evidence-bridge.json",
  "character-continuity-report.json","cut-continuity-report.json","audio-video-sync-report.json",
  "static-gates\front.png","static-gates\three-quarter-right.png","static-gates\side.png"
)
$Missing = @($Required | Where-Object { -not (Test-Path (Join-Path $EvidenceDir $_)) })
if ($Missing.Count -gt 0) { throw "EVIDENCE_PACKAGE_INCOMPLETE:$($Missing -join ',')" }

$GitCommit = (& git -C $RepoRoot rev-parse HEAD).Trim()
$GitBranch = (& git -C $RepoRoot symbolic-ref --short HEAD).Trim()
$Repository = (& git -C $RepoRoot config --get remote.origin.url).Trim()
$Ledger = Get-Content -Raw (Join-Path $EvidenceDir "evidence-ledger.json") | ConvertFrom-Json
$Manifest = Get-Content -Raw (Join-Path $EvidenceDir "frame-manifest.json") | ConvertFrom-Json
$Backend = Get-Content -Raw (Join-Path $EvidenceDir "backend-receipt.json") | ConvertFrom-Json
$Raster = Get-Content -Raw (Join-Path $EvidenceDir "raster-provider-receipts.json") | ConvertFrom-Json
$Mp4 = Join-Path $EvidenceDir "episode.mp4"
$Mp4Hash = (Get-FileHash -Algorithm SHA256 $Mp4).Hash.ToLowerInvariant()
$ManifestFile = Join-Path $EvidenceDir "evidence-package-manifest.json"
$PackageManifest = [ordered]@{
  format = "rncs.phase6-6-evidence-package-manifest.v0.1"
  repository = $Repository
  branch = $GitBranch
  commit_sha = $GitCommit
  timestamp_utc = [DateTime]::UtcNow.ToString("o")
  platform = [ordered]@{ os = [System.Environment]::OSVersion.VersionString; platform = $env:OS; arch = $env:PROCESSOR_ARCHITECTURE }
  raster_backend = $Raster.backend
  raster_provider_id = $Raster.provider_id
  raster_provider_version = $Raster.provider_version
  frame_count = [int]$Manifest.frame_count
  fps = [double]$Manifest.fps
  resolution = [ordered]@{ width = [int]$Manifest.width; height = [int]$Manifest.height }
  mp4_sha256 = $Mp4Hash
  ledger_root = $Ledger.ledger_root
  direct_visual_bridge_root = $Ledger.direct_visual_bridge_root
  temporal_evidence_root = $Ledger.temporal_drawing_stability_evidence_root
  raster_receipt_set_root = $Raster.receipt_set_root
  raster_receipt_count = [int]$Raster.receipt_count
  backend_receipt_root = $Ledger.backend_receipt_root
  full_validation = $true
  human_visual_acceptance = "pending"
  boundary = "Engineering evidence is complete and awaits independent human visual acceptance; no Episode authority or automatic commit is granted."
}
$PackageManifest | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $ManifestFile

if ([string]::IsNullOrWhiteSpace($OutputZip)) {
  $Parent = Split-Path -Parent $EvidenceDir
  $OutputZip = Join-Path $Parent "RNCS-Anime-Forge-Phase6-6-Evidence-$GitCommit.zip"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputZip)) {
  $OutputZip = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $OutputZip))
}

if (Test-Path $OutputZip) { Remove-Item -Force $OutputZip }
Compress-Archive -Path (Join-Path $EvidenceDir '*') -DestinationPath $OutputZip -CompressionLevel Optimal
$Hash = (Get-FileHash -Algorithm SHA256 $OutputZip).Hash.ToLowerInvariant()
$HashFile = "$OutputZip.sha256"
"$Hash  $(Split-Path -Leaf $OutputZip)" | Set-Content -Encoding ASCII $HashFile

Write-Host "`nPhase 6.6 full local evidence packaged." -ForegroundColor Green
Write-Host "ZIP:      $OutputZip"
Write-Host "SHA-256:  $Hash"
Write-Host "Hash file: $HashFile"
Write-Host "Manifest: $ManifestFile"
Write-Host "`nThis archive is a review handoff artifact only. It does not merge or commit anything to Git."

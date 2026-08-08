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
if ($Summary.human_visual_acceptance -ne "pending") {
  throw "EVIDENCE_PACKAGE_UNEXPECTED_HUMAN_STATE:$($Summary.human_visual_acceptance)"
}

$Required = @(
  "episode.mp4",
  "raster-provider-receipts.json",
  "backend-receipt.json",
  "frame-manifest.json",
  "evidence-ledger.json",
  "evidence-summary.json",
  "direct-visual-bridge.json",
  "temporal-drawing-stability-evidence.json",
  "temporal-evidence-bridge.json",
  "static-gates\front.png",
  "static-gates\three-quarter-right.png",
  "static-gates\side.png"
)
$Missing = @($Required | Where-Object { -not (Test-Path (Join-Path $EvidenceDir $_)) })
if ($Missing.Count -gt 0) { throw "EVIDENCE_PACKAGE_INCOMPLETE:$($Missing -join ',')" }

if ([string]::IsNullOrWhiteSpace($OutputZip)) {
  $Parent = Split-Path -Parent $EvidenceDir
  $Leaf = Split-Path -Leaf $EvidenceDir
  $OutputZip = Join-Path $Parent "$Leaf.zip"
} elseif (-not [System.IO.Path]::IsPathRooted($OutputZip)) {
  $OutputZip = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $OutputZip))
}

if (Test-Path $OutputZip) { Remove-Item -Force $OutputZip }
Compress-Archive -Path (Join-Path $EvidenceDir '*') -DestinationPath $OutputZip -CompressionLevel Optimal
$Hash = (Get-FileHash -Algorithm SHA256 $OutputZip).Hash.ToLowerInvariant()
$HashFile = "$OutputZip.sha256.txt"
"$Hash  $(Split-Path -Leaf $OutputZip)" | Set-Content -Encoding ASCII $HashFile

Write-Host "`nPhase 6.6 full local evidence packaged." -ForegroundColor Green
Write-Host "ZIP:      $OutputZip"
Write-Host "SHA-256:  $Hash"
Write-Host "Hash file: $HashFile"
Write-Host "`nThis archive is a review handoff artifact only. It does not merge or commit anything to Git."

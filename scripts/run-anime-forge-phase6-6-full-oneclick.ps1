param(
  [string]$EvidenceDir = "",
  [string]$RasterBackend = "resvg-js"
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

$Runner = Join-Path $ScriptRoot 'run-anime-forge-phase6-6-local.ps1'
$Packager = Join-Path $ScriptRoot 'package-anime-forge-phase6-6-local-evidence.ps1'
$Review = Join-Path $ScriptRoot 'open-anime-forge-phase6-6-review.ps1'
foreach ($file in @($Runner,$Packager,$Review)) {
  if (-not (Test-Path $file)) { throw "PHASE66_ONECLICK_COMPONENT_MISSING:$file" }
}

Write-Host "=== Phase 6.6 full one-click workflow ===" -ForegroundColor Cyan
Write-Host "Raster backend: $RasterBackend"
Write-Host "Evidence dir:   $EvidenceDir"

# Full validation only: no skip flags are allowed in this wrapper.
& $Runner -EvidenceDir $EvidenceDir -RasterBackend $RasterBackend -Install
if ($LASTEXITCODE -ne 0) { throw "PHASE66_ONECLICK_VALIDATION_FAILED:$LASTEXITCODE" }

$SummaryFile = Join-Path $EvidenceDir 'local-validation-summary.json'
if (-not (Test-Path $SummaryFile)) { throw "PHASE66_ONECLICK_SUMMARY_MISSING:$SummaryFile" }
$Summary = Get-Content -Raw $SummaryFile | ConvertFrom-Json
if ($Summary.status -ne 'engineering-evidence-passed-awaiting-human-review' -or $Summary.full_validation -ne $true) {
  throw "PHASE66_ONECLICK_NOT_FULL_VALIDATION:$($Summary.status)"
}

& $Packager -EvidenceDir $EvidenceDir
if ($LASTEXITCODE -ne 0) { throw "PHASE66_ONECLICK_PACKAGE_FAILED:$LASTEXITCODE" }

& $Review -EvidenceDir $EvidenceDir
if ($LASTEXITCODE -ne 0) { throw "PHASE66_ONECLICK_REVIEW_LAUNCH_FAILED:$LASTEXITCODE" }

Write-Host "`n=== Phase 6.6 handoff ready ===" -ForegroundColor Green
Write-Host "1. Human Review is open in Reality Studio."
Write-Host "2. The evidence ZIP and SHA-256 file are next to the evidence directory."
Write-Host "3. Upload the ZIP back to the review conversation for independent inspection."
Write-Host "4. No Git commit, PR merge or Human acceptance was automated."

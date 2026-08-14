param(
  [string]$EvidenceDir = "",
  [int]$Port = 17666,
  [switch]$NoExplorer
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptRoot
$StudioRoot = Join-Path $RepoRoot "apps/reality-studio"

if ([string]::IsNullOrWhiteSpace($EvidenceDir)) {
  $EvidenceDir = Join-Path $RepoRoot "tmp/anime-forge-phase6-6-local-evidence"
} elseif ([System.IO.Path]::IsPathRooted($EvidenceDir)) {
  $EvidenceDir = [System.IO.Path]::GetFullPath($EvidenceDir)
} else {
  $EvidenceDir = [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $EvidenceDir))
}

if (-not (Test-Path $EvidenceDir)) { throw "EVIDENCE_DIR_MISSING:$EvidenceDir" }
$Required = @(
  "local-validation-summary.json",
  "evidence-ledger.json",
  "evidence-summary.json",
  "direct-visual-bridge.json",
  "temporal-drawing-stability-evidence.json",
  "temporal-evidence-bridge.json",
  "raster-provider-receipts.json",
  "backend-receipt.json"
)
$Missing = @($Required | Where-Object { -not (Test-Path (Join-Path $EvidenceDir $_)) })
if ($Missing.Count -gt 0) { throw "REVIEW_EVIDENCE_INCOMPLETE:$($Missing -join ',')" }
$Summary = Get-Content -Raw (Join-Path $EvidenceDir "local-validation-summary.json") | ConvertFrom-Json
if ($Summary.full_validation -ne $true -or $Summary.status -ne "engineering-evidence-passed-awaiting-human-review") {
  throw "HUMAN_REVIEW_REQUIRES_FULL_VALIDATION:$($Summary.status)"
}

$NodeConfigured = [Environment]::GetEnvironmentVariable("PHASE66_NODE_PATH")
if ($NodeConfigured) {
  if (Test-Path $NodeConfigured) { $Node = (Resolve-Path $NodeConfigured).Path }
  else {
    $NodeCmd = Get-Command $NodeConfigured -ErrorAction SilentlyContinue
    if (-not $NodeCmd) { throw "PHASE66_NODE_PATH unavailable: $NodeConfigured" }
    $Node = $NodeCmd.Source
  }
} else {
  $NodeCmd = Get-Command node.exe,node -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $NodeCmd) { throw "NODE_NOT_FOUND" }
  $Node = $NodeCmd.Source
}

$HealthUrl = "http://127.0.0.1:$Port/api/health"
$ReviewUrl = "http://127.0.0.1:$Port/native-drawing-review.html"
$ServerReady = $false
try {
  $Health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
  if ($Health) { $ServerReady = $true }
} catch {}

if (-not $ServerReady) {
  Write-Host "Starting Reality Studio on port $Port..." -ForegroundColor Cyan
  $Server = Start-Process -FilePath $Node -ArgumentList @("src/cli.mjs","serve","--port",[string]$Port) -WorkingDirectory $StudioRoot -PassThru -WindowStyle Hidden
  for ($i=0; $i -lt 120; $i++) {
    Start-Sleep -Milliseconds 125
    if ($Server.HasExited) { throw "REALITY_STUDIO_SERVER_EXITED:$($Server.ExitCode)" }
    try {
      $Health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
      if ($Health) { $ServerReady = $true; break }
    } catch {}
  }
  if (-not $ServerReady) { throw "REALITY_STUDIO_SERVER_TIMEOUT:$HealthUrl" }
}

if (-not $NoExplorer) {
  try { Start-Process explorer.exe -ArgumentList @($EvidenceDir) | Out-Null } catch {}
}
Start-Process $ReviewUrl | Out-Null

Write-Host "`nReality Studio Human Review ready." -ForegroundColor Green
Write-Host "Review URL: $ReviewUrl"
Write-Host "Artifact:   $EvidenceDir"
Write-Host "`nIn the page, click '载入 Artifact 目录' and select the artifact directory above."
Write-Host "The browser File API intentionally requires this explicit human directory selection."
Write-Host "No review action can automatically commit, merge, or mutate Episode / Genome / Canonical Morphology."

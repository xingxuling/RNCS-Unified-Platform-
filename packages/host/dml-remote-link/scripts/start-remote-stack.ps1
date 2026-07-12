param(
  [string]$AllowedOrigin = "",
  [int]$RelayPort = 17901
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root
$Node = (Get-Command node -ErrorAction Stop).Source
$SavedConfigPath = Join-Path $Root "config\remote-stack.json"
$SavedConfig = $null
if (Test-Path $SavedConfigPath) {
  $SavedConfig = Get-Content $SavedConfigPath -Raw | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) { $AllowedOrigin = [string]$SavedConfig.allowed_origin }
  if ($SavedConfig.relay_port) { $RelayPort = [int]$SavedConfig.relay_port }
}

$TunnelRuntimePath = Join-Path $Root "config\cloudflared-runtime.json"
if (-not (Test-Path $TunnelRuntimePath)) { throw "尚未配置命名 Tunnel。请先运行 首次配置数字蓝天机远程链.bat" }
$TunnelInfo = Get-Content $TunnelRuntimePath -Raw | ConvertFrom-Json
$Cloudflared = [string]$TunnelInfo.cloudflared_path
if (-not (Test-Path $Cloudflared)) {
  $Cloudflared = (Get-Command cloudflared -ErrorAction Stop).Source
}
$TunnelConfig = [string]$TunnelInfo.config_path

if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) {
  $AllowedOrigin = Read-Host "请输入 Lovable 发布 Origin，例如 https://your-app.lovable.app"
}
if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) { throw "必须提供工作台 Origin。" }

$RelayArgs = @("src/relay/cli.mjs", "serve", "--host", "127.0.0.1", "--port", "$RelayPort", "--origins", $AllowedOrigin, "--state", "state/relay")
$Relay = Start-Process -FilePath $Node -ArgumentList $RelayArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal

$Ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $Health = Invoke-RestMethod -Uri "http://127.0.0.1:$RelayPort/health" -TimeoutSec 2
    if ($Health.status -eq "ok") { $Ready = $true; break }
  } catch {}
}
if (-not $Ready) {
  Stop-Process -Id $Relay.Id -Force -ErrorAction SilentlyContinue
  throw "Relay 未能启动。"
}

$HostArgs = @("src/host/cli.mjs", "run", "--state", "state/host", "--policy", "config/host-policy.example.json")
$HostProcess = Start-Process -FilePath $Node -ArgumentList $HostArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal
$TunnelArgs = @("tunnel", "--config", $TunnelConfig, "run")
$TunnelProcess = Start-Process -FilePath $Cloudflared -ArgumentList $TunnelArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal

$Processes = @{
  relay_pid = $Relay.Id
  host_pid = $HostProcess.Id
  tunnel_pid = $TunnelProcess.Id
  started_at = (Get-Date).ToUniversalTime().ToString("o")
}
$Processes | ConvertTo-Json | Set-Content -Path (Join-Path $Root "state\remote-stack-processes.json") -Encoding UTF8

Write-Host "DML 远程链已启动。" -ForegroundColor Green
Write-Host "Relay PID: $($Relay.Id)"
Write-Host "Host PID: $($HostProcess.Id)"
Write-Host "Tunnel PID: $($TunnelProcess.Id)"

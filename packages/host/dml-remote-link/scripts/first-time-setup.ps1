param(
  [string]$TunnelName = "dml-blue-tianji",
  [string]$Hostname = "",
  [string]$AllowedOrigin = "",
  [int]$RelayPort = 17901
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root
$Node = (Get-Command node -ErrorAction Stop).Source

if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) {
  $AllowedOrigin = Read-Host "请输入 Lovable 发布 Origin，例如 https://your-app.lovable.app"
}
if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) { throw "必须提供 Lovable Origin。" }

Write-Host "[1/6] 配置 Cloudflare Named Tunnel" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "setup-cloudflare-tunnel.ps1") -TunnelName $TunnelName -Hostname $Hostname -RelayPort $RelayPort | Out-Null
$TunnelInfo = Get-Content (Join-Path $Root "config\cloudflared-runtime.json") -Raw | ConvertFrom-Json
$PublicBase = "https://$($TunnelInfo.hostname)"

Write-Host "[2/6] 创建 DML 会话" -ForegroundColor Cyan
$SessionText = & $Node "src/relay/cli.mjs" create-session --state "state/relay" --name "数字蓝天机" | Out-String
if ($LASTEXITCODE -ne 0) { throw "DML 会话创建失败。" }
$Session = $SessionText | ConvertFrom-Json

Write-Host "[3/6] 启动 Relay 与 Tunnel" -ForegroundColor Cyan
$RelayArgs = @("src/relay/cli.mjs", "serve", "--host", "127.0.0.1", "--port", "$RelayPort", "--origins", $AllowedOrigin, "--state", "state/relay")
$Relay = Start-Process -FilePath $Node -ArgumentList $RelayArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal

$Ready = $false
for ($i = 0; $i -lt 40; $i++) {
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

$TunnelArgs = @("tunnel", "--config", [string]$TunnelInfo.config_path, "run")
$Tunnel = Start-Process -FilePath ([string]$TunnelInfo.cloudflared_path) -ArgumentList $TunnelArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal

$PublicReady = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try {
    $Health = Invoke-RestMethod -Uri "$PublicBase/health" -TimeoutSec 3
    if ($Health.status -eq "ok") { $PublicReady = $true; break }
  } catch {}
}
if (-not $PublicReady) {
  Write-Warning "公网健康检查暂未通过。Tunnel 可能仍在建立连接；脚本会继续尝试配对。"
}

Write-Host "[4/6] 配对本机 DML Host" -ForegroundColor Cyan
& $Node "src/host/cli.mjs" pair --relay $PublicBase --session ([string]$Session.session_id) --code ([string]$Session.pair_code) --state "state/host"
if ($LASTEXITCODE -ne 0) { throw "本机 Host 配对失败。请确认 Tunnel 已上线后重试。" }

Write-Host "[5/6] 保存运行配置并启动 Host" -ForegroundColor Cyan
$RuntimePath = "/v1/sessions/$([uri]::EscapeDataString([string]$Session.session_id))"
$RuntimeUrl = "$PublicBase$RuntimePath"
$RemoteConfig = @{
  format = "dml.remote-stack-config.v0.3"
  session_id = [string]$Session.session_id
  runtime_url = $RuntimeUrl
  public_base = $PublicBase
  hostname = [string]$TunnelInfo.hostname
  allowed_origin = $AllowedOrigin
  relay_port = $RelayPort
  tunnel_config = [string]$TunnelInfo.config_path
  cloudflared_path = [string]$TunnelInfo.cloudflared_path
  created_at = (Get-Date).ToUniversalTime().ToString("o")
}
$RemoteConfig | ConvertTo-Json | Set-Content -Path (Join-Path $Root "config\remote-stack.json") -Encoding UTF8

$HostArgs = @("src/host/cli.mjs", "run", "--state", "state/host", "--policy", "config/host-policy.example.json")
$HostProcess = Start-Process -FilePath $Node -ArgumentList $HostArgs -WorkingDirectory $Root -PassThru -WindowStyle Normal

$Processes = @{
  relay_pid = $Relay.Id
  tunnel_pid = $Tunnel.Id
  host_pid = $HostProcess.Id
  started_at = (Get-Date).ToUniversalTime().ToString("o")
}
$Processes | ConvertTo-Json | Set-Content -Path (Join-Path $Root "state\remote-stack-processes.json") -Encoding UTF8

Write-Host "[6/6] 完成" -ForegroundColor Green
Write-Host ""
Write-Host "Lovable 环境变量：" -ForegroundColor Yellow
Write-Host "VITE_DML_RUNTIME_URL=$RuntimeUrl"
Write-Host "VITE_DML_AUTH_MODE=device"
Write-Host ""
Write-Host "首次浏览器连接码：" -ForegroundColor Yellow
Write-Host ([string]$Session.browser_login_code) -ForegroundColor Green
Write-Host "有效期至：$([string]$Session.login_code_expires_at)"
Write-Host ""
Write-Host "请编辑 config\host-policy.example.json，把示例项目路径换成真实路径。" -ForegroundColor Cyan
Write-Host "随后在 Lovable 设置上面的两个变量并重新发布；页面会要求输入连接码。"

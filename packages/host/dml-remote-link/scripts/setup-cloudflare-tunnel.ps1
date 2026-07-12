param(
  [string]$TunnelName = "dml-blue-tianji",
  [string]$Hostname = "",
  [int]$RelayPort = 17901
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Resolve-Cloudflared {
  $Command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($Command) { return $Command.Source }

  $Winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($Winget) {
    Write-Host "未找到 cloudflared，正在通过 winget 安装……" -ForegroundColor Cyan
    & $Winget.Source install --id Cloudflare.cloudflared --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) { throw "cloudflared 自动安装失败。" }
  }

  $Candidates = @(
    (Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Links\cloudflared.exe"),
    (Join-Path $env:ProgramFiles "cloudflared\cloudflared.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "cloudflared\cloudflared.exe")
  ) | Where-Object { $_ -and (Test-Path $_) }
  if ($Candidates.Count -gt 0) { return $Candidates[0] }

  $Command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($Command) { return $Command.Source }
  throw "未找到 cloudflared，且无法自动安装。请安装后重新运行。"
}

$Cloudflared = Resolve-Cloudflared
if ([string]::IsNullOrWhiteSpace($Hostname)) {
  $Hostname = Read-Host "请输入固定公网域名，例如 relay.example.com"
}
if ([string]::IsNullOrWhiteSpace($Hostname)) { throw "必须提供公网域名。" }

$CloudflareDir = Join-Path $HOME ".cloudflared"
New-Item -ItemType Directory -Force -Path $CloudflareDir | Out-Null
$Cert = Join-Path $CloudflareDir "cert.pem"
if (-not (Test-Path $Cert)) {
  Write-Host "即将打开浏览器登录 Cloudflare，并授权一个域名。" -ForegroundColor Cyan
  & $Cloudflared tunnel login
  if ($LASTEXITCODE -ne 0) { throw "Cloudflare 登录失败。" }
}

$Existing = @(& $Cloudflared tunnel list --output json | ConvertFrom-Json) | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
if (-not $Existing) {
  Write-Host "创建命名 Tunnel：$TunnelName" -ForegroundColor Cyan
  & $Cloudflared tunnel create $TunnelName
  if ($LASTEXITCODE -ne 0) { throw "Tunnel 创建失败。" }
  $Existing = @(& $Cloudflared tunnel list --output json | ConvertFrom-Json) | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
}
if (-not $Existing) { throw "无法读取 Tunnel ID。" }

$TunnelId = [string]$Existing.id
$CredentialFile = Join-Path $CloudflareDir "$TunnelId.json"
if (-not (Test-Path $CredentialFile)) { throw "找不到 Tunnel 凭证：$CredentialFile" }

Write-Host "创建或复用 DNS 路由：$Hostname" -ForegroundColor Cyan
& $Cloudflared tunnel route dns $TunnelName $Hostname
if ($LASTEXITCODE -ne 0) {
  Write-Warning "DNS 路由命令返回非零状态。若该域名已绑定此 Tunnel，可以继续；否则请在 Cloudflare 控制台检查。"
}

$ConfigDir = Join-Path $Root "config"
$ConfigPath = Join-Path $ConfigDir "cloudflared-config.yml"
$CredentialYaml = $CredentialFile.Replace('\','/')
$Config = @"
tunnel: $TunnelId
credentials-file: $CredentialYaml

ingress:
  - hostname: $Hostname
    service: http://127.0.0.1:$RelayPort
  - service: http_status:404
"@
Set-Content -Path $ConfigPath -Value $Config -Encoding UTF8

$RuntimeConfig = @{
  tunnel_name = $TunnelName
  tunnel_id = $TunnelId
  hostname = $Hostname
  relay_port = $RelayPort
  config_path = $ConfigPath
  cloudflared_path = $Cloudflared
  updated_at = (Get-Date).ToUniversalTime().ToString("o")
}
$RuntimeConfig | ConvertTo-Json | Set-Content -Path (Join-Path $ConfigDir "cloudflared-runtime.json") -Encoding UTF8

Write-Host "" 
Write-Host "Cloudflare Named Tunnel 配置完成。" -ForegroundColor Green
Write-Host "公网健康检查：https://$Hostname/health"
Write-Output $RuntimeConfig

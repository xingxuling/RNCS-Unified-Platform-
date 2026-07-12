param([int]$TtlMinutes = 10)
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ConfigPath = Join-Path $Root "config\remote-stack.json"
if (-not (Test-Path $ConfigPath)) { throw "未找到远程链配置，请先运行首次配置向导。" }
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
Set-Location $Root
node src/relay/cli.mjs create-login-code --session ([string]$Config.session_id) --state state/relay --ttl-minutes "$TtlMinutes" --label "数字蓝天机工作台"

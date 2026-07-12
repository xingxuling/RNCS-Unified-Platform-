param(
  [string]$AllowedOrigin = "",
  [string]$TaskName = "DML-Blue-Tianji-Remote-Stack"
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($AllowedOrigin)) {
  $AllowedOrigin = Read-Host "请输入 Lovable 发布域名，例如 https://your-app.lovable.app"
}
$PowerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
$Script = Join-Path $Root "scripts\start-remote-stack.ps1"
$Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Script`" -AllowedOrigin `"$AllowedOrigin`""
$Action = New-ScheduledTaskAction -Execute $PowerShell -Argument $Arguments -WorkingDirectory $Root
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
$Settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 3650)
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null
Write-Host "已创建登录自启动任务：$TaskName" -ForegroundColor Green

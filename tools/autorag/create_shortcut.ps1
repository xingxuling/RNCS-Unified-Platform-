$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")

$Shortcut = $WshShell.CreateShortcut("$Desktop\RAG-System.lnk")
$Shortcut.TargetPath = Join-Path "C:\Users\User\auto-rag-system" "启动RAG系统.bat"
$Shortcut.WorkingDirectory = "C:\Users\User\auto-rag-system"
$Shortcut.Save()

$Shortcut2 = $WshShell.CreateShortcut("$Desktop\RAG-System-Full.lnk")
$Shortcut2.TargetPath = Join-Path "C:\Users\User\auto-rag-system" "RAG_Windows_Launcher.bat"
$Shortcut2.WorkingDirectory = "C:\Users\User\auto-rag-system"
$Shortcut2.Save()

Write-Host "Desktop shortcuts created successfully!" -ForegroundColor Green
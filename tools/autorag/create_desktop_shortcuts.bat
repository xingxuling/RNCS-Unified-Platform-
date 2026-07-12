@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RAG-System.lnk'); $Shortcut.TargetPath = '%~dp0启动RAG系统.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()}"
powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\RAG-System-Full.lnk'); $Shortcut.TargetPath = '%~dp0RAG_Windows_Launcher.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()}"
echo Desktop shortcuts created successfully!
pause
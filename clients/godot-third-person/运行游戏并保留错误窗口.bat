@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "PROJECT=%~dp0"
set "GODOT="

if not "%~1"=="" if exist "%~1" set "GODOT=%~1"
if not defined GODOT if exist "%PROJECT%Godot_v4.7-stable_win64_console.exe" set "GODOT=%PROJECT%Godot_v4.7-stable_win64_console.exe"
if not defined GODOT if exist "%PROJECT%Godot_v4.7-stable_win64.exe" set "GODOT=%PROJECT%Godot_v4.7-stable_win64.exe"
if not defined GODOT for %%G in (Godot_v4.7-stable_win64_console.exe godot4.exe godot.exe) do (
  where %%G >nul 2>nul && set "GODOT=%%G" && goto :found
)

:found
if not defined GODOT (
  echo [ERROR] 找不到 Godot 4.7 可执行文件。
  echo 请把 Godot_v4.7-stable_win64_console.exe 拖到本批处理上，
  echo 或把它复制到本工程目录。
  echo.
  pause
  exit /b 2
)

echo Godot: %GODOT%
echo Project: %PROJECT%
echo.
"%GODOT%" --path "%PROJECT%" --verbose
set "CODE=%ERRORLEVEL%"
echo.
echo Godot exit code: %CODE%
pause
exit /b %CODE%

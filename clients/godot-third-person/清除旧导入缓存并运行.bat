@echo off
setlocal EnableExtensions
chcp 65001 >nul
set "PROJECT=%~dp0"
echo 将删除本工程的 .godot 导入缓存，不会删除源码或存档。
if exist "%PROJECT%.godot" rmdir /s /q "%PROJECT%.godot"
echo 缓存已清除。
call "%PROJECT%运行游戏并保留错误窗口.bat" %*

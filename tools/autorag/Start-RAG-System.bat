@echo off
chcp 65001 >nul
title RAG System Launcher
color 0B

cls
echo ========================================
echo       RAG Automation System
echo ========================================
echo.

set "RAG_DIR=%~dp0"
cd /d "%RAG_DIR%"

python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found
    echo.
    echo Please install Python 3.8 or higher
    echo Download from: https://www.python.org/downloads/
    echo.
    echo Make sure to check: Add Python to PATH
    echo.
    pause
    exit /b 1
)

echo Python environment detected
echo.
echo Starting RAG System...
echo.

call RAG_Windows_Launcher.bat

pause
@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo       RAG System - Quick Start
echo ========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found!
    echo Please install Python 3.8+ from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo Starting RAG System...
echo This may take a few minutes...
echo.

if "%1"=="" (
    echo Usage: Double-click this file and drag a folder onto it
    echo Or run: Quick-Start-RAG.bat "C:\path\to\your\project"
    echo.
    echo Press any key to analyze the test-project...
    pause >nul
    set "TARGET=C:\Users\User\test-project"
) else (
    set "TARGET=%1"
)

if not exist "%TARGET%" (
    echo Error: Path not found: %TARGET%
    pause
    exit /b 1
)

echo Analyzing: %TARGET%
echo.

python main.py "%TARGET%"

echo.
echo ========================================
echo Analysis Complete!
echo ========================================
echo.
echo Check the output folder for results:
echo C:\Users\User\auto-rag-system\output\
echo.
pause
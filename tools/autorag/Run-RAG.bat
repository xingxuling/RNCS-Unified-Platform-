@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo       RAG Automation System
echo ========================================
echo.

if not exist "main.py" (
    echo Error: main.py not found!
    pause
    exit /b 1
)

python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.8+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo Please enter the project path to analyze:
set /p PROJECT_PATH="> "

if "%PROJECT_PATH%"=="" (
    echo No path provided. Using current directory.
    set "PROJECT_PATH=."
)

echo.
echo Analyzing: %PROJECT_PATH%
echo.

python main.py "%PROJECT_PATH%"

echo.
echo Done!
pause
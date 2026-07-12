@echo off
REM auto-rag-system Startup Script (Windows)
REM Version: 1.0.0

setlocal enabledelayedexpansion

echo ========================================
echo Starting RAG Automation System
echo ========================================
echo.

REM Check Python environment
echo [INFO] Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not installed
    echo Please install Python: https://www.python.com/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [SUCCESS] Python version: %PYTHON_VERSION%

REM Check dependencies
echo [INFO] Checking dependencies...
if exist "requirements.txt" (
    echo [INFO] Installing Python dependencies...
    pip install -r requirements.txt -q
    if errorlevel 1 (
        echo [WARNING] Dependency installation may have failed, continuing...
    ) else (
        echo [SUCCESS] Dependencies installed
    )
) else (
    echo [WARNING] requirements.txt not found
)

REM Check virtual environment
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Choose startup mode
echo.
echo Please select startup mode:
echo 1. Basic Analysis (main.py)
echo 2. Enhanced Analysis (main_enhanced.py)
echo 3. RAG App (rag_app.py)
echo 4. Automation Simple (rag_automation_simple.py)
echo 5. Monitoring System (run_monitoring_system.py)
echo.

set /p choice="Enter choice (1-5, default 1): "

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    set "ENTRY_FILE=main.py"
    echo [INFO] Starting basic analysis mode...
) else if "%choice%"=="2" (
    set "ENTRY_FILE=main_enhanced.py"
    echo [INFO] Starting enhanced analysis mode...
) else if "%choice%"=="3" (
    set "ENTRY_FILE=rag_app.py"
    echo [INFO] Starting RAG app mode...
) else if "%choice%"=="4" (
    set "ENTRY_FILE=rag_automation_simple.py"
    echo [INFO] Starting automation simple mode...
) else if "%choice%"=="5" (
    set "ENTRY_FILE=run_monitoring_system.py"
    echo [INFO] Starting monitoring system...
) else (
    set "ENTRY_FILE=main.py"
    echo [INFO] Using default mode: Basic Analysis
)

REM Check entry file
if not exist "%ENTRY_FILE%" (
    echo [ERROR] Entry file not found: %ENTRY_FILE%
    echo Available files:
    dir /b *.py 2>nul | findstr /i "main rag run"
    if errorlevel 1 echo No available files
    pause
    exit /b 1
)

echo [SUCCESS] Using entry file: %ENTRY_FILE%

REM Run parameters
echo.
echo [INFO] Enter project path for analysis (press Enter to use test project):
set /p project_path="Project path: "

if "%project_path%"=="" (
    set "project_path=test-project"
    echo [INFO] Using test project: %project_path%
)

REM Start app
echo.
echo ========================================
echo [INFO] Starting RAG Automation System
echo ========================================
echo.

if "%ENTRY_FILE%"=="rag_app.py" (
    python "%ENTRY_FILE%"
) else (
    python "%ENTRY_FILE%" "%project_path%"
)

set EXIT_CODE=%errorlevel%

echo.
echo ========================================
if %EXIT_CODE% equ 0 (
    echo [SUCCESS] RAG system completed successfully
) else (
    echo [ERROR] RAG system failed (exit code: %EXIT_CODE%)
)
echo ========================================

REM Display results directory
if exist "output" (
    for /f "delims=" %%i in ('dir /b /ad /o-d output 2^>nul ^| findstr /n "." ^| findstr "^1:"') do (
        set "LATEST_OUTPUT=%%i"
        set "LATEST_OUTPUT=!LATEST_OUTPUT:~2!"
    )
    if defined LATEST_OUTPUT (
        echo.
        echo [INFO] Latest analysis results:
        echo   output\%LATEST_OUTPUT%\
        echo.
        echo Generated files:
        dir /b "output\%LATEST_OUTPUT%\*.json" "output\%LATEST_OUTPUT%\*.txt" "output\%LATEST_OUTPUT%\*.md" 2>nul
    )
)

echo.
echo Tips:
echo   - View documentation: type README.md
echo   - Use enhanced features: python main_enhanced.py ^<project path^>
echo   - Monitoring system: python run_monitoring_system.py
echo.

pause
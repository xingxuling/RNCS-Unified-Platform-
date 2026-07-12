@echo off
echo ========================================
echo     AutoRAG 簡單安裝器
echo ========================================
echo.

echo 步驟 1: 檢查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Python
    echo 請先安裝 Python 3.8+ 並添加到 PATH
    pause
    exit /b 1
)
echo Python 已安裝
echo.

echo 步驟 2: 生成 EXE 文件...
echo 這可能需要幾分鐘時間...
python build_exe.py
if errorlevel 1 (
    echo EXE 生成失敗
    pause
    exit /b 1
)
echo EXE 生成成功
echo.

echo 步驟 3: 安裝完成!
echo.
echo 安裝結果:
if exist "dist\AutoRAG.exe" (
    echo ✅ EXE 文件: dist\AutoRAG.exe
) else (
    echo ❌ EXE 文件生成失敗
)

echo.
echo 使用方法:
echo 1. 運行 dist\AutoRAG.exe
echo 2. 或查看 README_ENHANCED.md 獲取詳細信息
echo.
echo ========================================
pause
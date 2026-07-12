# PowerShell script for Tauri desktop app setup (Windows)

Write-Host "🚀 Setting up Tauri for The Seed Engine..." -ForegroundColor Cyan

# Check if Rust is installed
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust is installed: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust is not installed. Please install Rust first:" -ForegroundColor Red
    Write-Host "   Visit: https://www.rust-lang.org/tools/install" -ForegroundColor Yellow
    exit 1
}

# Install Tauri CLI if not already installed
if (-not (Get-Command tauri -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Tauri CLI..." -ForegroundColor Yellow
    npm install --save-dev @tauri-apps/cli @tauri-apps/api
} else {
    Write-Host "✅ Tauri CLI is already installed" -ForegroundColor Green
}

# Check if src-tauri exists
if (-not (Test-Path "src-tauri")) {
    Write-Host "📦 Initializing Tauri..." -ForegroundColor Yellow
    Write-Host "   When prompted:" -ForegroundColor Gray
    Write-Host "   - App name: The Seed Engine" -ForegroundColor Gray
    Write-Host "   - Window title: The Seed Engine" -ForegroundColor Gray
    Write-Host "   - Dist dir: ../dist" -ForegroundColor Gray
    Write-Host "   - Dev path: http://localhost:5173" -ForegroundColor Gray
    Write-Host "   - Build command: npm run build" -ForegroundColor Gray
    npx tauri init
} else {
    Write-Host "✅ Tauri is already initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Tauri setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Build the app: npm run build" -ForegroundColor Gray
Write-Host "  2. Run in dev mode: npm run tauri dev" -ForegroundColor Gray
Write-Host "  3. Build desktop app: npm run tauri build" -ForegroundColor Gray
Write-Host ""


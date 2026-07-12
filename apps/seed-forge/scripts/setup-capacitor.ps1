# PowerShell script for Capacitor mobile app setup (Windows)

Write-Host "🚀 Setting up Capacitor for The Seed Engine..." -ForegroundColor Cyan

# Install Capacitor if not already installed
if (-not (Get-Command cap -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Capacitor..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli
    npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
} else {
    Write-Host "✅ Capacitor is already installed" -ForegroundColor Green
}

# Initialize Capacitor if not already initialized
if (-not (Test-Path "capacitor.config.ts")) {
    Write-Host "📦 Initializing Capacitor..." -ForegroundColor Yellow
    Write-Host "   When prompted:" -ForegroundColor Gray
    Write-Host "   - App name: The Seed Engine" -ForegroundColor Gray
    Write-Host "   - App ID: com.taowind.seed" -ForegroundColor Gray
    Write-Host "   - Web dir: dist" -ForegroundColor Gray
    npx cap init "The Seed Engine" "com.taowind.seed"
} else {
    Write-Host "✅ Capacitor is already initialized" -ForegroundColor Green
}

# Add platforms
if (-not (Test-Path "android")) {
    Write-Host "📦 Adding Android platform..." -ForegroundColor Yellow
    npx cap add android
}

if (-not (Test-Path "ios")) {
    Write-Host "📦 Adding iOS platform..." -ForegroundColor Yellow
    npx cap add ios
}

# Build the app
Write-Host "📦 Building the app..." -ForegroundColor Yellow
npm run build

# Sync to native projects
Write-Host "📦 Syncing to native projects..." -ForegroundColor Yellow
npx cap sync

Write-Host ""
Write-Host "✅ Capacitor setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Android: npx cap open android" -ForegroundColor Gray
Write-Host "  2. iOS: npx cap open ios" -ForegroundColor Gray
Write-Host "  3. Build APK: cd android && ./gradlew assembleDebug" -ForegroundColor Gray
Write-Host ""


#!/bin/bash
# Setup script for Capacitor mobile app

echo "🚀 Setting up Capacitor for The Seed Engine..."

# Install Capacitor if not already installed
if ! command -v cap &> /dev/null; then
    echo "📦 Installing Capacitor..."
    npm install @capacitor/core @capacitor/cli
    npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
else
    echo "✅ Capacitor is already installed"
fi

# Initialize Capacitor if not already initialized
if [ ! -f "capacitor.config.ts" ]; then
    echo "📦 Initializing Capacitor..."
    echo "   When prompted:"
    echo "   - App name: The Seed Engine"
    echo "   - App ID: com.taowind.seed"
    echo "   - Web dir: dist"
    npx cap init "The Seed Engine" "com.taowind.seed"
else
    echo "✅ Capacitor is already initialized"
fi

# Add platforms
if [ ! -d "android" ]; then
    echo "📦 Adding Android platform..."
    npx cap add android
fi

if [ ! -d "ios" ]; then
    echo "📦 Adding iOS platform..."
    npx cap add ios
fi

# Build the app
echo "📦 Building the app..."
npm run build

# Sync to native projects
echo "📦 Syncing to native projects..."
npx cap sync

echo ""
echo "✅ Capacitor setup complete!"
echo ""
echo "Next steps:"
echo "  1. Android: npx cap open android"
echo "  2. iOS: npx cap open ios"
echo "  3. Build APK: cd android && ./gradlew assembleDebug"
echo ""


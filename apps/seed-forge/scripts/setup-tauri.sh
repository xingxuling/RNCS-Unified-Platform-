#!/bin/bash
# Setup script for Tauri desktop app

echo "🚀 Setting up Tauri for The Seed Engine..."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   Visit: https://www.rust-lang.org/tools/install"
    exit 1
fi

echo "✅ Rust is installed: $(rustc --version)"

# Install Tauri CLI if not already installed
if ! command -v tauri &> /dev/null; then
    echo "📦 Installing Tauri CLI..."
    npm install --save-dev @tauri-apps/cli @tauri-apps/api
else
    echo "✅ Tauri CLI is already installed"
fi

# Check if src-tauri exists
if [ ! -d "src-tauri" ]; then
    echo "📦 Initializing Tauri..."
    echo "   When prompted:"
    echo "   - App name: The Seed Engine"
    echo "   - Window title: The Seed Engine"
    echo "   - Dist dir: ../dist"
    echo "   - Dev path: http://localhost:5173"
    echo "   - Build command: npm run build"
    npx tauri init
else
    echo "✅ Tauri is already initialized"
fi

echo ""
echo "✅ Tauri setup complete!"
echo ""
echo "Next steps:"
echo "  1. Build the app: npm run build"
echo "  2. Run in dev mode: npm run tauri dev"
echo "  3. Build desktop app: npm run tauri build"
echo ""


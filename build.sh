#!/bin/bash

# Pins & Needles Show Controller - Quick Build Script

echo "🎭 Pins & Needles Show Controller Builder"
echo "=========================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "Select build option:"
echo "1) Development mode (run app with hot-reload)"
echo "2) Build for Windows"
echo "3) Build for macOS"
echo "4) Build for Linux"
echo "5) Build for all platforms"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting development mode..."
        npm run dev
        ;;
    2)
        echo ""
        echo "🔨 Building for Windows..."
        npm run build:win
        echo ""
        echo "✓ Build complete! Check the 'release/' folder for the installer."
        ;;
    3)
        echo ""
        echo "🔨 Building for macOS..."
        npm run build:mac
        echo ""
        echo "✓ Build complete! Check the 'release/' folder for the installer."
        ;;
    4)
        echo ""
        echo "🔨 Building for Linux..."
        npm run build:linux
        echo ""
        echo "✓ Build complete! Check the 'release/' folder for the installer."
        ;;
    5)
        echo ""
        echo "🔨 Building for all platforms..."
        npm run build
        echo ""
        echo "✓ Build complete! Check the 'release/' folder for the installers."
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

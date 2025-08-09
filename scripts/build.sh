#!/bin/bash
set -e

echo "🚀 Starting ConstructPro production build process..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if Next.js is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found, installing..."
    npm install -g npx
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next dist

# Build Next.js application (this creates the required .next directory)
echo "📦 Building Next.js application..."
npx next build

# Build Vite client assets for compatibility
echo "🎯 Building Vite client assets..."
npm run build:vite || npx vite build

# Build server bundle
echo "⚡ Building server bundle..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build completed successfully!"
echo "📁 Generated files:"
echo "   - .next/ (Next.js production build - REQUIRED FOR DEPLOYMENT)"
echo "   - dist/public/ (Vite client assets)"
echo "   - dist/index.js (Server bundle)"

# Verify .next directory exists
if [ -d ".next" ]; then
    echo "✅ .next directory created successfully - deployment ready!"
else
    echo "❌ .next directory not found - deployment will fail!"
    exit 1
fi
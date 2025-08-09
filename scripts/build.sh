#!/bin/bash

# ConstructPro Build Script
# This ensures the proper Next.js production build is created

echo "🚀 Starting ConstructPro build process..."

# Change to project root
cd "$(dirname "$0")/.."

# Run the comprehensive build process
node build.js

echo "✅ Build process completed!"
echo "📁 Generated Next.js production build in .next/"
echo "🌐 Application ready for deployment!"
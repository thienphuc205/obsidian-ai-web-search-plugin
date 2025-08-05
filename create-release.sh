#!/bin/bash

# 🎯 Create Release Files for Obsidian Plugin Submission

echo "📦 Creating release files..."

# Create releases directory
mkdir -p releases/v2.0.0

# Copy required files
cp main.js releases/v2.0.0/
cp manifest.json releases/v2.0.0/
cp styles.css releases/v2.0.0/

echo "✅ Release files created in releases/v2.0.0/"
echo ""
echo "📋 Files included:"
ls -la releases/v2.0.0/

echo ""
echo "🚀 Next steps:"
echo "1. Upload these files to GitHub release"
echo "2. Tag as v2.0.0"
echo "3. Submit to obsidian-releases repository"

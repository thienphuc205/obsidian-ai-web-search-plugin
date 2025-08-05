#!/bin/bash

# 🎯 Simple Manual Release Guide
# No authentication needed - just copy/paste instructions

clear
echo "🏷️ GitHub Release Creation Guide"
echo "================================="
echo ""

# Get version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')

echo "📋 Plugin Version: v$VERSION"
echo "📁 Release Files: releases/v$VERSION/"
echo ""

echo "🌐 Step 1: Open GitHub Release Page"
echo "👆 Click this link: https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/new"
echo ""

echo "📝 Step 2: Fill Release Form"
echo "┌─────────────────────────────────────────┐"
echo "│ Tag: v$VERSION                           │"
echo "│ Title: AI Web Search Plugin v$VERSION   │"
echo "└─────────────────────────────────────────┘"
echo ""

echo "📄 Step 3: Copy This Description:"
echo "┌─────────────────────────────────────────┐"
cat << 'EOF'
# AI Web Search Plugin v2.0.0

## ✨ Features
- **🤖 Multiple AI Providers**: Google Gemini, Perplexity AI, Tavily, and Exa neural search
- **🎥 Smart YouTube Context Mode**: Analyze videos and ask follow-up questions
- **🔗 Enhanced Citation System**: Clickable sources with smooth scrolling
- **🌍 Multiple Language Support**: Vietnamese and English interface
- **🔍 Research Modes**: Quick, Comprehensive, Deep, and Reasoning modes
- **💬 Advanced Chat Interface**: Persistent conversations with Send & Save

## 🚀 Installation
1. Download the 3 required files below
2. Create folder: `.obsidian/plugins/ai-web-search/`
3. Place files in the folder
4. Enable plugin in Obsidian settings

## 🔧 Setup Guide
1. **Get API Keys**:
   - 🔸 **Google Gemini**: [Get API Key](https://makersuite.google.com/app/apikey)
   - 🔸 **Perplexity AI**: [Get API Key](https://www.perplexity.ai/settings/api)
   - 🔸 **Tavily**: [Get API Key](https://app.tavily.com/)
   - 🔸 **Exa**: [Get API Key](https://exa.ai/)

2. **Configure**: Obsidian Settings → Community Plugins → AI Web Search

---
**Made with ❤️ for the Obsidian community**
EOF
echo "└─────────────────────────────────────────┘"
echo ""

echo "📎 Step 4: Upload These 3 Files:"
echo "┌─────────────────────────────────────────┐"
echo "│ releases/v$VERSION/main.js               │"
echo "│ releases/v$VERSION/manifest.json         │" 
echo "│ releases/v$VERSION/styles.css            │"
echo "└─────────────────────────────────────────┘"
echo ""

echo "✅ Step 5: Publish Release"
echo "- Check: 'Set as the latest release'"
echo "- Click: 'Publish release'"
echo ""

echo "🎯 Files Ready to Upload:"
ls -la releases/v$VERSION/

echo ""
echo "🚀 Ready? Press Enter when you've created the release..."
read

echo ""
echo "✅ Great! Now let's do Step 2..."

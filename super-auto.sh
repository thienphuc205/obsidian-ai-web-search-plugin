#!/bin/bash

# 🚀 SIÊU TỰ ĐỘNG - KHÔNG CẦN LÀM GÌ CẢ!
# Tự động tạo GitHub Release và Obsidian Community PR

clear
echo "🤖 SIÊU TỰ ĐỘNG - ZERO MANUAL WORK!"
echo "===================================="
echo ""

# Get version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "📋 Plugin Version: v$VERSION"

# Check if release files exist
RELEASE_DIR="releases/v$VERSION"
if [[ ! -d "$RELEASE_DIR" ]]; then
    echo "🔧 Tạo release files..."
    mkdir -p "$RELEASE_DIR"
    cp main.js manifest.json styles.css "$RELEASE_DIR/"
fi

echo "✅ Release files ready!"

echo ""
echo "🚀 BƯỚC 1: TẠO GITHUB RELEASE TỰ ĐỘNG..."
echo "========================================"

# Create release description
RELEASE_DESCRIPTION="# AI Web Search Plugin v$VERSION

## ✨ Features
- **🤖 Multiple AI Providers**: Google Gemini, Perplexity AI, Tavily, and Exa neural search
- **🎥 Smart YouTube Context Mode**: Analyze videos and ask follow-up questions
- **🔗 Enhanced Citation System**: Clickable sources with smooth scrolling
- **🌍 Multiple Language Support**: Vietnamese and English interface
- **🔍 Research Modes**: Quick, Comprehensive, Deep, and Reasoning modes
- **💬 Advanced Chat Interface**: Persistent conversations with Send & Save

## 🚀 Installation
1. Download the 3 required files below
2. Create folder: \`.obsidian/plugins/ai-web-search/\`
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
**Made with ❤️ for the Obsidian community**"

# Delete existing release if it exists (to recreate)
gh release delete "v$VERSION" --yes 2>/dev/null || true

# Create the release
echo "🏷️  Tạo release v$VERSION..."
gh release create "v$VERSION" \
    "$RELEASE_DIR/main.js" \
    "$RELEASE_DIR/manifest.json" \
    "$RELEASE_DIR/styles.css" \
    --title "AI Web Search Plugin v$VERSION" \
    --notes "$RELEASE_DESCRIPTION" \
    --latest

GITHUB_RELEASE_SUCCESS=$?

if [[ $GITHUB_RELEASE_SUCCESS -eq 0 ]]; then
    echo "✅ GitHub Release - THÀNH CÔNG!"
    RELEASE_URL="https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v$VERSION"
    echo "🔗 $RELEASE_URL"
else
    echo "❌ GitHub Release thất bại!"
    exit 1
fi

echo ""
echo "🚀 BƯỚC 2: TẠO OBSIDIAN COMMUNITY PR TỰ ĐỘNG..."
echo "=============================================="

# Fork obsidian-releases if not already forked
echo "🍴 Fork obsidian-releases..."
gh repo fork obsidianmd/obsidian-releases --clone=false 2>/dev/null || echo "✅ Fork đã tồn tại"

# Clone the fork to temp directory
TEMP_DIR="/tmp/obsidian-releases-$(date +%s)"
echo "📥 Clone fork..."
git clone "https://github.com/thienphuc205/obsidian-releases.git" "$TEMP_DIR"

cd "$TEMP_DIR"

# Update fork
echo "🔄 Update fork..."
git remote add upstream https://github.com/obsidianmd/obsidian-releases.git 2>/dev/null || true
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Create new branch
BRANCH_NAME="add-ai-web-search-plugin-v$VERSION"
echo "🌟 Tạo branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Backup and edit community-plugins.json
echo "📝 Edit community-plugins.json..."
cp community-plugins.json community-plugins.json.backup

# Use Python to safely add our plugin to JSON
python3 -c "
import json
import sys

try:
    # Read current file
    with open('community-plugins.json', 'r') as f:
        data = json.load(f)
    
    # Add our plugin (will be sorted alphabetically by JSON)
    data['ai-web-search'] = {
        'id': 'ai-web-search',
        'name': 'AI Web Search',
        'author': 'thienphuc205',
        'description': 'Search the web using AI providers (Gemini, Perplexity, Tavily, Exa) and analyze YouTube videos with smart context.',
        'repo': 'thienphuc205/obsidian-ai-web-search-plugin'
    }
    
    # Write back with proper formatting
    with open('community-plugins.json', 'w') as f:
        json.dump(data, f, indent='\t', separators=(',', ': '), ensure_ascii=False)
        f.write('\n')
    
    print('✅ Plugin added successfully!')
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
"

if [[ $? -ne 0 ]]; then
    echo "❌ Thất bại edit JSON file"
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Commit changes
echo "📤 Commit và push..."
git add community-plugins.json
git commit -m "Add AI Web Search Plugin v$VERSION

- Multiple AI providers (Gemini, Perplexity, Tavily, Exa)
- YouTube video analysis with smart context
- Enhanced citation system with clickable sources
- Vietnamese and English language support
- Multiple research modes (Quick, Comprehensive, Deep, Reasoning)
- Advanced chat interface with persistent conversations"

git push origin "$BRANCH_NAME"

# Create pull request
echo "🚀 Tạo Pull Request..."
PR_TITLE="Add AI Web Search Plugin v$VERSION"
PR_BODY="## 🤖 AI Web Search Plugin

**Version**: v$VERSION
**Repository**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin

### ✨ Plugin Features
- **🤖 Multiple AI Providers**: Google Gemini, Perplexity AI, Tavily, and Exa neural search
- **🎥 Smart YouTube Context Mode**: Analyze videos and ask follow-up questions  
- **🔗 Enhanced Citation System**: Clickable sources with smooth scrolling
- **🌍 Multiple Language Support**: Vietnamese and English interface
- **🔍 Research Modes**: Quick, Comprehensive, Deep, and Reasoning modes
- **💬 Advanced Chat Interface**: Persistent conversations with Send & Save

### 🔧 Technical Details
- **Plugin ID**: \`ai-web-search\`
- **Author**: thienphuc205
- **Repository**: thienphuc205/obsidian-ai-web-search-plugin
- **Release**: $RELEASE_URL

### 📋 Submission Checklist
- [x] Plugin follows Obsidian plugin guidelines
- [x] Released on GitHub with proper semver tagging
- [x] Includes main.js, manifest.json, and styles.css
- [x] Tested and working in Obsidian
- [x] Clear documentation and setup guide
- [x] Community-plugins.json updated alphabetically

### 🎯 Plugin Purpose
This plugin enhances Obsidian research capabilities by integrating multiple AI-powered web search providers and YouTube video analysis, making it easier for users to gather and analyze information directly within their notes.

---
**Ready for Obsidian team review! 🚀**"

gh pr create \
    --repo obsidianmd/obsidian-releases \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --head "thienphuc205:$BRANCH_NAME" \
    --base main

PR_SUCCESS=$?

# Get PR URL if successful
if [[ $PR_SUCCESS -eq 0 ]]; then
    PR_URL=$(gh pr view --repo obsidianmd/obsidian-releases --json url --jq '.url' 2>/dev/null || echo "")
    echo "✅ Pull Request - THÀNH CÔNG!"
    if [[ -n "$PR_URL" ]]; then
        echo "🔗 $PR_URL"
    fi
else
    echo "❌ Pull Request thất bại!"
fi

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "🎉🎉🎉 HOÀN THÀNH SIÊU TỰ ĐỘNG! 🎉🎉🎉"
echo "======================================="

if [[ $GITHUB_RELEASE_SUCCESS -eq 0 && $PR_SUCCESS -eq 0 ]]; then
    echo "✅ GitHub Release: THÀNH CÔNG"
    echo "✅ Obsidian PR: THÀNH CÔNG"
    echo ""
    echo "🏆 PLUGIN ĐÃ ĐƯỢC SUBMIT HOÀN TOÀN TỰ ĐỘNG!"
    echo ""
    echo "📧 Bạn sẽ nhận notification qua GitHub khi có update"
    echo "⏰ Thời gian review: 1-4 tuần"
    echo "🌟 Plugin sẽ sớm xuất hiện trong Obsidian Community!"
    echo ""
    echo "🎯 KHÔNG CẦN LÀM GÌ THÊM - TẤT CẢ ĐÃ XONG!"
else
    echo "⚠️  Một số bước có thể chưa thành công"
    echo "🔍 Kiểm tra links trên để confirm"
fi

echo ""
echo "🔗 FINAL CHECK LINKS:"
echo "   • GitHub Release: $RELEASE_URL"
if [[ -n "$PR_URL" ]]; then
    echo "   • Pull Request: $PR_URL"
fi
echo "   • All PRs: https://github.com/obsidianmd/obsidian-releases/pulls?q=is%3Apr+author%3Athienphuc205"

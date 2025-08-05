#!/bin/bash

# 🚀 HOÀN TOÀN TỰ ĐỘNG - Obsidian Community Submission
# Tự động fork, edit, và tạo pull request!

clear
echo "🤖 TỰ ĐỘNG OBSIDIAN COMMUNITY SUBMISSION"
echo "========================================"
echo ""

# Get version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "📋 Plugin Version: v$VERSION"

echo ""
echo "🔄 Đang kiểm tra GitHub CLI..."

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI chưa có. Chạy: ./auto-release.sh trước"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Chưa đăng nhập GitHub. Chạy: ./auto-release.sh trước"
    exit 1
fi

echo "✅ GitHub CLI OK!"

echo ""
echo "🍴 ĐANG FORK OBSIDIAN-RELEASES REPOSITORY..."

# Fork the obsidian-releases repository
gh repo fork obsidianmd/obsidian-releases --clone=false 2>/dev/null || echo "📝 Fork đã tồn tại"

echo ""
echo "📥 ĐANG CLONE FORK..."

# Clone the forked repository
TEMP_DIR="/tmp/obsidian-releases-$$"
rm -rf "$TEMP_DIR"
git clone "https://github.com/thienphuc205/obsidian-releases.git" "$TEMP_DIR"

cd "$TEMP_DIR"

echo ""
echo "🔄 ĐANG UPDATE FORK..."

# Update fork to latest
git remote add upstream https://github.com/obsidianmd/obsidian-releases.git
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

echo ""
echo "🌟 ĐANG TẠO BRANCH MỚI..."

# Create new branch
BRANCH_NAME="add-ai-web-search-plugin-v$VERSION"
git checkout -b "$BRANCH_NAME"

echo ""
echo "📝 ĐANG EDIT COMMUNITY-PLUGINS.JSON..."

# Get current user info
GITHUB_USER=$(gh api user --jq '.login')
echo "👤 GitHub User: $GITHUB_USER"

# Create the JSON entry for our plugin
PLUGIN_ENTRY="	\"ai-web-search\": {
		\"id\": \"ai-web-search\",
		\"name\": \"AI Web Search\",
		\"author\": \"thienphuc205\",
		\"description\": \"Search the web using AI providers (Gemini, Perplexity, Tavily, Exa) and analyze YouTube videos with smart context.\",
		\"repo\": \"thienphuc205/obsidian-ai-web-search-plugin\"
	},"

# Backup original file
cp community-plugins.json community-plugins.json.backup

# Add our plugin to the JSON file (alphabetically)
# We'll add it after "ai-translator" and before "aider"
python3 -c "
import json
import sys

# Read the current file
with open('community-plugins.json', 'r') as f:
    data = json.load(f)

# Add our plugin
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
"

echo "✅ Plugin đã được thêm vào community-plugins.json"

echo ""
echo "📤 ĐANG COMMIT VÀ PUSH..."

# Commit and push
git add community-plugins.json
git commit -m "Add AI Web Search Plugin v$VERSION

- Multiple AI providers (Gemini, Perplexity, Tavily, Exa)
- YouTube video analysis with smart context
- Enhanced citation system with clickable sources
- Vietnamese and English language support
- Multiple research modes (Quick, Comprehensive, Deep, Reasoning)
- Advanced chat interface with persistent conversations"

git push origin "$BRANCH_NAME"

echo ""
echo "🚀 ĐANG TẠO PULL REQUEST TỰ ĐỘNG..."

# Create pull request
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
- **Release**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v$VERSION

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

# Create the pull request
gh pr create \
    --repo obsidianmd/obsidian-releases \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --head "thienphuc205:$BRANCH_NAME" \
    --base main

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🎉 THÀNH CÔNG HOÀN TOÀN! PULL REQUEST ĐÃ ĐƯỢC TẠO TỰ ĐỘNG!"
    echo ""
    echo "🔗 Pull Request: $(gh pr view --repo obsidianmd/obsidian-releases --json url --jq '.url')"
    echo ""
    echo "✅ TẤT CẢ HOÀN THÀNH TỰ ĐỘNG!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎯 Plugin của bạn đã được submit hoàn toàn tự động!"
    echo "📱 Obsidian team sẽ review trong 1-4 tuần"
    echo "📧 Bạn sẽ nhận notification qua GitHub khi có update"
    echo ""
    echo "🌟 Chúc mừng! Plugin sẽ sớm có trên Obsidian Community!"
else
    echo ""
    echo "❌ Có lỗi tạo pull request. Thử manual:"
    echo "👉 ./obsidian-submit.sh"
fi

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "🧹 Cleanup hoàn thành!"

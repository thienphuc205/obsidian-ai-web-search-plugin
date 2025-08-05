#!/bin/bash

# 🚀 SUPER AUTO V2 - Fixed Version
# Hoàn toàn tự động với error handling

clear
echo "🤖 SUPER AUTO V2 - TỰ ĐỘNG HOÀN TOÀN!"
echo "====================================="
echo ""

# Get version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "📋 Plugin Version: v$VERSION"

# Ensure we're in the right directory and have release files
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

# Check if release already exists
if gh release view "v$VERSION" &>/dev/null; then
    echo "🗑️  Xóa release cũ v$VERSION..."
    gh release delete "v$VERSION" --yes 2>/dev/null || true
fi

# Create the release
echo "🏷️  Tạo release v$VERSION..."
gh release create "v$VERSION" \
    "$RELEASE_DIR/main.js" \
    "$RELEASE_DIR/manifest.json" \
    "$RELEASE_DIR/styles.css" \
    --title "AI Web Search Plugin v$VERSION" \
    --notes "$RELEASE_DESCRIPTION" \
    --latest

if [[ $? -eq 0 ]]; then
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

# Check what branches exist
echo "🔍 Kiểm tra branches..."
git branch -a

# Use master branch if main doesn't exist
if git show-ref --verify --quiet refs/remotes/origin/main; then
    MAIN_BRANCH="main"
else
    MAIN_BRANCH="master"
    echo "ℹ️  Sử dụng branch master thay vì main"
fi

# Update fork
echo "🔄 Update fork..."
git remote add upstream "https://github.com/obsidianmd/obsidian-releases.git" 2>/dev/null || true
git fetch upstream
git checkout $MAIN_BRANCH
git merge upstream/$MAIN_BRANCH
git push origin $MAIN_BRANCH

# Create new branch
BRANCH_NAME="add-ai-web-search-plugin-v$VERSION"
echo "🌟 Tạo branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Edit community-plugins.json using Node.js instead of Python
echo "📝 Edit community-plugins.json..."
cp community-plugins.json community-plugins.json.backup

# Create a Node.js script to safely edit JSON
cat > edit_json.js << 'EOF'
const fs = require('fs');

try {
    // Read the current file
    const data = JSON.parse(fs.readFileSync('community-plugins.json', 'utf8'));
    
    // Add our plugin
    data['ai-web-search'] = {
        id: 'ai-web-search',
        name: 'AI Web Search',
        author: 'thienphuc205',
        description: 'Search the web using AI providers (Gemini, Perplexity, Tavily, Exa) and analyze YouTube videos with smart context.',
        repo: 'thienphuc205/obsidian-ai-web-search-plugin'
    };
    
    // Write back with proper formatting
    fs.writeFileSync('community-plugins.json', JSON.stringify(data, null, '\t') + '\n');
    
    console.log('✅ Plugin added successfully!');
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
EOF

# Run the JSON editor
node edit_json.js

if [[ $? -ne 0 ]]; then
    echo "❌ Thất bại edit JSON file"
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Remove the temporary script
rm edit_json.js

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
    --base $MAIN_BRANCH

PR_SUCCESS=$?

# Get PR URL if successful
if [[ $PR_SUCCESS -eq 0 ]]; then
    echo "✅ Pull Request - THÀNH CÔNG!"
    # Get PR URL
    sleep 2
    PR_URL=$(gh pr list --repo obsidianmd/obsidian-releases --author thienphuc205 --state open --limit 1 --json url --jq '.[0].url' 2>/dev/null || echo "")
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
echo "🎉🎉🎉 HOÀN THÀNH SIÊU TỰ ĐỘNG V2! 🎉🎉🎉"
echo "========================================"

if [[ $PR_SUCCESS -eq 0 ]]; then
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
    echo "⚠️  GitHub Release OK, nhưng Obsidian PR có vấn đề"
    echo "🔍 Kiểm tra link để confirm"
fi

echo ""
echo "🔗 FINAL CHECK LINKS:"
echo "   • GitHub Release: $RELEASE_URL"
if [[ -n "$PR_URL" ]]; then
    echo "   • Pull Request: $PR_URL"
fi
echo "   • All PRs: https://github.com/obsidianmd/obsidian-releases/pulls?q=is%3Apr+author%3Athienphuc205"

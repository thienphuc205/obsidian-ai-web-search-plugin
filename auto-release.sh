#!/bin/bash

# 🚀 HOÀN TOÀN TỰ ĐỘNG - GitHub Release Creator
# Không cần làm gì thủ công!

clear
echo "🤖 TỰ ĐỘNG TẠO GITHUB RELEASE"
echo "=============================="
echo ""

# Check if we're in the right directory
if [[ ! -f "manifest.json" ]]; then
    echo "❌ Không tìm thấy manifest.json. Đang chuyển đến thư mục đúng..."
    cd /Volumes/Volumes/obsidian_search_plugin/gemini-web-search-plugin/gemini-web-search-plugin/
fi

# Get version
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
echo "📋 Plugin Version: v$VERSION"

# Check if release files exist
RELEASE_DIR="releases/v$VERSION"
if [[ ! -d "$RELEASE_DIR" ]]; then
    echo "❌ Thư mục release không tồn tại: $RELEASE_DIR"
    echo "🔧 Đang tạo release files..."
    
    # Create release directory
    mkdir -p "$RELEASE_DIR"
    
    # Copy files
    cp main.js "$RELEASE_DIR/"
    cp manifest.json "$RELEASE_DIR/"
    cp styles.css "$RELEASE_DIR/"
    
    echo "✅ Release files đã được tạo!"
fi

echo ""
echo "📁 Release files:"
ls -la "$RELEASE_DIR"

echo ""
echo "🔄 Đang kiểm tra GitHub CLI..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI chưa được cài đặt"
    echo "🔧 Đang cài đặt GitHub CLI..."
    
    # Install GitHub CLI on macOS
    if command -v brew &> /dev/null; then
        brew install gh
    else
        echo "❌ Homebrew không có. Đang cài đặt..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install gh
    fi
fi

echo ""
echo "🔐 Đang kiểm tra GitHub authentication..."

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Cần đăng nhập GitHub..."
    echo "📱 Sẽ mở trình duyệt để đăng nhập..."
    gh auth login --web
fi

echo ""
echo "✅ GitHub authentication OK!"

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

echo ""
echo "🚀 ĐANG TẠO GITHUB RELEASE TỰ ĐỘNG..."
echo "📝 Title: AI Web Search Plugin v$VERSION"
echo "🏷️  Tag: v$VERSION"

# Create the release
gh release create "v$VERSION" \
    "$RELEASE_DIR/main.js" \
    "$RELEASE_DIR/manifest.json" \
    "$RELEASE_DIR/styles.css" \
    --title "AI Web Search Plugin v$VERSION" \
    --notes "$RELEASE_DESCRIPTION" \
    --latest

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🎉 THÀNH CÔNG! GitHub Release đã được tạo tự động!"
    echo "🌐 Link: https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v$VERSION"
    echo ""
    echo "✅ Bước 1 hoàn thành! Bây giờ chạy Obsidian submission:"
    echo "👉 ./obsidian-submit.sh"
else
    echo ""
    echo "❌ Có lỗi xảy ra. Hãy thử lại hoặc sử dụng manual guide:"
    echo "👉 ./simple-release.sh"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. ✅ GitHub Release - HOÀN THÀNH TỰ ĐỘNG"
echo "2. 🔄 Obsidian Community Submission - Chạy: ./obsidian-submit.sh"

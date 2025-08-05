#!/bin/bash

# 🚀 MANUAL PULL REQUEST CREATOR
# Vì automation PR chưa hoạt động

clear
echo "📝 MANUAL OBSIDIAN COMMUNITY SUBMISSION"
echo "========================================"
echo ""
echo "💡 Vì automation chưa tạo được PR, làm manual:"
echo ""

echo "🌐 BƯỚC 1: FORK REPOSITORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👆 Mở link và click 'Fork': https://github.com/obsidianmd/obsidian-releases"
echo ""

echo "📝 BƯỚC 2: EDIT COMMUNITY-PLUGINS.JSON"  
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👆 Mở file để edit: https://github.com/YOURUSERNAME/obsidian-releases/edit/main/community-plugins.json"
echo ""
echo "🔍 Tìm dòng có \"ai-translator\" và thêm entry sau ĐỂ TRƯỚC \"aider\":"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
cat << 'EOF'
	"ai-web-search": {
		"id": "ai-web-search",
		"name": "AI Web Search",
		"author": "thienphuc205",
		"description": "Search the web using AI providers (Gemini, Perplexity, Tavily, Exa) and analyze YouTube videos with smart context.",
		"repo": "thienphuc205/obsidian-ai-web-search-plugin"
	},
EOF
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""

echo "✏️ BƯỚC 3: COMMIT MESSAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Commit message:"
echo "Add AI Web Search Plugin v2.0.0"
echo ""

echo "🚀 BƯỚC 4: TẠO PULL REQUEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Sau khi commit, GitHub sẽ suggest tạo PR"
echo "2. Hoặc mở: https://github.com/obsidianmd/obsidian-releases/compare"
echo "3. Chọn: base: main ← compare: YOURUSERNAME:main"
echo ""

echo "📋 BƯỚC 5: PR TITLE & DESCRIPTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏷️ Title:"
echo "Add AI Web Search Plugin v2.0.0"
echo ""
echo "📄 Description (copy toàn bộ):"
echo "┌─────────────────────────────────────────────────────────────────┐"
cat << 'EOF'
## 🤖 AI Web Search Plugin

**Version**: v2.0.0
**Repository**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin

### ✨ Plugin Features
- **🤖 Multiple AI Providers**: Google Gemini, Perplexity AI, Tavily, and Exa neural search
- **🎥 Smart YouTube Context Mode**: Analyze videos and ask follow-up questions  
- **🔗 Enhanced Citation System**: Clickable sources with smooth scrolling
- **🌍 Multiple Language Support**: Vietnamese and English interface
- **🔍 Research Modes**: Quick, Comprehensive, Deep, and Reasoning modes
- **💬 Advanced Chat Interface**: Persistent conversations with Send & Save

### 🔧 Technical Details
- **Plugin ID**: `ai-web-search`
- **Author**: thienphuc205
- **Repository**: thienphuc205/obsidian-ai-web-search-plugin
- **Release**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v2.0.0

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
**Ready for Obsidian team review! 🚀**
EOF
echo "└─────────────────────────────────────────────────────────────────┘"
echo ""

echo "✅ BƯỚC 6: SUBMIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Click 'Create pull request'"
echo ""

echo "🎉 HOÀN THÀNH!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📧 Bạn sẽ nhận notification khi Obsidian team review"
echo "⏰ Thời gian review: 1-4 tuần"
echo "🌟 Plugin sẽ sớm xuất hiện trong Obsidian Community!"

echo ""
echo "🔗 QUICK LINKS:"
echo "   • Fork: https://github.com/obsidianmd/obsidian-releases"
echo "   • Edit: https://github.com/YOURUSERNAME/obsidian-releases/edit/main/community-plugins.json"
echo "   • PR: https://github.com/obsidianmd/obsidian-releases/compare"

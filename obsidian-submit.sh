#!/bin/bash

# 🏛️ Obsidian Community Submission Guide
# Simple step-by-step instructions

clear
echo "🏛️ Obsidian Community Submission"
echo "=================================="
echo ""

echo "🍴 Step 1: Fork obsidian-releases Repository"
echo "👆 Click: https://github.com/obsidianmd/obsidian-releases/fork"
echo "✅ Create fork in your account"
echo ""
echo "Press Enter when you've forked the repository..."
read

echo ""
echo "📝 Step 2: Edit community-plugins.json"
echo "1. 🌐 Go to your forked repository"
echo "2. 📄 Click: community-plugins.json file"
echo "3. ✏️ Click: 'Edit this file' (pencil icon)"
echo "4. 📍 Scroll to the BOTTOM of the file"
echo "5. 🔍 Find the last plugin entry before the closing ]"
echo "6. ➕ Add a COMMA after the last entry's closing }"
echo "7. 📋 Copy and paste this JSON entry:"
echo ""

echo "┌─────────────────────────────────────────┐"
cat << 'EOF'
{
    "id": "ai-web-search",
    "name": "AI Web Search", 
    "author": "PhucThien",
    "description": "AI-powered web search plugin with chat interface. Supports Google Gemini, Perplexity, and Tavily for real-time research assistance.",
    "repo": "thienphuc205/obsidian-ai-web-search-plugin"
}
EOF
echo "└─────────────────────────────────────────┘"
echo ""

echo "⚠️ IMPORTANT: Make sure you add a COMMA after the previous entry!"
echo ""
echo "Example:"
echo "  },"
echo "  {"
echo "    \"id\": \"ai-web-search\","
echo "    ..."
echo "  }"
echo "]"
echo ""

echo "Press Enter when you've added the entry..."
read

echo ""
echo "📤 Step 3: Create Pull Request"
echo "1. 💾 Commit message: 'Add AI Web Search Plugin'"
echo "2. 📄 Click: 'Propose changes'"
echo "3. 🔄 Click: 'Create pull request'"
echo "4. 📝 Title: 'Add AI Web Search Plugin'"
echo "5. 📋 Description (copy this):"
echo ""

echo "┌─────────────────────────────────────────┐"
cat << 'EOF'
Adding AI Web Search plugin to the community plugins directory.

## Plugin Details:
- **Name**: AI Web Search
- **Author**: PhucThien  
- **Repository**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin
- **Version**: 2.0.0

## Features:
- Multiple AI providers (Gemini, Perplexity, Tavily, Exa)
- YouTube video analysis mode
- Enhanced citation system
- Multiple language support
- Advanced research modes

The plugin has been tested and follows Obsidian plugin guidelines.
EOF
echo "└─────────────────────────────────────────┘"
echo ""

echo "6. ✅ Click: 'Create pull request'"
echo ""

echo "Press Enter when you've submitted the pull request..."
read

echo ""
echo "🎉 CONGRATULATIONS!"
echo "=================="
echo ""
echo "✅ GitHub Release: Created"
echo "✅ Community Submission: Submitted"
echo ""
echo "⏳ What's Next:"
echo "- Obsidian team will review your submission (1-4 weeks)"
echo "- You'll get GitHub notifications for any updates"
echo "- They may ask questions or request changes"
echo "- Once approved, your plugin will be in the Community Store!"
echo ""
echo "📧 You'll receive email notifications at your GitHub email"
echo "🔗 Track progress: https://github.com/obsidianmd/obsidian-releases/pulls"
echo ""
echo "🎯 Your Plugin Repository: https://github.com/thienphuc205/obsidian-ai-web-search-plugin"
echo ""
echo "Thank you for contributing to the Obsidian community! 🚀✨"

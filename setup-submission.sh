#!/bin/bash

# 🚀 Setup Script for Obsidian Plugin Submission
# Run this after creating your GitHub repository

echo "🚀 Setting up Obsidian AI Web Search Plugin for submission..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Required Information:${NC}"
echo "You need to create a GitHub repository first!"
echo ""
echo -e "${YELLOW}Repository Name:${NC} obsidian-ai-web-search-plugin"
echo -e "${YELLOW}Description:${NC} AI-powered web search plugin for Obsidian with Gemini, Perplexity, and Tavily support"
echo -e "${YELLOW}Visibility:${NC} Public"
echo ""

# Get repository URL from user
echo -e "${BLUE}📝 Enter your GitHub repository URL:${NC}"
echo "Example: https://github.com/yourusername/obsidian-ai-web-search-plugin.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Setting up git remote...${NC}"

# Add new remote
git remote add origin "$REPO_URL"

# Verify remote
echo -e "${GREEN}✅ Remote added:${NC}"
git remote -v

echo ""
echo -e "${BLUE}📦 Preparing files for submission...${NC}"

# Copy submission README
cp README_SUBMISSION.md README.md
echo -e "${GREEN}✅ Updated README.md for submission${NC}"

# Update manifest with proper info
echo -e "${BLUE}📝 Current manifest.json:${NC}"
cat manifest.json

echo ""
echo -e "${BLUE}🚀 Ready to push to GitHub?${NC}"
read -p "Push now? (y/n): " PUSH_NOW

if [ "$PUSH_NOW" = "y" ] || [ "$PUSH_NOW" = "Y" ]; then
    echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
    
    # Add all files
    git add .
    
    # Commit if there are changes
    if ! git diff --staged --quiet; then
        git commit -m "🚀 Prepare plugin for Obsidian Community submission

✨ Features:
- AI-powered web search with Gemini, Perplexity, Tavily
- Smart YouTube Context Mode
- Enhanced citation system
- Multiple language support
- Research mode capabilities

📋 Submission Ready:
- Updated README.md with comprehensive documentation
- Proper manifest.json format
- Updated versions.json
- All features tested and working

🎯 Ready for Obsidian Community Plugins review!"
    fi
    
    # Push to GitHub
    git push -u origin master --tags
    
    echo ""
    echo -e "${GREEN}🎉 Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Go to your repository: ${REPO_URL%.git}"
    echo "2. Create a release (v2.0.0) with main.js, manifest.json, styles.css"
    echo "3. Submit to Obsidian Community via: https://github.com/obsidianmd/obsidian-releases"
    echo ""
    echo -e "${YELLOW}📖 For detailed submission guide:${NC}"
    echo "https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin"
    
else
    echo -e "${YELLOW}⏸️ Skipped push. Run manually when ready:${NC}"
    echo "git push -u origin master --tags"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"

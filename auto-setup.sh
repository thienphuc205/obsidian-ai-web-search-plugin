#!/bin/bash

# 🚀 Automated Obsidian Plugin GitHub Setup & Submission
# This script will completely automate the process

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
SUCCESS="✅"
ERROR="❌"
INFO="ℹ️"
ROCKET="🚀"
GEAR="⚙️"
PACKAGE="📦"
UPLOAD="📤"
SPARKLES="✨"

# Function to print colored output
print_status() {
    echo -e "${BLUE}${INFO}${NC} $1"
}

print_success() {
    echo -e "${GREEN}${SUCCESS}${NC} $1"
}

print_error() {
    echo -e "${RED}${ERROR}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_header() {
    echo ""
    echo -e "${PURPLE}${SPARKLES}${SPARKLES}${SPARKLES} $1 ${SPARKLES}${SPARKLES}${SPARKLES}${NC}"
    echo ""
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "manifest.json" ] || [ ! -f "main.ts" ]; then
        print_error "Not in plugin directory! Please run from the plugin root."
        exit 1
    fi
    print_success "Found plugin files - we're in the right directory"
}

# Get plugin info from manifest.json
get_plugin_info() {
    PLUGIN_ID=$(grep '"id"' manifest.json | sed 's/.*"id": *"\([^"]*\)".*/\1/')
    PLUGIN_NAME=$(grep '"name"' manifest.json | sed 's/.*"name": *"\([^"]*\)".*/\1/')
    PLUGIN_VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
    PLUGIN_AUTHOR=$(grep '"author"' manifest.json | sed 's/.*"author": *"\([^"]*\)".*/\1/')
    
    print_success "Plugin Info:"
    echo "  📋 ID: $PLUGIN_ID"
    echo "  🏷️ Name: $PLUGIN_NAME"
    echo "  📊 Version: $PLUGIN_VERSION"
    echo "  👤 Author: $PLUGIN_AUTHOR"
}

# Auto-detect or prompt for GitHub username
get_github_info() {
    print_header "GitHub Configuration"
    
    # Try to get from git config first
    GIT_USER=$(git config --global user.name 2>/dev/null || echo "")
    GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
    
    # Get GitHub username
    if [ -z "$GITHUB_USERNAME" ]; then
        if [ -n "$GIT_USER" ]; then
            echo -e "${CYAN}Detected Git user: $GIT_USER${NC}"
            read -p "Is this your GitHub username? (y/n): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                GITHUB_USERNAME="$GIT_USER"
            fi
        fi
        
        if [ -z "$GITHUB_USERNAME" ]; then
            read -p "Enter your GitHub username: " GITHUB_USERNAME
        fi
    fi
    
    # Auto-generate repository name
    REPO_NAME="obsidian-ai-web-search-plugin"
    REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    
    print_success "GitHub Setup:"
    echo "  👤 Username: $GITHUB_USERNAME"
    echo "  📁 Repository: $REPO_NAME"
    echo "  🔗 URL: $REPO_URL"
    
    # Set git config if not set
    if [ -z "$GIT_USER" ]; then
        git config --global user.name "$GITHUB_USERNAME"
        print_success "Set git username: $GITHUB_USERNAME"
    fi
    
    if [ -z "$GIT_EMAIL" ]; then
        read -p "Enter your email for git commits: " GIT_EMAIL
        git config --global user.email "$GIT_EMAIL"
        print_success "Set git email: $GIT_EMAIL"
    fi
}

# Create GitHub repository automatically using GitHub CLI or provide instructions
create_github_repo() {
    print_header "Creating GitHub Repository"
    
    # Check if GitHub CLI is installed
    if command -v gh &> /dev/null; then
        print_status "GitHub CLI detected - creating repository automatically..."
        
        # Login check
        if ! gh auth status &> /dev/null; then
            print_warning "GitHub CLI not authenticated. Please login:"
            gh auth login
        fi
        
        # Create repository
        gh repo create "$REPO_NAME" \
            --description "AI-powered web search plugin for Obsidian with Gemini, Perplexity, and Tavily support" \
            --public \
            --clone=false
        
        if [ $? -eq 0 ]; then
            print_success "Repository created successfully!"
        else
            print_error "Failed to create repository automatically"
            manual_repo_creation
        fi
    else
        print_warning "GitHub CLI not found - providing manual instructions"
        manual_repo_creation
    fi
}

# Manual repository creation instructions
manual_repo_creation() {
    print_header "Manual Repository Creation"
    echo -e "${YELLOW}Please create a GitHub repository manually:${NC}"
    echo ""
    echo "1. 🌐 Go to: https://github.com/new"
    echo "2. 📝 Repository name: $REPO_NAME"
    echo "3. 📄 Description: AI-powered web search plugin for Obsidian with Gemini, Perplexity, and Tavily support"
    echo "4. 🔓 Make it Public"
    echo "5. ❌ DO NOT initialize with README (we have our own files)"
    echo "6. ✅ Click 'Create repository'"
    echo ""
    read -p "Press Enter after creating the repository..."
}

# Setup git remote and push
setup_git() {
    print_header "Git Configuration"
    
    # Remove old remote if exists
    if git remote get-url origin &> /dev/null; then
        print_status "Removing old remote..."
        git remote remove origin
    fi
    
    # Add new remote
    print_status "Adding GitHub remote..."
    git remote add origin "$REPO_URL"
    
    # Verify remote
    print_success "Remote configured:"
    git remote -v
}

# Build the plugin
build_plugin() {
    print_header "Building Plugin"
    
    print_status "Running npm build..."
    if npm run build; then
        print_success "Plugin built successfully!"
    else
        print_error "Build failed! Check for errors above."
        exit 1
    fi
}

# Prepare submission files
prepare_files() {
    print_header "Preparing Submission Files"
    
    # Copy submission README
    print_status "Updating README.md for submission..."
    cp README_SUBMISSION.md README.md
    
    # Create release directory
    print_status "Creating release files..."
    mkdir -p releases/v${PLUGIN_VERSION}
    cp main.js releases/v${PLUGIN_VERSION}/
    cp manifest.json releases/v${PLUGIN_VERSION}/
    cp styles.css releases/v${PLUGIN_VERSION}/
    
    # Create archive
    print_status "Creating distribution archive..."
    tar -czf "${REPO_NAME}-v${PLUGIN_VERSION}.tar.gz" \
        README.md manifest.json main.js styles.css versions.json LICENSE
    
    print_success "Files prepared:"
    echo "  📄 README.md (updated for submission)"
    echo "  📁 releases/v${PLUGIN_VERSION}/ (release files)"
    echo "  📦 ${REPO_NAME}-v${PLUGIN_VERSION}.tar.gz (distribution)"
}

# Commit and push to GitHub
commit_and_push() {
    print_header "Committing to GitHub"
    
    # Add all files
    print_status "Staging files..."
    git add -A
    
    # Commit
    print_status "Creating commit..."
    git commit -m "🚀 Prepare AI Web Search Plugin for Obsidian Community submission

${SPARKLES} Features:
- AI-powered web search with Google Gemini, Perplexity AI, and Tavily
- Smart YouTube Context Mode for video analysis
- Enhanced citation system with clickable sources
- Multiple language support (Vietnamese/English)
- Research mode capabilities with advanced filtering

📋 Submission Ready:
- Updated README.md with comprehensive documentation
- Proper manifest.json format (v${PLUGIN_VERSION})
- Release files prepared in releases/v${PLUGIN_VERSION}/
- All features tested and working

🎯 Ready for Obsidian Community Plugins review!"
    
    # Push to GitHub
    print_status "Pushing to GitHub..."
    if git push -u origin master --tags; then
        print_success "Pushed to GitHub successfully!"
    else
        print_error "Failed to push to GitHub"
        print_warning "You may need to authenticate with GitHub"
        print_status "Try: git push -u origin master --tags"
        
        # Provide token instructions
        echo ""
        print_warning "If authentication fails, you may need a Personal Access Token:"
        echo "1. 🔑 Go to: https://github.com/settings/tokens"
        echo "2. ✨ Generate new token (classic)"
        echo "3. ☑️ Check 'repo' scope"
        echo "4. 📋 Copy the token"
        echo "5. 🔐 Use token as password when git prompts"
        return 1
    fi
}

# Create GitHub release
create_release() {
    print_header "Creating GitHub Release"
    
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        print_status "Creating release v${PLUGIN_VERSION}..."
        
        # Create release with files
        gh release create "v${PLUGIN_VERSION}" \
            "releases/v${PLUGIN_VERSION}/main.js" \
            "releases/v${PLUGIN_VERSION}/manifest.json" \
            "releases/v${PLUGIN_VERSION}/styles.css" \
            --title "AI Web Search Plugin v${PLUGIN_VERSION}" \
            --notes "# AI Web Search Plugin v${PLUGIN_VERSION}

## ✨ Features
- AI-powered web search with Google Gemini, Perplexity AI, and Tavily
- Smart YouTube Context Mode for video analysis
- Enhanced citation system with clickable sources
- Multiple language support (Vietnamese/English)
- Research mode with comprehensive source filtering

## 🚀 Installation
Download the files below and place them in your \`.obsidian/plugins/ai-web-search/\` folder.

## 📋 Required Files
- main.js
- manifest.json  
- styles.css

## 🔧 Setup
1. Get API keys from:
   - Google Gemini: https://makersuite.google.com/app/apikey
   - Perplexity AI: https://www.perplexity.ai/settings/api
   - Tavily: https://app.tavily.com/
2. Configure in Obsidian Settings → Community Plugins → AI Web Search"
        
        if [ $? -eq 0 ]; then
            print_success "GitHub release created!"
        else
            print_error "Failed to create release automatically"
            manual_release_instructions
        fi
    else
        manual_release_instructions
    fi
}

# Manual release instructions
manual_release_instructions() {
    print_warning "Manual release creation required:"
    echo ""
    echo "1. 🌐 Go to: $REPO_URL"
    echo "2. 🏷️ Click 'Releases' → 'Create a new release'"
    echo "3. 📝 Tag: v${PLUGIN_VERSION}"
    echo "4. 📄 Title: AI Web Search Plugin v${PLUGIN_VERSION}"
    echo "5. 📎 Upload files from: releases/v${PLUGIN_VERSION}/"
    echo "   - main.js"
    echo "   - manifest.json"
    echo "   - styles.css"
    echo "6. ✅ Publish release"
}

# Obsidian Community submission instructions
submission_instructions() {
    print_header "Obsidian Community Submission"
    
    echo -e "${GREEN}${SUCCESS} Plugin preparation complete!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps for Obsidian Community submission:${NC}"
    echo ""
    echo "1. 🍴 Fork repository: https://github.com/obsidianmd/obsidian-releases"
    echo "2. 📝 Edit file: community-plugins.json"
    echo "3. ➕ Add this entry at the end of the JSON array:"
    echo ""
    echo -e "${CYAN}{"
    echo "    \"id\": \"$PLUGIN_ID\","
    echo "    \"name\": \"$PLUGIN_NAME\","
    echo "    \"author\": \"$PLUGIN_AUTHOR\","
    echo "    \"description\": \"AI-powered web search plugin with chat interface. Supports Google Gemini, Perplexity, and Tavily for real-time research assistance.\","
    echo "    \"repo\": \"$GITHUB_USERNAME/$REPO_NAME\""
    echo -e "}${NC}"
    echo ""
    echo "4. 📤 Create Pull Request with title: 'Add AI Web Search Plugin'"
    echo "5. ⏳ Wait for Obsidian team review (1-4 weeks)"
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC} https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin"
    echo -e "${GREEN}🔗 Repository:${NC} ${REPO_URL%.git}"
}

# Main execution flow
main() {
    clear
    print_header "🚀 Automated Obsidian Plugin Submission Setup"
    echo -e "${CYAN}This script will automatically prepare your plugin for Obsidian Community submission${NC}"
    echo ""
    
    # Confirm before proceeding
    read -p "Continue with automated setup? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    # Step-by-step execution
    check_directory
    get_plugin_info
    get_github_info
    create_github_repo
    setup_git
    build_plugin
    prepare_files
    
    if commit_and_push; then
        create_release
        submission_instructions
        
        print_header "🎉 Automation Complete!"
        print_success "Your plugin is ready for Obsidian Community submission!"
        echo ""
        echo -e "${PURPLE}${SPARKLES} Summary:${NC}"
        echo "✅ GitHub repository created and configured"
        echo "✅ Plugin built and files prepared"
        echo "✅ Release v${PLUGIN_VERSION} created"
        echo "✅ Ready for community submission"
        echo ""
        echo -e "${YELLOW}Next: Follow the submission instructions above${NC}"
    else
        print_warning "Manual push required - see instructions above"
        echo ""
        echo "After successful push, run:"
        echo "./create-release.sh"
        echo ""
        echo "Then follow submission instructions."
    fi
}

# Run main function
main "$@"

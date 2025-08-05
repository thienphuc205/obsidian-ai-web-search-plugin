#!/bin/bash

# 🏷️ GitHub Release Creator for Obsidian Plugin
# Automates GitHub release creation with proper files

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${PURPLE}✨✨✨ $1 ✨✨✨${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Get plugin version from manifest.json
get_version() {
    VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
    echo "$VERSION"
}

# Check if GitHub CLI is available and authenticated
check_github_cli() {
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI not found. Installing..."
        ./install-gh-cli.sh
        
        if ! command -v gh &> /dev/null; then
            print_error "GitHub CLI installation failed."
            return 1
        fi
    fi
    
    if ! gh auth status &> /dev/null; then
        print_warning "GitHub CLI not authenticated. Please login:"
        gh auth login --web
        
        if ! gh auth status &> /dev/null; then
            print_error "GitHub authentication failed."
            return 1
        fi
    fi
    
    print_success "GitHub CLI is ready!"
    return 0
}

# Create GitHub release
create_github_release() {
    local version=$1
    local release_dir="releases/v${version}"
    
    print_status "Creating GitHub release v${version}..."
    
    # Check if release files exist
    if [ ! -d "$release_dir" ]; then
        print_error "Release directory not found: $release_dir"
        return 1
    fi
    
    local required_files=("main.js" "manifest.json" "styles.css")
    for file in "${required_files[@]}"; do
        if [ ! -f "$release_dir/$file" ]; then
            print_error "Required file not found: $release_dir/$file"
            return 1
        fi
    done
    
    # Create the release
    local release_notes="# AI Web Search Plugin v${version}

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

## 📋 Required Files
- **main.js** - Core plugin functionality
- **manifest.json** - Plugin metadata  
- **styles.css** - User interface styling

## 🔧 Setup Guide
1. **Get API Keys**:
   - 🔸 **Google Gemini**: [Get API Key](https://makersuite.google.com/app/apikey)
   - 🔸 **Perplexity AI**: [Get API Key](https://www.perplexity.ai/settings/api)
   - 🔸 **Tavily**: [Get API Key](https://app.tavily.com/)
   - 🔸 **Exa**: [Get API Key](https://exa.ai/)

2. **Configure Plugin**:
   - Open Obsidian Settings → Community Plugins → AI Web Search
   - Add your API keys for desired providers
   - Choose default search provider
   - Adjust research mode settings

3. **Start Using**:
   - Click 🔍 icon in ribbon to open chat
   - Use Command Palette: \"AI Web Search\"
   - Select text and run \"AI Web Search: Research with selected text\"

## 📖 Documentation
- **Repository**: https://github.com/thienphuc205/obsidian-ai-web-search-plugin
- **Issues**: Report bugs or request features
- **Wiki**: Detailed usage guides and tips

## 🤝 Support
- ⭐ Star the repository if you find it helpful
- 🐛 Report issues on GitHub
- 💡 Suggest new features
- ☕ Buy me a coffee to support development

---
**Made with ❤️ for the Obsidian community**"
    
    # Create release with GitHub CLI
    gh release create "v${version}" \
        "$release_dir/main.js" \
        "$release_dir/manifest.json" \
        "$release_dir/styles.css" \
        --title "AI Web Search Plugin v${version}" \
        --notes "$release_notes" \
        --latest
    
    if [ $? -eq 0 ]; then
        print_success "GitHub release v${version} created successfully!"
        return 0
    else
        print_error "Failed to create GitHub release"
        return 1
    fi
}

# Manual release instructions
show_manual_instructions() {
    local version=$1
    
    print_header "Manual GitHub Release Instructions"
    
    echo -e "${YELLOW}If automatic release failed, create manually:${NC}"
    echo ""
    echo "1. 🌐 Go to: https://github.com/thienphuc205/obsidian-ai-web-search-plugin"
    echo "2. 🏷️ Click 'Releases' → 'Create a new release'"
    echo "3. 📝 Fill in the details:"
    echo "   - Tag: v${version}"
    echo "   - Title: AI Web Search Plugin v${version}"
    echo "   - Description: Copy from release notes above"
    echo "4. 📎 Upload files from releases/v${version}/:"
    echo "   - main.js"
    echo "   - manifest.json" 
    echo "   - styles.css"
    echo "5. ✅ Check 'Set as the latest release'"
    echo "6. 📤 Click 'Publish release'"
}

# Show next steps for Obsidian Community submission
show_submission_steps() {
    print_header "Obsidian Community Submission Steps"
    
    echo -e "${GREEN}🎉 Release created! Now submit to Obsidian Community:${NC}"
    echo ""
    echo -e "${YELLOW}Step 1: Fork obsidian-releases repository${NC}"
    echo "1. 🍴 Go to: https://github.com/obsidianmd/obsidian-releases"
    echo "2. 🔀 Click 'Fork' button"
    echo "3. ✅ Create fork in your account"
    echo ""
    
    echo -e "${YELLOW}Step 2: Edit community-plugins.json${NC}"
    echo "1. 📝 Open file: community-plugins.json"
    echo "2. 📄 Click 'Edit this file' (pencil icon)"
    echo "3. ➕ Add this entry at the END of the JSON array (before the closing ]):"
    echo ""
    echo -e "${BLUE}{"
    echo "    \"id\": \"ai-web-search\","
    echo "    \"name\": \"AI Web Search\","
    echo "    \"author\": \"PhucThien\","
    echo "    \"description\": \"AI-powered web search plugin with chat interface. Supports Google Gemini, Perplexity, and Tavily for real-time research assistance.\","
    echo "    \"repo\": \"thienphuc205/obsidian-ai-web-search-plugin\""
    echo -e "}${NC}"
    echo ""
    echo "4. ⚠️ Make sure to add a COMMA after the previous entry!"
    echo ""
    
    echo -e "${YELLOW}Step 3: Create Pull Request${NC}"
    echo "1. 💾 Commit changes with message: 'Add AI Web Search Plugin'"
    echo "2. 📤 Click 'Propose changes'"
    echo "3. 🔄 Click 'Create pull request'"
    echo "4. 📝 Title: 'Add AI Web Search Plugin'"
    echo "5. 📄 Description: 'Adding AI Web Search plugin with multiple AI providers'"
    echo "6. ✅ Submit pull request"
    echo ""
    
    echo -e "${YELLOW}Step 4: Wait for Review${NC}"
    echo "⏳ Obsidian team will review your submission (typically 1-4 weeks)"
    echo "📧 You'll get notifications on GitHub when there are updates"
    echo "🔧 They may request changes or ask questions"
    echo ""
    
    print_success "Documentation: https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin"
}

# Main function
main() {
    clear
    print_header "🏷️ GitHub Release Creator"
    
    # Get version
    VERSION=$(get_version)
    if [ -z "$VERSION" ]; then
        print_error "Could not get version from manifest.json"
        exit 1
    fi
    
    print_status "Plugin version: v${VERSION}"
    print_status "Release files: releases/v${VERSION}/"
    echo ""
    
    # Check if release already exists
    if gh release view "v${VERSION}" &> /dev/null; then
        print_warning "Release v${VERSION} already exists!"
        read -p "Delete and recreate? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gh release delete "v${VERSION}" --yes
            print_status "Deleted existing release"
        else
            print_status "Keeping existing release"
            show_submission_steps
            exit 0
        fi
    fi
    
    # Proceed with release creation
    read -p "Create GitHub release v${VERSION}? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    # Check GitHub CLI
    if check_github_cli; then
        # Create release
        if create_github_release "$VERSION"; then
            show_submission_steps
        else
            show_manual_instructions "$VERSION"
        fi
    else
        print_error "GitHub CLI setup failed."
        show_manual_instructions "$VERSION"
    fi
}

main "$@"

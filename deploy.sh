#!/bin/bash

# Enhanced AI Web Search Plugin Deployment Script
echo "🚀 Deploying AI Web Search Plugin..."

# Plugin source files
PLUGIN_DIR="/Volumes/Volumes/obsidian_search_plugin/gemini-web-search-plugin/gemini-web-search-plugin"
PLUGIN_NAME="ai-web-search"

# Find Obsidian vault (common locations)
VAULT_DIRS=(
    "/Users/$USER/Documents/Obsidian Vault"
    "/Users/$USER/Library/Mobile Documents/iCloud~md~obsidian/Documents"
    "/Users/$USER/Obsidian"
    "/Users/$USER/Documents"
    "/Users/$USER/Desktop"
)

# Function to find vault
find_vault() {
    echo "🔍 Searching for Obsidian vault..."
    
    # Check common vault directories
    for dir in "${VAULT_DIRS[@]}"; do
        if [[ -d "$dir" ]]; then
            vault_candidates=$(find "$dir" -name ".obsidian" -type d 2>/dev/null)
            if [[ -n "$vault_candidates" ]]; then
                echo "Found vault(s):"
                echo "$vault_candidates" | while read vault; do
                    vault_path=$(dirname "$vault")
                    echo "  📁 $vault_path"
                done
                return 0
            fi
        fi
    done
    
    # If not found, search entire user directory (slower)
    echo "Searching entire user directory..."
    vault_candidates=$(find /Users/$USER -name ".obsidian" -type d 2>/dev/null | head -5)
    if [[ -n "$vault_candidates" ]]; then
        echo "Found vault(s):"
        echo "$vault_candidates" | while read vault; do
            vault_path=$(dirname "$vault")
            echo "  📁 $vault_path"
        done
        return 0
    else
        echo "❌ No Obsidian vault found!"
        echo "Please manually copy these files to your vault:"
        echo "  $PLUGIN_DIR/main.js"
        echo "  $PLUGIN_DIR/manifest.json" 
        echo "  $PLUGIN_DIR/styles.css"
        echo ""
        echo "To: YOUR_VAULT/.obsidian/plugins/$PLUGIN_NAME/"
        return 1
    fi
}

# Function to deploy to specific vault
deploy_to_vault() {
    local vault_path="$1"
    local plugin_target="$vault_path/.obsidian/plugins/$PLUGIN_NAME"
    
    echo "📦 Deploying to: $vault_path"
    
    # Create plugin directory
    mkdir -p "$plugin_target"
    
    # Copy files
    cp "$PLUGIN_DIR/main.js" "$plugin_target/"
    cp "$PLUGIN_DIR/manifest.json" "$plugin_target/"
    cp "$PLUGIN_DIR/styles.css" "$plugin_target/"
    
    echo "✅ Plugin deployed successfully!"
    echo "📁 Location: $plugin_target"
    echo ""
    echo "🔄 Next steps:"
    echo "1. Open Obsidian"
    echo "2. Go to Settings → Community Plugins"
    echo "3. Find 'AI Web Search' and enable it"
    echo "4. Click the chat icon in ribbon to open"
    echo ""
    echo "🎯 Features available:"
    echo "  ⚡ Quick Search - Fast answers"
    echo "  🔍 Comprehensive - Balanced research"  
    echo "  🎯 Deep Research - Expert analysis"
    echo "  🧠 Reasoning - Complex problem solving"
}

# Main execution
if find_vault; then
    # Get first vault found
    first_vault=$(find /Users/$USER -name ".obsidian" -type d 2>/dev/null | head -1)
    if [[ -n "$first_vault" ]]; then
        vault_path=$(dirname "$first_vault")
        echo ""
        echo "🎯 Using vault: $vault_path"
        read -p "Deploy to this vault? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_to_vault "$vault_path"
        else
            echo "❌ Deployment cancelled"
            echo "Available vaults:"
            find /Users/$USER -name ".obsidian" -type d 2>/dev/null | while read vault; do
                vault_path=$(dirname "$vault")
                echo "  📁 $vault_path"
            done
        fi
    fi
fi

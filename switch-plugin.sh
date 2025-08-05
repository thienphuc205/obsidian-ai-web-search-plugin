#!/bin/bash

# Script to switch between test and main plugin

case "$1" in
  "test")
    echo "🧪 Switching to Network Test Plugin..."
    
    # Backup main plugin files
    if [ -f "main.ts" ] && [ ! -f "main-original.ts" ]; then
        mv main.ts main-original.ts
        echo "✓ Backed up main.ts to main-original.ts"
    fi
    
    if [ -f "manifest.json" ] && [ ! -f "manifest-main.json" ]; then
        mv manifest.json manifest-main.json
        echo "✓ Backed up manifest.json to manifest-main.json"
    fi
    
    # Activate test plugin
    cp network-test.ts main.ts
    cp manifest-test.json manifest.json
    
    echo "✅ Test plugin activated!"
    echo "Run: npm run build"
    ;;
    
  "main")
    echo "🚀 Switching to Main Gemini Plugin..."
    
    # Restore main plugin files
    if [ -f "main-original.ts" ]; then
        cp main-original.ts main.ts
        echo "✓ Restored main.ts"
    fi
    
    if [ -f "manifest-main.json" ]; then
        cp manifest-main.json manifest.json
        echo "✓ Restored manifest.json"
    fi
    
    echo "✅ Main plugin activated!"
    echo "Run: npm run build"
    ;;
    
  "status")
    echo "📋 Current Plugin Status:"
    
    if [ -f "main.ts" ] && [ -f "network-test.ts" ]; then
        if cmp -s "main.ts" "network-test.ts"; then
            echo "🧪 Test plugin is currently active"
        else
            echo "🚀 Main plugin is currently active"
        fi
    else
        echo "❓ Unable to determine current state"
    fi
    
    echo ""
    echo "Files present:"
    ls -la *.ts *.json | grep -E "(main|manifest|network-test)" || echo "No relevant files found"
    ;;
    
  *)
    echo "🔧 Plugin Switcher Usage:"
    echo ""
    echo "  ./switch-plugin.sh test    # Switch to network test plugin"
    echo "  ./switch-plugin.sh main    # Switch to main Gemini plugin"  
    echo "  ./switch-plugin.sh status  # Check current plugin status"
    echo ""
    echo "After switching, run: npm run build"
    ;;
esac

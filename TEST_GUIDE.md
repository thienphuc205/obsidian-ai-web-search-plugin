# 🧪 Network Test Plugin - Testing Guide

## Overview
Trước khi implement plugin Gemini Web Search, chúng ta cần test network capabilities của Obsidian để đảm bảo:
1. `requestUrl` API hoạt động với external servers
2. Gemini API accessible
3. Web search grounding được phép
4. External API calls được allow

## Setup Instructions

### 1. **Install Test Plugin**
```bash
# Current directory structure:
gemini-web-search-plugin/
├── network-test.ts        # Test plugin code
├── manifest-test.json     # Test plugin manifest
├── main.ts               # Original main plugin
└── manifest.json         # Original manifest
```

### 2. **Build Test Plugin**
```bash
# Rename files to test the network plugin first
mv manifest.json manifest-main.json
mv main.ts main-original.ts
mv manifest-test.json manifest.json
mv network-test.ts main.ts

# Build
npm run build
```

### 3. **Install in Obsidian**
1. Copy built files to Obsidian vault: `.obsidian/plugins/network-test/`
2. Enable plugin in Community Plugins settings
3. Configure Gemini API key in plugin settings

## Test Scenarios

### 🌐 **Basic HTTP Test**
- **Purpose**: Verify `requestUrl` works with external servers
- **Target**: `https://httpbin.org/json`
- **Expected**: JSON response with test data
- **Command**: "Test: Basic HTTP Request"

### 🤖 **Gemini API Basic Test**
- **Purpose**: Test Gemini API without web search
- **Target**: `gemini-1.5-flash:generateContent`
- **Expected**: Simple text generation response
- **Command**: "Test: Gemini API Basic"

### 🌐 **Gemini Web Search Test**
- **Purpose**: Test Gemini with web grounding (CRITICAL)
- **Target**: `gemini-2.5-flash` with `googleSearch` tool
- **Expected**: Response with `groundingMetadata`
- **Command**: "Test: Gemini API Web Search"

### 🌍 **External APIs Test**
- **Purpose**: Test various external services
- **Targets**: JSONPlaceholder, GitHub API, HTTPBin
- **Expected**: Successful responses from multiple APIs
- **Command**: "Test: External APIs"

## Expected Results

### ✅ **Best Case Scenario**
```
🧪 Network Test Report

### 🌐 Basic HTTP Request
✅ PASSED (150ms)

### 🤖 Gemini API Basic  
✅ PASSED (800ms)

### 🌐 Gemini Web Search
✅ PASSED (2000ms)
- Grounding: ✅
- Sources: 3

### 🌍 External APIs
✅ JSONPlaceholder (120ms)
✅ HTTPBin IP (200ms)
✅ GitHub API (180ms)

📊 Summary
Core Tests Passed: 3/3
External APIs Passed: 3/3
Network Capability: ✅ Good
Web Search Support: ✅ Fully Supported
```

### ⚠️ **Limited Case**
```
🧪 Network Test Report

### 🌐 Basic HTTP Request
✅ PASSED (150ms)

### 🤖 Gemini API Basic  
✅ PASSED (800ms)

### 🌐 Gemini Web Search
❌ FAILED - API access forbidden or web search not enabled

### 🌍 External APIs
✅ JSONPlaceholder (120ms)
❌ HTTPBin IP - Network error
✅ GitHub API (180ms)

📊 Summary
Core Tests Passed: 2/3
External APIs Passed: 2/3
Network Capability: ⚠️ Limited
Web Search Support: ⚠️ Basic Gemini only
```

### ❌ **Worst Case**
```
🧪 Network Test Report

### 🌐 Basic HTTP Request
❌ FAILED - Network request blocked

### 🤖 Gemini API Basic  
❌ FAILED - Network error

### 🌐 Gemini Web Search
❌ FAILED - Network error

### 🌍 External APIs
❌ JSONPlaceholder - Network error
❌ HTTPBin IP - Network error
❌ GitHub API - Network error

📊 Summary
Core Tests Passed: 0/3
External APIs Passed: 0/3
Network Capability: ❌ Poor
Web Search Support: ❌ Not Available
```

## Action Plan Based on Results

### **If All Tests Pass ✅**
- Proceed with full Gemini Web Search plugin implementation
- Web grounding is fully supported
- No restrictions on external API calls

### **If Gemini Basic Works, Web Search Fails ⚠️**
- Implement Gemini plugin WITHOUT web search
- Focus on text analysis, summarization, local content processing
- Consider alternative approaches (user-provided context)

### **If Only Basic HTTP Works ⚠️**
- Very limited functionality possible
- Consider local-only features
- File processing, vault search, basic text manipulation

### **If All Tests Fail ❌**
- Obsidian blocks external network requests
- Focus on local-only plugin features
- No AI API integration possible

## Alternative Approaches

### **Approach 1: User-Provided Context**
```typescript
// User manually searches web, pastes results
class ContextBasedAnalysis {
    async analyzeWithContext(userContext: string, query: string) {
        // Use Gemini to analyze user-provided context
        // No web search, but still AI-powered analysis
    }
}
```

### **Approach 2: Local Knowledge Base**
```typescript
// Search within user's vault
class VaultSearch {
    async searchVault(query: string) {
        // Search through user's notes
        // Provide AI analysis of existing content
    }
}
```

### **Approach 3: Hybrid Approach**
```typescript
// Combine local search + manual web research
class HybridResearch {
    async guideResearch(topic: string) {
        // 1. Search local vault
        // 2. Suggest web search queries
        // 3. Let user provide external context
        // 4. AI analysis of combined data
    }
}
```

## Next Steps

1. **Run the test plugin** in your Obsidian vault
2. **Share the test results** so we can determine the best approach
3. **Based on results**, we'll implement the appropriate solution:
   - Full web search plugin (if all tests pass)
   - Limited Gemini plugin (if basic API works)
   - Local-only plugin (if network is restricted)

## Test Commands Summary

- `Ctrl/Cmd + P` → "Test: Run Full Network Test Suite" (recommended)
- Individual tests available in Command Palette
- Results will be inserted into current note
- Check browser console for detailed logs

**Ready to test? Let's see what Obsidian allows! 🚀**

# AI Web Search Plugin for Obsidian

> **⚠️ IMPORTANT: Please restart Obsidian after successfully updating your API keys for optimal performance!**

An advanced AI-powered web search plugin that brings real-time research capabilities directly into your Obsidian workspace.

## ✨ Features

### 🤖 **Multiple AI Providers**
- **Google Gemini** - Advanced AI with web search capabilities
- **Perplexity AI** - Real-time search with source citations  
- **Tavily** - Specialized research-focused AI

### 🎯 **Smart Search Modes**
- **Standard Search** - Quick AI-powered web research
- **Research Mode** - Deep analysis with comprehensive sources
- **YouTube Context Mode** - Smart video analysis and follow-up questions

### 💬 **Advanced Chat Interface**
- **Persistent Chat** - Continue conversations across searches
- **New Chat** - Start fresh conversations anytime
- **Send & Save** - Save important responses to your vault
- **Smart Context** - Maintains conversation history

### 🔍 **Enhanced Features**
- **Source Citations** - Clickable links to original sources
- **Related Questions** - AI-suggested follow-up queries
- **Multiple Languages** - Full Vietnamese and English support
- **Customizable Settings** - Fine-tune AI parameters

## 🚀 Getting Started

### Installation

1. **From Obsidian Community Plugins:**
   - Currently under review by Obsidian team
   - Track progress: [Review Status #7342](https://github.com/obsidianmd/obsidian-releases/pull/7342)
   - Will be available in Community Plugins when approved

2. **Manual Installation (Available Now):**
   - Download latest release: [v2.0.0](https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v2.0.0)
   - Extract to `.obsidian/plugins/ai-web-search/`
   - Enable plugin in Obsidian settings

### Setup

1. **Get API Keys:**
   - **Gemini**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - **Perplexity**: [Perplexity Settings](https://www.perplexity.ai/settings/api)
   - **Tavily**: [Tavily Console](https://app.tavily.com/)

2. **Configure Plugin:**
   - Open Obsidian Settings → Community Plugins → AI Web Search
   - Add your API keys
   - Choose preferred AI provider
   - Adjust settings as needed

3. **Start Searching:**
   - Click the 🔍 icon in ribbon
   - Or use Command Palette: "AI Web Search"

## 🎥 YouTube Integration

### Smart YouTube Context Mode
- **Video Analysis**: Paste YouTube URL for AI-powered video analysis
- **Follow-up Questions**: Ask questions about the video content
- **Context Persistence**: Maintains video context across questions

### Usage:
```
🎥 Smart YouTube Context Mode
1. Paste YouTube URL: https://youtube.com/watch?v=VIDEO_ID
2. Ask questions about the video
3. Get AI-powered insights with source citations
```

## ⚙️ Configuration

### AI Provider Settings
- **Temperature**: Control response creativity (0.0-1.0)
- **Max Tokens**: Limit response length
- **Model Selection**: Choose specific AI models
- **Research Mode**: Enable deep research capabilities

### Interface Options
- **Language**: Vietnamese/English interface
- **Auto-save**: Automatically save responses
- **Chat Persistence**: Maintain conversation history

## 🛠️ Advanced Usage

### Research Mode Parameters
- **Search Domain Filter**: Include/exclude specific domains
- **Recency Filter**: Focus on recent content (hour/day/week/month)
- **Related Questions**: Get AI-suggested follow-ups
- **Search Context Size**: Control search depth

### Citation Features
- **Clickable Sources**: Direct links to original content
- **Source Titles**: Readable titles extracted from URLs
- **Citation Numbers**: [1], [2], [3] linked to sources section
- **External Link Indicators**: Visual cues for external content

## 📖 Examples

### Basic Search
```
Query: "Latest developments in AI technology"
→ Get comprehensive AI-powered research with sources
```

### YouTube Analysis
```
URL: https://youtube.com/watch?v=dQw4w9WgXcQ
Query: "What are the main themes in this video?"
→ AI analyzes video content and provides insights
```

### Research Mode
```
Query: "Climate change impacts on agriculture"
→ Deep research with multiple sources and citations
```

## 🔧 Development

### Requirements
- Node.js 16+
- TypeScript
- Obsidian API

### Build
```bash
npm install
npm run build
```

### Manual Installation
1. Download latest release
2. Extract to `.obsidian/plugins/ai-web-search/`
3. Enable in Obsidian settings

## 📝 Changelog

### v2.0.0 (Current - Under Review)
- ✅ Smart YouTube Context Mode
- ✅ Enhanced Perplexity integration  
- ✅ Clickable citation system
- ✅ Improved source extraction
- ✅ Multiple language support
- ✅ Enhanced chat interface with persistent conversations
- ✅ Submitted to Obsidian Community ([Review #7342](https://github.com/obsidianmd/obsidian-releases/pull/7342))

### v1.8.0
- 🔧 Fixed Perplexity sources display
- 🎨 Enhanced Obsidian markdown compatibility
- 🔗 Improved citation linking

### v1.5.0
- 🚀 Updated Perplexity API models
- 🔧 Fixed API compatibility issues
- 📊 Enhanced error handling

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **GitHub**: [thienphuc205/obsidian-ai-web-search-plugin](https://github.com/thienphuc205/obsidian-ai-web-search-plugin)
- **Issues**: [Report Issues](https://github.com/thienphuc205/obsidian-ai-web-search-plugin/issues)
- **Releases**: [Latest Releases](https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases)
- **Community Review**: [Obsidian Plugin Review #7342](https://github.com/obsidianmd/obsidian-releases/pull/7342)

## 💝 Support

If you find this plugin helpful:
- ⭐ Star the repository
- 🐛 Report issues
- 💡 Suggest features
- ☕ Buy me a coffee

## 📋 Community Plugin Status

**Current Status:** ✅ Successfully Submitted - Under Official Review  
**Submission Date:** August 6, 2025  
**Review PR:** [#7342](https://github.com/obsidianmd/obsidian-releases/pull/7342)  
**Submission Verified:** All checklist items completed ✓  
**Expected Timeline:** 1-4 weeks for Obsidian team review  
**Track Progress:** Watch the PR for updates and approval status

### Review Details
- **Plugin ID:** `ai-web-search`
- **Repository:** [thienphuc205/obsidian-ai-web-search-plugin](https://github.com/thienphuc205/obsidian-ai-web-search-plugin)
- **Release:** [v2.0.0](https://github.com/thienphuc205/obsidian-ai-web-search-plugin/releases/tag/v2.0.0)
- **Submission Status:** Complete with all required files
- **Community Guidelines:** Fully compliant ✓

---

**Made with ❤️ for the Obsidian community**

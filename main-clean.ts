import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf } from 'obsidian';

// Enhanced settings with multiple providers and advanced parameters
interface GeminiWebSearchSettings {
	provider: 'gemini' | 'perplexity' | 'tavily' | 'exa';
	geminiApiKey: string;
	perplexityApiKey: string;
	tavilyApiKey: string;
	exaApiKey: string;
	geminiModel: string;
	perplexityModel: string;
	insertMode: 'replace' | 'append';
	maxResults: number;
	includeImages: boolean;
	
	// Advanced Gemini parameters
	geminiTemperature: number;
	geminiTopP: number;
	geminiTopK: number;
	geminiMaxTokens: number;
	
	// Advanced Perplexity parameters  
	perplexityTemperature: number;
	perplexityTopP: number;
	perplexityTopK: number;
	perplexityMaxTokens: number;
	
	// Advanced Exa parameters
	exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast';
	exaCategory: string;
	exaIncludeDomains: string[];
	exaExcludeDomains: string[];
	exaStartDate: string;
	exaEndDate: string;
	exaIncludeText: string[];
	exaExcludeText: string[];
	exaGetText: boolean;
	exaGetHighlights: boolean;
	exaGetSummary: boolean;
	
	// Custom prompts
	enableCustomPrompts: boolean;
	quickPrompt: string;
	comprehensivePrompt: string;
	deepPrompt: string;
	reasoningPrompt: string;
}

const DEFAULT_SETTINGS: GeminiWebSearchSettings = {
	provider: 'gemini',
	geminiApiKey: '',
	perplexityApiKey: '',
	tavilyApiKey: '',
	exaApiKey: '',
	geminiModel: 'gemini-2.5-flash',
	perplexityModel: 'sonar-pro',
	insertMode: 'replace',
	maxResults: 5,
	includeImages: false,
	
	// Advanced Gemini parameters (sensible defaults)
	geminiTemperature: 0.7,
	geminiTopP: 0.8,
	geminiTopK: 40,
	geminiMaxTokens: 2000,
	
	// Advanced Perplexity parameters (sensible defaults)
	perplexityTemperature: 0.75,
	perplexityTopP: 0.9,
	perplexityTopK: 50,
	perplexityMaxTokens: 2000,
	
	// Advanced Exa parameters (optimal defaults from docs)
	exaSearchType: 'auto',
	exaCategory: '',
	exaIncludeDomains: [],
	exaExcludeDomains: [],
	exaStartDate: '',
	exaEndDate: '',
	exaIncludeText: [],
	exaExcludeText: [],
	exaGetText: true,
	exaGetHighlights: true,
	exaGetSummary: true,
	
	// Custom prompts với frameworks chuyên nghiệp
	enableCustomPrompts: false,
	quickPrompt: `### Nhiệm vụ: Trả lời nhanh và chính xác

Bạn là một chuyên gia có kiến thức sâu rộng. Hãy trả lời câu hỏi sau một cách ngắn gọn và chính xác:

**Câu hỏi:** "{query}"

**Yêu cầu đầu ra:**
- Trả lời trực tiếp và súc tích (2-3 câu tối đa)
- Tập trung vào 2-3 điểm quan trọng nhất
- Sử dụng ngôn ngữ rõ ràng, dễ hiểu
- Nếu không chắc chắn, hãy nói "Cần thêm thông tin để trả lời chính xác"

**Định dạng:** Trả lời trực tiếp, không cần giải thích dài dòng.`,

	comprehensivePrompt: `Framework CRISPE - Phân tích toàn diện chủ đề: "{query}"`,

	deepPrompt: `Framework TRACE - Nghiên cứu sâu về: "{query}"`,

	reasoningPrompt: `Framework Chain-of-Thought - Phân tích logic: "{query}"`
};

export default class GeminiWebSearchPlugin extends Plugin {
	settings: GeminiWebSearchSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GeminiSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class GeminiSettingTab extends PluginSettingTab {
	plugin: GeminiWebSearchPlugin;

	constructor(app: App, plugin: GeminiWebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'AI Web Search Settings'});

		new Setting(containerEl)
			.setName('Provider')
			.setDesc('Choose AI provider')
			.addDropdown(dropdown => dropdown
				.addOption('gemini', 'Google Gemini')
				.addOption('perplexity', 'Perplexity AI')
				.addOption('tavily', 'Tavily Search')
				.addOption('exa', 'Exa Neural Search')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value: 'gemini' | 'perplexity' | 'tavily' | 'exa') => {
					this.plugin.settings.provider = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Your Google Gemini API key')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}

import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf } from 'obsidian';

// Enhanced settings with multiple providers
interface GeminiWebSearchSettings {
	provider: 'gemini' | 'perplexity' | 'tavily';
	geminiApiKey: string;
	perplexityApiKey: string;
	tavilyApiKey: string;
	geminiModel: string;
	perplexityModel: string;
	insertMode: 'replace' | 'append';
	maxResults: number;
	includeImages: boolean;
}

const DEFAULT_SETTINGS: GeminiWebSearchSettings = {
	provider: 'gemini',
	geminiApiKey: '',
	perplexityApiKey: '',
	tavilyApiKey: '',
	geminiModel: 'gemini-2.5-flash',
	perplexityModel: 'sonar-pro',
	insertMode: 'replace',
	maxResults: 5,
	includeImages: false
}

// Chat View constants
export const CHAT_VIEW_TYPE = "gemini-chat-view";

// Chat View Class
export class GeminiChatView extends ItemView {
	private chatContainer: HTMLElement;
	private inputContainer: HTMLElement;
	private messageContainer: HTMLElement;
	private plugin: GeminiWebSearchPlugin;
	public currentResearchMode: {
		id: string;
		label: string;
		description: string;
		model: string;
		perplexityModel: string;
	};

	constructor(leaf: WorkspaceLeaf, plugin: GeminiWebSearchPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return CHAT_VIEW_TYPE;
	}

	getDisplayText() {
		return "Gemini Chat";
	}

	getIcon() {
		return "message-circle";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('gemini-chat-container');

		// Header
		const header = container.createEl('div', { cls: 'gemini-chat-header' });
		header.createEl('h3', { text: 'AI Web Search Chat' });
		
		// Provider selector container
		const providerContainer = header.createEl('div', { cls: 'provider-container' });
		
		providerContainer.createEl('span', { 
			text: 'Provider: ',
			cls: 'provider-label'
		});

		// Provider dropdown
		const providerDropdown = providerContainer.createEl('select', { cls: 'provider-dropdown' });
		
		// Add options with status indicators
		const geminiOption = providerDropdown.createEl('option', { 
			value: 'gemini', 
			text: `Google Gemini ${this.checkApiKey('gemini') ? '✓' : '⚠️'}`
		});
		const perplexityOption = providerDropdown.createEl('option', { 
			value: 'perplexity', 
			text: `Perplexity AI ${this.checkApiKey('perplexity') ? '✓' : '⚠️'}`
		});
		const tavilyOption = providerDropdown.createEl('option', { 
			value: 'tavily', 
			text: `Tavily Search ${this.checkApiKey('tavily') ? '✓' : '⚠️'}`
		});

		// Set current value
		providerDropdown.value = this.plugin.settings.provider;

		// Handle provider change
		providerDropdown.addEventListener('change', async (e) => {
			const newProvider = (e.target as HTMLSelectElement).value as 'gemini' | 'perplexity' | 'tavily';
			this.plugin.settings.provider = newProvider;
			await this.plugin.saveSettings();
			
			// Check if API key is configured
			const hasApiKey = this.checkApiKey(newProvider);
			if (hasApiKey) {
				this.addMessage('system', `Switched to ${newProvider}. Ready for your questions!`);
			} else {
				this.addMessage('system', `⚠️ Switched to ${newProvider}, but API key not configured. Please add your API key in plugin settings.`);
			}
		});

		// Message Container
		this.messageContainer = container.createEl('div', { cls: 'gemini-chat-messages' });
		
		// Input Container
		this.inputContainer = container.createEl('div', { cls: 'gemini-chat-input-container' });
		this.createInputArea();

		// Set default research mode
		this.currentResearchMode = {
			id: 'comprehensive',
			label: '🔍 Comprehensive',
			description: 'Balanced research with detailed analysis',
			model: 'gemini-2.5-flash',
			perplexityModel: 'sonar-pro'
		};

		// Welcome message
		const hasApiKey = this.checkApiKey(this.plugin.settings.provider);
		if (hasApiKey) {
			this.addMessage('system', `Welcome! Ask me anything and I'll search the web for you using ${this.plugin.settings.provider}.`);
		} else {
			this.addMessage('system', `⚠️ Welcome! Please configure your ${this.plugin.settings.provider} API key in plugin settings before starting.`);
		}
	}

	setResearchMode(mode: {id: string, label: string, description: string, model: string, perplexityModel: string}) {
		this.currentResearchMode = mode;
		
		// Update button states for bottom buttons
		const buttons = this.containerEl.querySelectorAll('.research-mode-btn-small');
		buttons.forEach(btn => {
			btn.removeClass('active');
			if (btn.getAttribute('data-mode') === mode.id) {
				btn.addClass('active');
			}
		});
		
		// Update plugin settings based on provider
		if (this.plugin.settings.provider === 'gemini') {
			this.plugin.settings.geminiModel = mode.model;
		} else if (this.plugin.settings.provider === 'perplexity') {
			this.plugin.settings.perplexityModel = mode.perplexityModel;
		}
		
		this.plugin.saveSettings();
		
		// Add system message about mode change
		this.addMessage('system', `Research mode set to ${mode.label}: ${mode.description}`);
	}

	createInputArea() {
		this.inputContainer.empty();
		
		const inputGroup = this.inputContainer.createEl('div', { cls: 'input-group' });
		
		const textarea = inputGroup.createEl('textarea', {
			cls: 'gemini-chat-input',
			attr: { 
				placeholder: 'Ask anything...',
				rows: '3'
			}
		});

		const buttonGroup = inputGroup.createEl('div', { cls: 'button-group' });
		
		const sendButton = buttonGroup.createEl('button', {
			cls: 'send-button',
			text: 'Send'
		});

		const insertButton = buttonGroup.createEl('button', {
			cls: 'insert-button', 
			text: 'Send & Insert'
		});

		// Research Mode Buttons - moved to bottom
		const researchModeContainer = this.inputContainer.createEl('div', { cls: 'research-mode-container-bottom' });
		researchModeContainer.createEl('div', { text: 'Research Mode:', cls: 'research-mode-label-small' });
		
		const researchButtonsContainer = researchModeContainer.createEl('div', { cls: 'research-mode-buttons-bottom' });
		
		const researchModes = [
			{
				id: 'quick',
				label: '⚡ Quick',
				description: 'Fast answers',
				model: 'gemini-2.5-flash-lite',
				perplexityModel: 'sonar'
			},
			{
				id: 'comprehensive',
				label: '🔍 Comprehensive',
				description: 'Balanced research',
				model: 'gemini-2.5-flash',
				perplexityModel: 'sonar-pro'
			},
			{
				id: 'deep',
				label: '🎯 Deep',
				description: 'Expert analysis',
				model: 'gemini-2.5-pro',
				perplexityModel: 'sonar-deep-research'
			},
			{
				id: 'reasoning',
				label: '🧠 Reasoning',
				description: 'Complex analysis',
				model: 'gemini-2.5-pro',
				perplexityModel: 'sonar-reasoning'
			}
		];

		researchModes.forEach(mode => {
			const button = researchButtonsContainer.createEl('button', {
				cls: `research-mode-btn-small research-mode-${mode.id}`,
				attr: { 'data-mode': mode.id },
				text: mode.label
			});
			
			button.addEventListener('click', () => {
				this.setResearchMode(mode);
				
				// Update button states
				const buttons = researchButtonsContainer.querySelectorAll('.research-mode-btn-small');
				buttons.forEach(btn => btn.removeClass('active'));
				button.addClass('active');
			});
		});

		// Set default active button
		researchButtonsContainer.querySelector('[data-mode="comprehensive"]')?.addClass('active');

		// Event listeners
		sendButton.onclick = () => this.handleSend(textarea.value, false);
		insertButton.onclick = () => this.handleSend(textarea.value, true);
		
		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.handleSend(textarea.value, false);
			}
		});
	}

	async handleSend(message: string, insertToNote: boolean) {
		if (!message.trim()) return;

		// Clear input
		const textarea = this.inputContainer.querySelector('.gemini-chat-input') as HTMLTextAreaElement;
		textarea.value = '';

		// Add user message
		this.addMessage('user', message);

		// Add thinking message
		const thinkingId = this.addMessage('assistant', 'Searching the web...', true);

		try {
			const response = await this.plugin.performWebSearch(message);
			
			// Replace thinking message with response
			this.updateMessage(thinkingId, response);

			// Insert to note if requested
			if (insertToNote) {
				this.insertToActiveNote(response);
			}

		} catch (error) {
			this.updateMessage(thinkingId, `Error: ${error.message}`);
		}
	}

	addMessage(role: 'user' | 'assistant' | 'system', content: string, isThinking: boolean = false): string {
		const messageId = Date.now().toString();
		const messageDiv = this.messageContainer.createEl('div', { 
			cls: `message ${role}`,
			attr: { 'data-id': messageId }
		});

		if (role === 'user') {
			messageDiv.createEl('div', { cls: 'message-role', text: 'You' });
		} else if (role === 'assistant') {
			messageDiv.createEl('div', { cls: 'message-role', text: 'AI Assistant' });
		}

		const contentDiv = messageDiv.createEl('div', { cls: 'message-content' });
		
		if (isThinking) {
			contentDiv.addClass('thinking');
		}
		
		contentDiv.textContent = content;

		// Scroll to bottom
		this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

		return messageId;
	}

	updateMessage(messageId: string, newContent: string) {
		const messageEl = this.messageContainer.querySelector(`[data-id="${messageId}"]`);
		if (messageEl) {
			const contentEl = messageEl.querySelector('.message-content');
			if (contentEl) {
				contentEl.removeClass('thinking');
				contentEl.textContent = newContent;
			}
		}
	}

	insertToActiveNote(content: string) {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			const cursor = editor.getCursor();
			editor.replaceRange(`\n\n${content}\n`, cursor);
			new Notice('Response inserted to note');
		} else {
			new Notice('No active note to insert into');
		}
	}

	checkApiKey(provider: 'gemini' | 'perplexity' | 'tavily'): boolean {
		switch (provider) {
			case 'gemini':
				return !!this.plugin.settings.geminiApiKey;
			case 'perplexity':
				return !!this.plugin.settings.perplexityApiKey;
			case 'tavily':
				return !!this.plugin.settings.tavilyApiKey;
			default:
				return false;
		}
	}

	async onClose() {
		// Clean up
	}
}

// Enhanced Main Plugin Class
export default class GeminiWebSearchPlugin extends Plugin {
	settings: GeminiWebSearchSettings;

	async onload() {
		await this.loadSettings();

		// Register chat view
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new GeminiChatView(leaf, this)
		);

		// Add ribbon icon for chat
		this.addRibbonIcon('message-circle', 'Open AI Web Search Chat', () => {
			this.activateView();
		});

		// Keep existing text selection commands
		this.addCommand({
			id: 'gemini-web-search-selection',
			name: 'AI Web Search: Research with selected text',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					this.performWebSearchAndInsert(selection, editor);
				} else {
					new Notice('Please select some text to search.');
				}
			}
		});

		this.addCommand({
			id: 'gemini-web-search-prompt',
			name: 'AI Web Search: Custom query',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.promptForCustomSearch(editor);
			}
		});

		this.addCommand({
			id: 'gemini-open-chat',
			name: 'AI Web Search: Open Chat Panel',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new GeminiSettingTab(this.app, this));
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);

		if (leaves.length > 0) {
			// If view already exists, activate it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
		}

		// Reveal and focus the view
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async performWebSearch(query: string): Promise<string> {
		switch (this.settings.provider) {
			case 'gemini':
				return this.searchWithGemini(query);
			case 'perplexity':
				return this.searchWithPerplexity(query);
			case 'tavily':
				return this.searchWithTavily(query);
			default:
				throw new Error('Invalid provider');
		}
	}

	async searchWithGemini(query: string): Promise<string> {
		if (!this.settings.geminiApiKey) {
			throw new Error('Gemini API key not configured');
		}

		// Get current research mode from chat view
		const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]?.view as GeminiChatView;
		const researchMode = chatView?.currentResearchMode;

		// Customize prompt based on research mode
		let enhancedPrompt = query;
		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					enhancedPrompt = `Provide a quick, concise answer to: "${query}". Focus on the most important facts and key points.`;
					break;
				case 'comprehensive':
					enhancedPrompt = `Provide a comprehensive, well-structured answer about: "${query}". Include key facts, context, and relevant details with proper sources.`;
					break;
				case 'deep':
					enhancedPrompt = `Conduct deep research on: "${query}". Provide expert-level analysis, multiple perspectives, detailed explanations, and comprehensive coverage of the topic with extensive sources.`;
					break;
				case 'reasoning':
					enhancedPrompt = `Analyze and reason through: "${query}". Break down the problem, provide logical reasoning, consider multiple angles, and deliver a thoughtful conclusion with supporting evidence.`;
					break;
				default:
					enhancedPrompt = `Please provide a comprehensive answer about: "${query}"`;
			}
		}

		const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent?key=${this.settings.geminiApiKey}`;

		const requestBody = {
			contents: [{
				parts: [{ text: enhancedPrompt }]
			}],
			tools: [{
				google_search: {}
			}],
			generationConfig: {
				temperature: researchMode?.id === 'reasoning' ? 0.3 : 0.7,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: researchMode?.id === 'quick' ? 1000 : 
								researchMode?.id === 'deep' ? 4000 : 2000
			}
		};

		const response = await requestUrl({
			url: apiUrl,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody)
		});

		const responseData = response.json;
		const candidate = responseData.candidates?.[0];
		
		if (!candidate) {
			throw new Error('No response from Gemini');
		}

		let result = candidate.content.parts[0].text;

		// Add sources if available
		if (candidate.groundingMetadata?.groundingChunks) {
			result += "\n\n--- \n**Sources:**\n";
			const sources = new Set<string>();

			candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
				if (chunk.web?.uri) {
					sources.add(`- [${chunk.web.title || chunk.web.uri}](${chunk.web.uri})`);
				}
			});

			result += Array.from(sources).join('\n');
		}

		return result;
	}

	async searchWithPerplexity(query: string): Promise<string> {
		if (!this.settings.perplexityApiKey) {
			throw new Error('Perplexity API key not configured');
		}

		// Get current research mode from chat view
		const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]?.view as GeminiChatView;
		const researchMode = chatView?.currentResearchMode;
		const modelToUse = researchMode?.perplexityModel || this.settings.perplexityModel;

		const response = await requestUrl({
			url: 'https://api.perplexity.ai/chat/completions',
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.settings.perplexityApiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: modelToUse,
				messages: [{
					role: "user",
					content: query
				}],
				return_citations: true
			})
		});

		const data = response.json;
		const message = data.choices?.[0]?.message?.content;
		
		if (!message) {
			throw new Error('No response from Perplexity');
		}

		return message;
	}

	async searchWithTavily(query: string): Promise<string> {
		if (!this.settings.tavilyApiKey) {
			throw new Error('Tavily API key not configured');
		}

		const response = await requestUrl({
			url: 'https://api.tavily.com/search',
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${this.settings.tavilyApiKey}`
			},
			body: JSON.stringify({
				query: query,
				search_depth: "advanced",
				include_answer: true,
				include_raw_content: false,
				max_results: this.settings.maxResults
			})
		});

		const data = response.json;
		
		let result = data.answer || "No answer found";
		
		if (data.results?.length > 0) {
			result += "\n\n--- \n**Sources:**\n";
			data.results.forEach((item: any) => {
				result += `- [${item.title}](${item.url})\n`;
			});
		}

		return result;
	}

	// Keep existing method for text selection
	async performWebSearchAndInsert(query: string, editor: Editor) {
		try {
			const result = await this.performWebSearch(query);
			
			if (this.settings.insertMode === 'replace') {
				editor.replaceSelection(result);
			} else {
				const cursor = editor.getCursor();
				editor.replaceRange(`\n\n${result}\n`, cursor);
			}
			
			new Notice('Search complete!');
		} catch (error) {
			new Notice(`Search failed: ${error.message}`);
		}
	}

	async promptForCustomSearch(editor: Editor) {
		const query = prompt('Enter your search query:');
		if (query) {
			this.performWebSearchAndInsert(query, editor);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// Enhanced Settings Tab
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

		// Provider selection
		new Setting(containerEl)
			.setName('Search Provider')
			.setDesc('Choose which AI service to use for web search')
			.addDropdown(dropdown => dropdown
				.addOption('gemini', 'Google Gemini (with Google Search)')
				.addOption('perplexity', 'Perplexity (Real-time Search)')
				.addOption('tavily', 'Tavily (Advanced Web Search)')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value: 'gemini' | 'perplexity' | 'tavily') => {
					this.plugin.settings.provider = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show relevant API key field
				}));

		// Insert mode setting
		new Setting(containerEl)
			.setName('Insert Mode')
			.setDesc('How to insert results when using text selection commands')
			.addDropdown(dropdown => dropdown
				.addOption('replace', 'Replace selected text')
				.addOption('append', 'Insert at cursor position')
				.setValue(this.plugin.settings.insertMode)
				.onChange(async (value: 'replace' | 'append') => {
					this.plugin.settings.insertMode = value;
					await this.plugin.saveSettings();
				}));

		// General settings
		new Setting(containerEl)
			.setName('Max Results')
			.setDesc('Maximum number of search results to include')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxResults)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxResults = value;
					await this.plugin.saveSettings();
				}));

		// Provider-specific settings
		containerEl.createEl('h3', {text: 'API Keys'});

		// Gemini settings
		if (this.plugin.settings.provider === 'gemini') {
			new Setting(containerEl)
				.setName('Gemini API Key')
				.setDesc('Get your API key from Google AI Studio')
				.addText(text => text
					.setPlaceholder('Enter your Gemini API key')
					.setValue(this.plugin.settings.geminiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.geminiApiKey = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Gemini Model')
				.setDesc('Choose Gemini model to use')
				.addDropdown(dropdown => dropdown
					.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Fast)')
					.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Advanced)')
					.addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (Legacy)')
					.setValue(this.plugin.settings.geminiModel)
					.onChange(async (value) => {
						this.plugin.settings.geminiModel = value;
						await this.plugin.saveSettings();
					}));
		}

		// Perplexity settings
		if (this.plugin.settings.provider === 'perplexity') {
			new Setting(containerEl)
				.setName('Perplexity API Key')
				.setDesc('Get your API key from Perplexity.ai')
				.addText(text => text
					.setPlaceholder('Enter your Perplexity API key')
					.setValue(this.plugin.settings.perplexityApiKey)
					.onChange(async (value) => {
						this.plugin.settings.perplexityApiKey = value;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Perplexity Model')
				.setDesc('Choose Perplexity model to use')
				.addDropdown(dropdown => dropdown
					.addOption('sonar-pro', 'Sonar Pro (Advanced search)')
					.addOption('sonar-reasoning', 'Sonar Reasoning (Complex analysis)')
					.addOption('sonar-deep-research', 'Sonar Deep Research (Comprehensive)')
					.setValue(this.plugin.settings.perplexityModel)
					.onChange(async (value) => {
						this.plugin.settings.perplexityModel = value;
						await this.plugin.saveSettings();
					}));
		}

		// Tavily settings
		if (this.plugin.settings.provider === 'tavily') {
			new Setting(containerEl)
				.setName('Tavily API Key')
				.setDesc('Get your API key from Tavily.com (1000 free credits/month)')
				.addText(text => text
					.setPlaceholder('Enter your Tavily API key')
					.setValue(this.plugin.settings.tavilyApiKey)
					.onChange(async (value) => {
						this.plugin.settings.tavilyApiKey = value;
						await this.plugin.saveSettings();
					}));
		}

		// Always show all API keys for easy setup
		containerEl.createEl('h4', {text: 'Additional API Keys (Optional)'});
		
		if (this.plugin.settings.provider !== 'gemini') {
			new Setting(containerEl)
				.setName('Gemini API Key')
				.setDesc('Optional: Get from Google AI Studio')
				.addText(text => text
					.setPlaceholder('Enter Gemini API key')
					.setValue(this.plugin.settings.geminiApiKey)
					.onChange(async (value) => {
						this.plugin.settings.geminiApiKey = value;
						await this.plugin.saveSettings();
					}));
		}

		if (this.plugin.settings.provider !== 'perplexity') {
			new Setting(containerEl)
				.setName('Perplexity API Key')
				.setDesc('Optional: Get from Perplexity.ai')
				.addText(text => text
					.setPlaceholder('Enter Perplexity API key')
					.setValue(this.plugin.settings.perplexityApiKey)
					.onChange(async (value) => {
						this.plugin.settings.perplexityApiKey = value;
						await this.plugin.saveSettings();
					}));
		}

		if (this.plugin.settings.provider !== 'tavily') {
			new Setting(containerEl)
				.setName('Tavily API Key')
				.setDesc('Optional: Get from Tavily.com')
				.addText(text => text
					.setPlaceholder('Enter Tavily API key')
					.setValue(this.plugin.settings.tavilyApiKey)
					.onChange(async (value) => {
						this.plugin.settings.tavilyApiKey = value;
						await this.plugin.saveSettings();
					}));
		}
	}
}

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
	
	// Custom prompts
	enableCustomPrompts: false,
	quickPrompt: 'Provide a quick, concise answer to: "{query}". Focus on the most important facts and key points.',
	comprehensivePrompt: 'Provide a comprehensive, well-structured answer about: "{query}". Include key facts, context, and relevant details with proper sources.',
	deepPrompt: 'Conduct deep research on: "{query}". Provide expert-level analysis, multiple perspectives, detailed explanations, and comprehensive coverage of the topic with extensive sources.',
	reasoningPrompt: 'Analyze and reason through: "{query}". Break down the problem, provide logical reasoning, consider multiple angles, and deliver a thoughtful conclusion with supporting evidence.'
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
		exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast';
		exaCategory: string;
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
		const exaOption = providerDropdown.createEl('option', { 
			value: 'exa', 
			text: `Exa AI Search ${this.checkApiKey('exa') ? '✓' : '⚠️'}`
		});

		// Set current value
		providerDropdown.value = this.plugin.settings.provider;

		// Handle provider change
		providerDropdown.addEventListener('change', async (e) => {
			const newProvider = (e.target as HTMLSelectElement).value as 'gemini' | 'perplexity' | 'tavily' | 'exa';
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
			perplexityModel: 'sonar-pro',
			exaSearchType: 'auto',
			exaCategory: ''
		};

		// Welcome message
		const hasApiKey = this.checkApiKey(this.plugin.settings.provider);
		if (hasApiKey) {
			this.addMessage('system', `Welcome! Ask me anything and I'll search the web for you using ${this.plugin.settings.provider}.`);
		} else {
			this.addMessage('system', `⚠️ Welcome! Please configure your ${this.plugin.settings.provider} API key in plugin settings before starting.`);
		}
	}

	setResearchMode(mode: {id: string, label: string, description: string, model: string, perplexityModel: string, exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast', exaCategory: string}) {
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
		} else if (this.plugin.settings.provider === 'exa') {
			this.plugin.settings.exaSearchType = mode.exaSearchType;
			this.plugin.settings.exaCategory = mode.exaCategory;
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
				perplexityModel: 'sonar',
				exaSearchType: 'fast' as const,
				exaCategory: ''
			},
			{
				id: 'comprehensive',
				label: '🔍 Comprehensive',
				description: 'Balanced research',
				model: 'gemini-2.5-flash',
				perplexityModel: 'sonar-pro',
				exaSearchType: 'auto' as const,
				exaCategory: ''
			},
			{
				id: 'deep',
				label: '🎯 Deep',
				description: 'Expert analysis',
				model: 'gemini-2.5-pro',
				perplexityModel: 'sonar-deep-research',
				exaSearchType: 'neural' as const,
				exaCategory: 'research paper'
			},
			{
				id: 'reasoning',
				label: '🧠 Reasoning',
				description: 'Complex analysis',
				model: 'gemini-2.5-pro',
				perplexityModel: 'sonar-reasoning',
				exaSearchType: 'neural' as const,
				exaCategory: 'research paper'
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
			const roleHeader = messageDiv.createEl('div', { cls: 'message-role-header' });
			roleHeader.createEl('span', { cls: 'message-role', text: 'AI Assistant' });
			
			// Add copy button for AI responses
			const copyButton = roleHeader.createEl('button', {
				cls: 'copy-button',
				text: '📋 Copy'
			});
			
			copyButton.addEventListener('click', () => {
				navigator.clipboard.writeText(content);
				copyButton.textContent = '✅ Copied!';
				setTimeout(() => {
					copyButton.textContent = '📋 Copy';
				}, 2000);
			});
		}

		const contentDiv = messageDiv.createEl('div', { cls: 'message-content' });
		
		if (isThinking) {
			contentDiv.addClass('thinking');
		}
		
		// Enable text selection and render markdown
		contentDiv.addClass('selectable-text');
		
		if (role === 'assistant' && !isThinking) {
			// Render markdown for AI responses
			this.renderMarkdownContent(contentDiv, content);
		} else {
			contentDiv.textContent = content;
		}

		// Scroll to bottom
		this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

		return messageId;
	}

	updateMessage(messageId: string, newContent: string) {
		const messageEl = this.messageContainer.querySelector(`[data-id="${messageId}"]`);
		if (messageEl) {
			const contentEl = messageEl.querySelector('.message-content') as HTMLElement;
			if (contentEl) {
				contentEl.removeClass('thinking');
				contentEl.addClass('selectable-text');
				
				// Render markdown for AI responses
				this.renderMarkdownContent(contentEl, newContent);
				
				// Update copy button functionality
				const copyButton = messageEl.querySelector('.copy-button') as HTMLButtonElement;
				if (copyButton) {
					copyButton.onclick = () => {
						navigator.clipboard.writeText(newContent);
						copyButton.textContent = '✅ Copied!';
						setTimeout(() => {
							copyButton.textContent = '📋 Copy';
						}, 2000);
					};
				}
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

	checkApiKey(provider: 'gemini' | 'perplexity' | 'tavily' | 'exa'): boolean {
		switch (provider) {
			case 'gemini':
				return !!this.plugin.settings.geminiApiKey;
			case 'perplexity':
				return !!this.plugin.settings.perplexityApiKey;
			case 'tavily':
				return !!this.plugin.settings.tavilyApiKey;
			case 'exa':
				return !!this.plugin.settings.exaApiKey;
			default:
				return false;
		}
	}

	// Add markdown rendering method
	renderMarkdownContent(container: HTMLElement, content: string) {
		container.empty();
		
		// Simple markdown parsing for common elements
		const lines = content.split('\n');
		let currentElement: HTMLElement = container;
		let inCodeBlock = false;
		let codeBlockContent: string[] = [];
		
		lines.forEach(line => {
			if (line.startsWith('```')) {
				if (inCodeBlock) {
					// End code block
					const pre = container.createEl('pre');
					const code = pre.createEl('code');
					code.textContent = codeBlockContent.join('\n');
					codeBlockContent = [];
					inCodeBlock = false;
					currentElement = container;
				} else {
					// Start code block
					inCodeBlock = true;
				}
			} else if (inCodeBlock) {
				codeBlockContent.push(line);
			} else if (line.startsWith('### ')) {
				const h3 = container.createEl('h3');
				h3.textContent = line.replace('### ', '');
				currentElement = container;
			} else if (line.startsWith('## ')) {
				const h2 = container.createEl('h2');
				h2.textContent = line.replace('## ', '');
				currentElement = container;
			} else if (line.startsWith('# ')) {
				const h1 = container.createEl('h1');
				h1.textContent = line.replace('# ', '');
				currentElement = container;
			} else if (line.startsWith('- ') || line.startsWith('* ')) {
				// Create ul if it doesn't exist or if current element is not UL
				if (currentElement.tagName !== 'UL') {
					currentElement = container.createEl('ul');
				}
				const li = currentElement.createEl('li');
				this.parseInlineMarkdown(li, line.replace(/^[*-] /, ''));
			} else if (line.startsWith('**Sources:**') || line.startsWith('--- ')) {
				// Handle sources section
				if (line.startsWith('--- ')) {
					container.createEl('hr');
				} else {
					const sourcesHeader = container.createEl('h4');
					sourcesHeader.textContent = 'Sources:';
				}
				currentElement = container;
			} else if (line.trim() === '') {
				container.createEl('br');
				currentElement = container;
			} else {
				// Regular paragraph
				if (currentElement.tagName === 'UL') {
					currentElement = container;
				}
				const p = container.createEl('p');
				this.parseInlineMarkdown(p, line);
			}
		});
	}

	// Parse inline markdown (bold, italic, links, code)
	parseInlineMarkdown(element: HTMLElement, text: string) {
		// Handle bold, italic, code, and links
		let html = text;
		
		// Bold **text**
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		
		// Italic *text*
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
		
		// Inline code `text`
		html = html.replace(/`(.*?)`/g, '<code>$1</code>');
		
		// Links [text](url)
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
		
		element.innerHTML = html;
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
			case 'exa':
				return this.searchWithExa(query);
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

		// Customize prompt based on research mode or custom prompts
		let enhancedPrompt = query;
		if (this.settings.enableCustomPrompts && researchMode) {
			switch (researchMode.id) {
				case 'quick':
					enhancedPrompt = this.settings.quickPrompt.replace('{query}', query);
					break;
				case 'comprehensive':
					enhancedPrompt = this.settings.comprehensivePrompt.replace('{query}', query);
					break;
				case 'deep':
					enhancedPrompt = this.settings.deepPrompt.replace('{query}', query);
					break;
				case 'reasoning':
					enhancedPrompt = this.settings.reasoningPrompt.replace('{query}', query);
					break;
				default:
					enhancedPrompt = this.settings.comprehensivePrompt.replace('{query}', query);
			}
		} else if (researchMode) {
			// Use default prompts
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

		// Dynamic token limits based on research mode
		let maxTokens = this.settings.geminiMaxTokens;
		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					maxTokens = Math.min(this.settings.geminiMaxTokens, 1000);
					break;
				case 'deep':
					maxTokens = Math.max(this.settings.geminiMaxTokens, 4000);
					break;
				case 'reasoning':
					maxTokens = this.settings.geminiMaxTokens;
					break;
				default:
					maxTokens = this.settings.geminiMaxTokens;
			}
		}

		const requestBody = {
			contents: [{
				parts: [{ text: enhancedPrompt }]
			}],
			tools: [{
				google_search: {}
			}],
			generationConfig: {
				temperature: this.settings.geminiTemperature,
				topP: this.settings.geminiTopP,
				topK: this.settings.geminiTopK,
				maxOutputTokens: maxTokens
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

		// Dynamic token limits based on research mode
		let maxTokens = this.settings.perplexityMaxTokens;
		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					maxTokens = Math.min(this.settings.perplexityMaxTokens, 1000);
					break;
				case 'deep':
					maxTokens = Math.max(this.settings.perplexityMaxTokens, 4000);
					break;
				default:
					maxTokens = this.settings.perplexityMaxTokens;
			}
		}

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
				max_tokens: maxTokens,
				temperature: this.settings.perplexityTemperature,
				top_p: this.settings.perplexityTopP,
				top_k: this.settings.perplexityTopK,
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

	async searchWithExa(query: string): Promise<string> {
		if (!this.settings.exaApiKey) {
			throw new Error('Exa API key not configured');
		}

		// Get current research mode from chat view
		const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]?.view as GeminiChatView;
		const researchMode = chatView?.currentResearchMode;

		// Map research modes to Exa search types and configurations
		let searchType = this.settings.exaSearchType;
		let numResults = this.settings.maxResults;
		let category = this.settings.exaCategory;

		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					searchType = 'fast'; // Use fast search for quick mode (425ms latency)
					numResults = Math.min(this.settings.maxResults, 3);
					break;
				case 'comprehensive':
					searchType = 'auto'; // Auto intelligently combines neural+keyword
					numResults = this.settings.maxResults;
					break;
				case 'deep':
					searchType = 'neural'; // Neural search for semantic understanding
					numResults = Math.max(this.settings.maxResults, 8);
					category = researchMode.exaCategory || 'research paper'; // Focus on research papers
					break;
				case 'reasoning':
					searchType = 'neural'; // Neural for complex analysis
					numResults = this.settings.maxResults;
					category = researchMode.exaCategory || 'research paper'; // Academic sources
					break;
			}
		}

		// Build request body according to Exa API specification
		const requestBody: any = {
			query: query,
			type: searchType,
			numResults: Math.min(numResults, 100), // Exa limit is 100
			contents: {
				text: this.settings.exaGetText,
				highlights: this.settings.exaGetHighlights,
				summary: this.settings.exaGetSummary
			}
		};

		// Add optional parameters if configured
		if (category) {
			requestBody.category = category;
		}

		if (this.settings.exaIncludeDomains.length > 0) {
			requestBody.includeDomains = this.settings.exaIncludeDomains;
		}

		if (this.settings.exaExcludeDomains.length > 0) {
			requestBody.excludeDomains = this.settings.exaExcludeDomains;
		}

		if (this.settings.exaStartDate) {
			requestBody.startPublishedDate = this.settings.exaStartDate;
		}

		if (this.settings.exaEndDate) {
			requestBody.endPublishedDate = this.settings.exaEndDate;
		}

		if (this.settings.exaIncludeText.length > 0) {
			requestBody.includeText = this.settings.exaIncludeText;
		}

		if (this.settings.exaExcludeText.length > 0) {
			requestBody.excludeText = this.settings.exaExcludeText;
		}

		try {
			const response = await requestUrl({
				url: 'https://api.exa.ai/search',
				method: 'POST',
				headers: {
					'x-api-key': this.settings.exaApiKey,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const data = response.json;

			if (!data.results || data.results.length === 0) {
				return "No results found for your query.";
			}

			// Format results with rich content
			let result = `# Search Results for: "${query}"\n\n`;

			// Add search type info
			result += `*Search performed using **${data.resolvedSearchType || searchType}** search (${data.results.length} results)*\n\n`;

			// Process results
			data.results.forEach((item: any, index: number) => {
				result += `## ${index + 1}. ${item.title}\n\n`;
				
				if (item.summary && this.settings.exaGetSummary) {
					result += `**Summary:** ${item.summary}\n\n`;
				}

				if (item.text && this.settings.exaGetText) {
					// Truncate long text for readability
					const truncatedText = item.text.length > 800 
						? item.text.substring(0, 800) + "..." 
						: item.text;
					result += `${truncatedText}\n\n`;
				}

				if (item.highlights && item.highlights.length > 0 && this.settings.exaGetHighlights) {
					result += `**Key Highlights:**\n`;
					item.highlights.forEach((highlight: string) => {
						result += `- *${highlight}*\n`;
					});
					result += `\n`;
				}

				if (item.author) {
					result += `**Author:** ${item.author}\n`;
				}

				if (item.publishedDate) {
					const date = new Date(item.publishedDate).toLocaleDateString();
					result += `**Published:** ${date}\n`;
				}

				if (item.score) {
					result += `**Relevance Score:** ${(item.score * 100).toFixed(1)}%\n`;
				}

				result += `**Source:** [${item.url}](${item.url})\n\n`;
				result += `---\n\n`;
			});

			// Add sources section
			result += `## Sources\n\n`;
			data.results.forEach((item: any, index: number) => {
				result += `${index + 1}. [${item.title}](${item.url})`;
				if (item.author) {
					result += ` - ${item.author}`;
				}
				result += `\n`;
			});

			// Add cost information if available
			if (data.costDollars) {
				result += `\n*Search cost: $${data.costDollars.total.toFixed(4)}*\n`;
			}

			return result;

		} catch (error) {
			console.error('Exa search error:', error);
			throw new Error(`Exa search failed: ${error.message}`);
		}
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
				.addOption('exa', 'Exa (AI-powered Semantic Search)')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value: 'gemini' | 'perplexity' | 'tavily' | 'exa') => {
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

		// Custom prompts toggle
		new Setting(containerEl)
			.setName('Enable Custom Prompts')
			.setDesc('Use custom prompts for research modes instead of defaults')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCustomPrompts)
				.onChange(async (value) => {
					this.plugin.settings.enableCustomPrompts = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide custom prompt settings
				}));

		// Provider-specific settings
		containerEl.createEl('h3', {text: 'API Keys'});

		// Gemini settings
		if (this.plugin.settings.provider === 'gemini') {
			this.addGeminiSettings(containerEl);
		}

		// Perplexity settings
		if (this.plugin.settings.provider === 'perplexity') {
			this.addPerplexitySettings(containerEl);
		}

		// Tavily settings
		if (this.plugin.settings.provider === 'tavily') {
			this.addTavilySettings(containerEl);
		}

		// Exa settings
		if (this.plugin.settings.provider === 'exa') {
			this.addExaSettings(containerEl);
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

		if (this.plugin.settings.provider !== 'exa') {
			new Setting(containerEl)
				.setName('Exa API Key')
				.setDesc('Optional: Get from dashboard.exa.ai')
				.addText(text => text
					.setPlaceholder('Enter Exa API key')
					.setValue(this.plugin.settings.exaApiKey)
					.onChange(async (value) => {
						this.plugin.settings.exaApiKey = value;
						await this.plugin.saveSettings();
					}));
		}

		// Custom prompts section
		if (this.plugin.settings.enableCustomPrompts) {
			this.addCustomPromptSettings(containerEl);
		}
	}

	addGeminiSettings(containerEl: HTMLElement) {
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
				.addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite (Fastest)')
				.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Fast)')
				.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Advanced)')
				.addOption('gemini-1.5-flash', 'Gemini 1.5 Flash (Legacy)')
				.setValue(this.plugin.settings.geminiModel)
				.onChange(async (value) => {
					this.plugin.settings.geminiModel = value;
					await this.plugin.saveSettings();
				}));

		// Advanced Gemini Parameters
		containerEl.createEl('h4', {text: 'Advanced Gemini Parameters'});

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls randomness (0.0 = deterministic, 1.0 = very random)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.geminiTemperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.geminiTemperature = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Top P')
			.setDesc('Nucleus sampling threshold (0.1 = conservative, 1.0 = diverse)')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(this.plugin.settings.geminiTopP)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.geminiTopP = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Top K')
			.setDesc('Number of top tokens to consider (1-100)')
			.addSlider(slider => slider
				.setLimits(1, 100, 1)
				.setValue(this.plugin.settings.geminiTopK)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.geminiTopK = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max Output Tokens')
			.setDesc('Maximum response length (100-8192)')
			.addSlider(slider => slider
				.setLimits(100, 8192, 100)
				.setValue(this.plugin.settings.geminiMaxTokens)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.geminiMaxTokens = value;
					await this.plugin.saveSettings();
				}));
	}

	addPerplexitySettings(containerEl: HTMLElement) {
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
				.addOption('sonar', 'Sonar (Basic search)')
				.addOption('sonar-pro', 'Sonar Pro (Advanced search)')
				.addOption('sonar-reasoning', 'Sonar Reasoning (Complex analysis)')
				.addOption('sonar-deep-research', 'Sonar Deep Research (Comprehensive)')
				.setValue(this.plugin.settings.perplexityModel)
				.onChange(async (value) => {
					this.plugin.settings.perplexityModel = value;
					await this.plugin.saveSettings();
				}));

		// Advanced Perplexity Parameters
		containerEl.createEl('h4', {text: 'Advanced Perplexity Parameters'});

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls randomness (0.0 = deterministic, 2.0 = very random)')
			.addSlider(slider => slider
				.setLimits(0, 2, 0.1)
				.setValue(this.plugin.settings.perplexityTemperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.perplexityTemperature = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Top P')
			.setDesc('Nucleus sampling threshold (0.1 = conservative, 1.0 = diverse)')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(this.plugin.settings.perplexityTopP)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.perplexityTopP = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Top K')
			.setDesc('Number of top tokens to consider (1-100)')
			.addSlider(slider => slider
				.setLimits(1, 100, 1)
				.setValue(this.plugin.settings.perplexityTopK)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.perplexityTopK = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max Output Tokens')
			.setDesc('Maximum response length (100-4096)')
			.addSlider(slider => slider
				.setLimits(100, 4096, 100)
				.setValue(this.plugin.settings.perplexityMaxTokens)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.perplexityMaxTokens = value;
					await this.plugin.saveSettings();
				}));
	}

	addTavilySettings(containerEl: HTMLElement) {
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

	addExaSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Exa API Key')
			.setDesc('Get your API key from dashboard.exa.ai ($10 free credits)')
			.addText(text => text
				.setPlaceholder('Enter your Exa API key')
				.setValue(this.plugin.settings.exaApiKey)
				.onChange(async (value) => {
					this.plugin.settings.exaApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Advanced Exa Parameters
		containerEl.createEl('h4', {text: 'Advanced Exa Parameters'});

		new Setting(containerEl)
			.setName('Search Type')
			.setDesc('Neural = semantic search, Keyword = traditional, Auto = intelligent blend, Fast = optimized speed (425ms)')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto (Recommended)')
				.addOption('neural', 'Neural (Semantic)')
				.addOption('keyword', 'Keyword (Traditional)')
				.addOption('fast', 'Fast (425ms latency)')
				.setValue(this.plugin.settings.exaSearchType)
				.onChange(async (value: 'auto' | 'neural' | 'keyword' | 'fast') => {
					this.plugin.settings.exaSearchType = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Content Category')
			.setDesc('Filter results by content type (leave empty for all)')
			.addDropdown(dropdown => dropdown
				.addOption('', 'All Categories')
				.addOption('company', 'Company')
				.addOption('research paper', 'Research Paper')
				.addOption('news', 'News')
				.addOption('pdf', 'PDF Documents')
				.addOption('github', 'GitHub')
				.addOption('tweet', 'Twitter')
				.addOption('personal site', 'Personal Site')
				.addOption('linkedin profile', 'LinkedIn Profile')
				.addOption('financial report', 'Financial Report')
				.setValue(this.plugin.settings.exaCategory)
				.onChange(async (value) => {
					this.plugin.settings.exaCategory = value;
					await this.plugin.saveSettings();
				}));

		// Content extraction settings
		containerEl.createEl('h5', {text: 'Content Extraction'});

		new Setting(containerEl)
			.setName('Get Full Text')
			.setDesc('Extract full text content from pages')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetText)
				.onChange(async (value) => {
					this.plugin.settings.exaGetText = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Get Highlights')
			.setDesc('Extract key highlights from content')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetHighlights)
				.onChange(async (value) => {
					this.plugin.settings.exaGetHighlights = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Get Summary')
			.setDesc('Generate AI summaries of content')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetSummary)
				.onChange(async (value) => {
					this.plugin.settings.exaGetSummary = value;
					await this.plugin.saveSettings();
				}));

		// Advanced filtering
		containerEl.createEl('h5', {text: 'Advanced Filtering'});

		new Setting(containerEl)
			.setName('Include Domains')
			.setDesc('Comma-separated list of domains to include (e.g., arxiv.org, github.com)')
			.addText(text => text
				.setPlaceholder('arxiv.org, github.com')
				.setValue(this.plugin.settings.exaIncludeDomains.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaIncludeDomains = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Exclude Domains')
			.setDesc('Comma-separated list of domains to exclude')
			.addText(text => text
				.setPlaceholder('reddit.com, quora.com')
				.setValue(this.plugin.settings.exaExcludeDomains.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaExcludeDomains = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Start Date Filter')
			.setDesc('Only include content published after this date (YYYY-MM-DD)')
			.addText(text => text
				.setPlaceholder('2024-01-01')
				.setValue(this.plugin.settings.exaStartDate)
				.onChange(async (value) => {
					this.plugin.settings.exaStartDate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('End Date Filter')
			.setDesc('Only include content published before this date (YYYY-MM-DD)')
			.addText(text => text
				.setPlaceholder('2024-12-31')
				.setValue(this.plugin.settings.exaEndDate)
				.onChange(async (value) => {
					this.plugin.settings.exaEndDate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Include Text')
			.setDesc('Comma-separated strings that must be present in results (max 5 words each)')
			.addText(text => text
				.setPlaceholder('machine learning, artificial intelligence')
				.setValue(this.plugin.settings.exaIncludeText.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaIncludeText = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Exclude Text')
			.setDesc('Comma-separated strings that must NOT be present in results (max 5 words each)')
			.addText(text => text
				.setPlaceholder('course, tutorial')
				.setValue(this.plugin.settings.exaExcludeText.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaExcludeText = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));
	}

	addCustomPromptSettings(containerEl: HTMLElement) {
		containerEl.createEl('h3', {text: 'Custom Research Mode Prompts'});
		containerEl.createEl('p', {
			text: 'Use {query} placeholder in your prompts. It will be replaced with the actual search query.',
			cls: 'setting-item-description'
		});

		new Setting(containerEl)
			.setName('Quick Mode Prompt')
			.setDesc('Custom prompt for quick research mode')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for quick mode...')
				.setValue(this.plugin.settings.quickPrompt)
				.onChange(async (value) => {
					this.plugin.settings.quickPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Comprehensive Mode Prompt')
			.setDesc('Custom prompt for comprehensive research mode')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for comprehensive mode...')
				.setValue(this.plugin.settings.comprehensivePrompt)
				.onChange(async (value) => {
					this.plugin.settings.comprehensivePrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Deep Research Mode Prompt')
			.setDesc('Custom prompt for deep research mode')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for deep research mode...')
				.setValue(this.plugin.settings.deepPrompt)
				.onChange(async (value) => {
					this.plugin.settings.deepPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Reasoning Mode Prompt')
			.setDesc('Custom prompt for reasoning mode')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for reasoning mode...')
				.setValue(this.plugin.settings.reasoningPrompt)
				.onChange(async (value) => {
					this.plugin.settings.reasoningPrompt = value;
					await this.plugin.saveSettings();
				}));
	}
}

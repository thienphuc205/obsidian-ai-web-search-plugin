import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, Modal } from 'obsidian';

interface GeminiPluginSettings {
	geminiApiKey: string;
	maxResults: number;
	includeImages: boolean;
	defaultModel: string;
}

const DEFAULT_SETTINGS: GeminiPluginSettings = {
	geminiApiKey: '',
	maxResults: 5,
	includeImages: false,
	defaultModel: 'gemini-2.5-flash'
}

interface GeminiResponse {
	candidates: Array<{
		content: {
			parts: Array<{
				text: string;
			}>;
		};
		groundingMetadata?: {
			webSearchQueries?: string[];
			searchEntryPoint?: {
				renderedContent: string;
			};
			groundingChunks: Array<{
				web?: {
					uri: string;
					title: string;
				};
			}>;
			groundingSupports?: Array<{
				segment: {
					startIndex: number;
					endIndex: number;
					text: string;
				};
				groundingChunkIndices: number[];
			}>;
		};
	}>;
}

export default class GeminiWebSearchPlugin extends Plugin {
	settings: GeminiPluginSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon for quick access
		const ribbonIconEl = this.addRibbonIcon('search', 'Gemini Web Search', (evt: MouseEvent) => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				const editor = activeView.editor;
				const selection = editor.getSelection();
				if (selection) {
					this.performGeminiSearch(selection, editor);
				} else {
					new Notice('Please select some text to search with Gemini.');
				}
			}
		});
		ribbonIconEl.addClass('gemini-search-ribbon-class');

		// Add command for web search with selection
		this.addCommand({
			id: 'gemini-web-search-selection',
			name: 'Gemini: Search web with selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					this.performGeminiSearch(selection, editor);
				} else {
					new Notice('Please select some text to search with Gemini.');
				}
			}
		});

		// Add command for custom web search
		this.addCommand({
			id: 'gemini-web-search-prompt',
			name: 'Gemini: Search web with custom prompt',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.promptForCustomSearch(editor);
			}
		});

		// Add command for summarize selection
		this.addCommand({
			id: 'gemini-summarize-selection',
			name: 'Gemini: Summarize selection',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection) {
					this.summarizeText(selection, editor);
				} else {
					new Notice('Please select some text to summarize with Gemini.');
				}
			}
		});

		// Add settings tab
		this.addSettingTab(new GeminiSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup any resources if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async promptForCustomSearch(editor: Editor) {
		const query = await this.getCustomQuery();
		if (query) {
			this.performGeminiSearch(query, editor);
		}
	}

	async getCustomQuery(): Promise<string | null> {
		return new Promise((resolve) => {
			const modal = new CustomSearchModal(this.app, (query: string) => {
				resolve(query);
			});
			modal.open();
		});
	}

	async performGeminiSearch(query: string, editor: Editor) {
		if (!this.settings.geminiApiKey) {
			new Notice('Gemini API key is not set. Please configure it in the plugin settings.');
			return;
		}

		const initialCursor = editor.getCursor();
		const placeholderText = `\n\n> [!info] 🤖 Gemini is searching...\n> Query: "${query}"\n> Status: Searching the web and analyzing results...\n\n`;
		
		// Insert placeholder immediately
		editor.replaceRange(placeholderText, initialCursor);

		const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.defaultModel}:generateContent?key=${this.settings.geminiApiKey}`;

		const requestBody = {
			"contents": [{
				"parts": [{
					"text": `Please provide a comprehensive analysis and summary about: "${query}". 

Instructions:
1. Search for the most current and relevant information
2. Provide key insights and important details
3. Structure your response clearly with main points
4. Include relevant context and background information
5. If there are different perspectives or debates, mention them

Please ensure your response is well-structured, informative, and based on reliable sources.`
				}]
			}],
			"tools": [{
				"googleSearch": {}
			}],
			"generationConfig": {
				"temperature": 0.7,
				"topK": 40,
				"topP": 0.95,
				"maxOutputTokens": 2048
			}
		};

		try {
			new Notice(`🔍 Searching for: "${query}"`);
			
			const response = await requestUrl({
				url: apiUrl,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const responseData: GeminiResponse = response.json;
			
			if (!responseData.candidates || responseData.candidates.length === 0) {
				throw new Error('No response from Gemini API');
			}

			const candidate = responseData.candidates[0];
			let generatedText = candidate.content.parts[0].text;
			let sourcesText = '';
			let searchQueriesText = '';

			// Process grounding metadata for sources and inline citations
			if (candidate.groundingMetadata) {
				const metadata = candidate.groundingMetadata;
				
				// Add search queries used
				if (metadata.webSearchQueries && metadata.webSearchQueries.length > 0) {
					searchQueriesText = `\n\n**🔍 Search Queries Used:**\n`;
					metadata.webSearchQueries.forEach((query, index) => {
						searchQueriesText += `${index + 1}. "${query}"\n`;
					});
				}

				// Process inline citations
				if (metadata.groundingSupports && metadata.groundingChunks) {
					generatedText = this.addInlineCitations(generatedText, metadata.groundingSupports, metadata.groundingChunks);
				}

				// Add sources section
				if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
					sourcesText = "\n\n---\n\n## 📚 Sources\n\n";
					const sources = new Set<string>();

					metadata.groundingChunks.forEach((chunk, index) => {
						if (chunk.web && chunk.web.uri) {
							const title = chunk.web.title || chunk.web.uri;
							sources.add(`${index + 1}. [${title}](${chunk.web.uri})`);
						}
					});

					if (sources.size > 0) {
						sourcesText += Array.from(sources).join('\n');
					} else {
						sourcesText = '\n\n---\n\n*No specific sources were cited for this response.*\n';
					}
				}

				// Add search entry point widget note if available
				if (metadata.searchEntryPoint) {
					sourcesText += '\n\n> [!info] Search Entry Point\n> Google Search suggestions widget is available in the original API response.\n';
				}
			} else {
				// No grounding metadata - model answered from its own knowledge
				sourcesText = '\n\n---\n\n*Response generated from model\'s training data without web search.*\n';
			}

			// Format the final output
			const timestamp = new Date().toLocaleString();
			const finalOutput = `## 🤖 Gemini Web Search Results\n\n**Query:** ${query}  \n**Generated:** ${timestamp}\n\n---\n\n${generatedText}${searchQueriesText}${sourcesText}\n\n---\n\n*Generated by Gemini Web Search Plugin*\n\n`;

			// Replace placeholder with results
			const docContent = editor.getValue();
			const newContent = docContent.replace(placeholderText.trim(), finalOutput.trim());
			editor.setValue(newContent);

			new Notice('✅ Gemini search completed successfully!');

		} catch (error) {
			console.error('Gemini API request failed:', error);
			
			let errorMessage = 'Unknown error occurred';
			if (error.status) {
				switch (error.status) {
					case 401:
						errorMessage = 'Authentication failed. Please check your API key in settings.';
						break;
					case 403:
						errorMessage = 'Access forbidden. Your API key may not have permission for this operation.';
						break;
					case 429:
						errorMessage = 'API rate limit exceeded. Please try again later.';
						break;
					case 500:
						errorMessage = 'Gemini API server error. Please try again later.';
						break;
					default:
						errorMessage = `API returned status ${error.status}. Check console for details.`;
				}
			} else if (error.message && error.message.includes('Failed to fetch')) {
				errorMessage = 'Network error. Please check your internet connection.';
			}

			// Replace placeholder with error message
			const docContent = editor.getValue();
			const errorOutput = `> [!error] ❌ Gemini Search Failed\n> **Error:** ${errorMessage}\n> **Query:** "${query}"\n> **Time:** ${new Date().toLocaleString()}\n`;
			const newContent = docContent.replace(placeholderText.trim(), errorOutput.trim());
			editor.setValue(newContent);

			new Notice(`❌ Gemini search failed: ${errorMessage}`, 8000);
		}
	}

	addInlineCitations(text: string, groundingSupports: any[], groundingChunks: any[]): string {
		// Sort supports by end_index in descending order to avoid shifting issues when inserting
		const sortedSupports = groundingSupports.sort((a, b) => b.segment.endIndex - a.segment.endIndex);

		let modifiedText = text;
		
		for (const support of sortedSupports) {
			const endIndex = support.segment.endIndex;
			if (support.groundingChunkIndices && support.groundingChunkIndices.length > 0) {
				// Create citation string like [1,2,3]
				const citationNumbers = support.groundingChunkIndices
					.filter((i: number) => i < groundingChunks.length)
					.map((i: number) => `${i + 1}`)
					.join(',');
				
				if (citationNumbers) {
					const citationString = `[${citationNumbers}]`;
					modifiedText = modifiedText.substring(0, endIndex) + citationString + modifiedText.substring(endIndex);
				}
			}
		}

		return modifiedText;
	}

	async summarizeText(text: string, editor: Editor) {
		if (!this.settings.geminiApiKey) {
			new Notice('Gemini API key is not set. Please configure it in the plugin settings.');
			return;
		}

		const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.defaultModel}:generateContent?key=${this.settings.geminiApiKey}`;

		const requestBody = {
			"contents": [{
				"parts": [{
					"text": `Please provide a concise summary of the following text. Focus on the key points, main ideas, and important details:\n\n${text}`
				}]
			}],
			"generationConfig": {
				"temperature": 0.3,
				"topK": 20,
				"topP": 0.8,
				"maxOutputTokens": 1024
			}
		};

		try {
			new Notice('🤖 Summarizing with Gemini...');

			const response = await requestUrl({
				url: apiUrl,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const responseData: GeminiResponse = response.json;
			const summary = responseData.candidates[0].content.parts[0].text;
			
			const timestamp = new Date().toLocaleString();
			const formattedSummary = `\n\n---\n\n## 📝 Summary (Generated by Gemini)\n\n${summary}\n\n*Generated: ${timestamp}*\n\n---\n\n`;
			
			const cursor = editor.getCursor();
			editor.replaceRange(formattedSummary, cursor);
			
			new Notice('✅ Summary generated successfully!');

		} catch (error) {
			console.error('Gemini summarization failed:', error);
			new Notice('❌ Failed to generate summary. Check console for details.');
		}
	}
}

class CustomSearchModal extends Modal {
	query: string = '';
	onSubmit: (query: string) => void;

	constructor(app: App, onSubmit: (query: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Gemini Web Search' });

		const inputEl = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Enter your search query...'
		});
		inputEl.style.width = '100%';
		inputEl.style.padding = '8px';
		inputEl.style.marginBottom = '16px';
		inputEl.style.fontSize = '16px';

		inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				this.query = inputEl.value;
				this.close();
				this.onSubmit(this.query);
			}
		});

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.textAlign = 'right';

		const searchButton = buttonContainer.createEl('button', { text: 'Search' });
		searchButton.style.marginRight = '8px';
		searchButton.addEventListener('click', () => {
			this.query = inputEl.value;
			this.close();
			this.onSubmit(this.query);
		});

		const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		inputEl.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class GeminiSettingTab extends PluginSettingTab {
	plugin: GeminiWebSearchPlugin;

	constructor(app: App, plugin: GeminiWebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Gemini Web Search Settings' });

		containerEl.createEl('p', { 
			text: 'Configure your Google Gemini API integration for web search capabilities.' 
		});

		// API Key Setting
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Enter your Google Gemini API key. Get one from Google AI Studio (ai.google.dev).')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Model Selection
		new Setting(containerEl)
			.setName('Default Model')
			.setDesc('Choose the Gemini model to use for searches.')
			.addDropdown(dropdown => dropdown
				.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro - Most powerful reasoning')
				.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash - Latest multimodal model')
				.addOption('gemini-2.0-flash', 'Gemini 2.0 Flash - Fast and efficient')
				.addOption('gemini-1.5-pro', 'Gemini 1.5 Pro - Complex reasoning')
				.addOption('gemini-1.5-flash', 'Gemini 1.5 Flash - Balanced performance')
				.setValue(this.plugin.settings.defaultModel)
				.onChange(async (value) => {
					this.plugin.settings.defaultModel = value;
					await this.plugin.saveSettings();
				}));

		// Max Results Setting
		new Setting(containerEl)
			.setName('Maximum Results')
			.setDesc('Maximum number of search results to consider (1-10).')
			.addSlider(slider => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxResults)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxResults = value;
					await this.plugin.saveSettings();
				}));

		// Instructions
		containerEl.createEl('h3', { text: 'How to use:' });
		const instructions = containerEl.createEl('div');
		instructions.innerHTML = `
			<ul>
				<li><strong>Web Search:</strong> Select text and use "Gemini: Search web with selection" command</li>
				<li><strong>Custom Search:</strong> Use "Gemini: Search web with custom prompt" to enter a query</li>
				<li><strong>Summarize:</strong> Select text and use "Gemini: Summarize selection" command</li>
				<li><strong>Ribbon Icon:</strong> Click the search icon in the left ribbon for quick access</li>
			</ul>
		`;

		// API Information
		containerEl.createEl('h3', { text: 'Getting Your API Key:' });
		const apiInfo = containerEl.createEl('div');
		apiInfo.innerHTML = `
			<ol>
				<li>Visit <a href="https://ai.google.dev" target="_blank">Google AI Studio</a></li>
				<li>Sign in with your Google account</li>
				<li>Click "Get API key" and create a new key</li>
				<li>Copy the key and paste it above</li>
			</ol>
			<p><em>Note: The API has generous free limits, but check Google's pricing for heavy usage.</em></p>
		`;
	}
}

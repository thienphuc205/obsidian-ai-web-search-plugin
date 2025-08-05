import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf } from 'obsidian';

// Enhanced settings with multiple providers and research-mode-specific parameters
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
	
	// Chat saving settings
	chatFolderName: string;
	chatNoteTemplate: 'timestamp-query' | 'query-timestamp' | 'query-only' | 'counter';
	chatSaveEnabled: boolean;
	
	// Research-mode-specific Gemini parameters
	quick: {
		geminiTemperature: number;
		geminiTopP: number;
		geminiTopK: number;
		geminiMaxTokens: number;
	};
	comprehensive: {
		geminiTemperature: number;
		geminiTopP: number;
		geminiTopK: number;
		geminiMaxTokens: number;
	};
	deep: {
		geminiTemperature: number;
		geminiTopP: number;
		geminiTopK: number;
		geminiMaxTokens: number;
	};
	reasoning: {
		geminiTemperature: number;
		geminiTopP: number;
		geminiTopK: number;
		geminiMaxTokens: number;
	};
	
	// Research-mode-specific Perplexity parameters (complete set from API docs)
	quickPerplexity: {
		temperature: number;
		max_tokens: number;
		top_p: number;
		top_k: number;
		frequency_penalty: number;
		presence_penalty: number;
		search_domain_filter: string[];
		search_recency_filter: 'month' | 'week' | 'day' | 'hour';
		return_related_questions: boolean;
		return_citations: boolean;
		return_images: boolean;
		search_context_size: number;
	};
	comprehensivePerplexity: {
		temperature: number;
		max_tokens: number;
		top_p: number;
		top_k: number;
		frequency_penalty: number;
		presence_penalty: number;
		search_domain_filter: string[];
		search_recency_filter: 'month' | 'week' | 'day' | 'hour';
		return_related_questions: boolean;
		return_citations: boolean;
		return_images: boolean;
		search_context_size: number;
	};
	deepPerplexity: {
		temperature: number;
		max_tokens: number;
		top_p: number;
		top_k: number;
		frequency_penalty: number;
		presence_penalty: number;
		search_domain_filter: string[];
		search_recency_filter: 'month' | 'week' | 'day' | 'hour';
		return_related_questions: boolean;
		return_citations: boolean;
		return_images: boolean;
		search_context_size: number;
	};
	reasoningPerplexity: {
		temperature: number;
		max_tokens: number;
		top_p: number;
		top_k: number;
		frequency_penalty: number;
		presence_penalty: number;
		search_domain_filter: string[];
		search_recency_filter: 'month' | 'week' | 'day' | 'hour';
		return_related_questions: boolean;
		return_citations: boolean;
		return_images: boolean;
		search_context_size: number;
	};
	
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
	
	// Chat saving settings
	chatFolderName: 'AI Web Search Chats',
	chatNoteTemplate: 'timestamp-query',
	chatSaveEnabled: true,
	
	// Research-mode-specific Gemini parameters
	quick: {
		geminiTemperature: 0.5,
		geminiTopP: 0.7,
		geminiTopK: 20,
		geminiMaxTokens: 1000
	},
	comprehensive: {
		geminiTemperature: 0.7,
		geminiTopP: 0.8,
		geminiTopK: 40,
		geminiMaxTokens: 2000
	},
	deep: {
		geminiTemperature: 0.8,
		geminiTopP: 0.9,
		geminiTopK: 60,
		geminiMaxTokens: 4000
	},
	reasoning: {
		geminiTemperature: 0.3,
		geminiTopP: 0.6,
		geminiTopK: 20,
		geminiMaxTokens: 3000
	},
	
	// Research-mode-specific Perplexity parameters (optimized for each mode)
	quickPerplexity: {
		temperature: 0.4,
		max_tokens: 800,
		top_p: 0.7,
		top_k: 20,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
		search_domain_filter: [],
		search_recency_filter: 'day',
		return_related_questions: false,
		return_citations: true,
		return_images: false,
		search_context_size: 3
	},
	comprehensivePerplexity: {
		temperature: 0.6,
		max_tokens: 2000,
		top_p: 0.8,
		top_k: 40,
		frequency_penalty: 0.1,
		presence_penalty: 0.1,
		search_domain_filter: [],
		search_recency_filter: 'week',
		return_related_questions: true,
		return_citations: true,
		return_images: true,
		search_context_size: 8
	},
	deepPerplexity: {
		temperature: 0.7,
		max_tokens: 4000,
		top_p: 0.9,
		top_k: 60,
		frequency_penalty: 0.2,
		presence_penalty: 0.2,
		search_domain_filter: [],
		search_recency_filter: 'month',
		return_related_questions: true,
		return_citations: true,
		return_images: true,
		search_context_size: 12
	},
	reasoningPerplexity: {
		temperature: 0.2,
		max_tokens: 3000,
		top_p: 0.6,
		top_k: 20,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
		search_domain_filter: [],
		search_recency_filter: 'month',
		return_related_questions: false,
		return_citations: true,
		return_images: false,
		search_context_size: 10
	},
	
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
	
	// Custom prompts with professional frameworks
	enableCustomPrompts: false,
	quickPrompt: `### Task: Provide Quick and Accurate Response

You are a domain expert with extensive knowledge. Please answer the following question concisely and accurately:

**Question:** "{query}"

**Output Requirements:**
- Provide direct and concise answers (2-3 sentences maximum)
- Focus on the 2-3 most important points
- Use clear, easy-to-understand language
- If uncertain, state "Need more information to provide accurate answer"

**Format:** Direct answer without lengthy explanations.`,

	comprehensivePrompt: `### Framework: Comprehensive Analysis Using CRISPE

**Clarity:** You are a professional researcher with years of experience in the field.

**Relevance:** Conduct comprehensive analysis of the topic: "{query}"

**Iteration:** Structure your response in logical steps:

1. **Overview** (2-3 sentences introducing the topic)
2. **Key Aspects** (at least 3-4 important dimensions)
3. **Context and Applications** (why this matters)
4. **Concrete Examples** (1-2 illustrative cases)
5. **Conclusions and Future Directions**

**Specificity:** 
- Length: 400-600 words
- Language: Professional but accessible
- Citations: Mention sources when specific information is available

**Parameters:**
- Use bullet points and headings to organize information
- Avoid excessive technical jargon unless necessary
- Balance depth with accessibility

**Examples:** Include real-world examples to illustrate abstract concepts.`,

	deepPrompt: `### Framework: Deep Research Using TRACE

**Task:** Conduct in-depth research on: "{query}"

**Request (Specific Requirements):**
- Multi-dimensional analysis from at least 4-5 different perspectives
- Evaluate opposing viewpoints (if applicable)
- Connect to related fields and disciplines
- Length: 800-1200 words

**Action (Implementation Steps):**
1. **Foundation Analysis** - History, origins, definitions
2. **Current Landscape** - Present state, trends, developments
3. **Multiple Perspectives** - Views from different fields/schools of thought
4. **Deep Analysis** - Causes, effects, interconnections
5. **Future Implications** - Projected impacts, practical applications
6. **Critical Assessment** - Strengths, limitations, controversies

**Context:**
- You are a leading expert in this field
- Audience: Readers with good foundational knowledge
- Goal: Provide the most comprehensive and insightful perspective

**Example (Format Template):**
## I. Foundation Analysis
[Detailed content...]

## II. Professional Multi-Perspective View
### A. [Field 1] Perspective
### B. [Field 2] Perspective
[...]

## III. Conclusions and Implications
[Synthesis, projections...]

**Quality Note:** Only present information you have high confidence in. If lacking data in any section, acknowledge this and suggest directions for further research.`,

	reasoningPrompt: `### Framework: Advanced Logical Reasoning

**Meta-instruction:** You are a critical thinking expert with exceptional logical analysis capabilities.

**Analysis Task:** "{query}"

**Reasoning Process (Chain-of-Thought):**

### Step 1: Problem Decomposition
- Identify core components of the issue
- Categorize information: Facts | Assumptions | Unclear factors

### Step 2: Multi-Dimensional Analysis  
**A. Logical Analysis:**
- What premises are being assumed?
- What are the potential cause-effect relationships?

**B. Contextual Analysis:**
- What environmental/situational factors have influence?
- What are the constraints and boundary conditions?

**C. Perspective Analysis:**
- What are the viewpoints from different stakeholders?
- What potential biases exist in how the problem is framed?

### Step 3: Evidence Evaluation
- Categorize: Strong evidence | Weak evidence | Missing evidence
- Cross-validation: Are sources consistent?
- Reliability check: How reliable is each argument?

### Step 4: Synthetic Reasoning
**Primary Inference:**
[Present main logic chain with intermediate steps]

**Alternative Hypotheses:**
[Present and evaluate at least 2 alternative interpretations]

**Confidence Level of Conclusions:**
[Assess certainty level with reasoning]

### Step 5: Structured Conclusion
- **Main Conclusion:** [1-2 sentence summary]
- **Confidence Level:** [High/Medium/Low + rationale]  
- **Conditions:** [Under what circumstances is this conclusion valid]
- **Limitations:** [What hasn't been fully considered]
- **Future Research Directions:** [Open questions for the future]

**Final Check:** Question your own logic - are there any gaps or weaknesses?`
}

// Chat View constants
export const CHAT_VIEW_TYPE = "gemini-chat-view";

// Chat View Class
export class GeminiChatView extends ItemView {
	private chatContainer!: HTMLElement;
	private inputContainer!: HTMLElement;
	private messageContainer!: HTMLElement;
	private plugin: GeminiWebSearchPlugin;
	
	// YouTube video context tracking
	private currentVideoContext: {
		url: string;
		videoId: string;
		title?: string;
		analyzed: boolean;
	} | null = null;
	
	// Video context UI references
	private videoContextContainer!: HTMLElement;
	private videoContextTitle!: HTMLElement;
	
	public currentResearchMode!: {
		id: string;
		label: string;
		description: string;
		model: string;
		perplexityModel: string;
		exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast';
		exaCategory: string;
		providerLock?: string;
		requiresUrl?: boolean;
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
		
		// Title and New Chat button container
		const titleContainer = header.createEl('div', { cls: 'title-container' });
		titleContainer.createEl('h3', { text: 'AI Web Search Chat' });
		
		// New Chat button
		const newChatButton = titleContainer.createEl('button', { 
			cls: 'new-chat-button',
			title: 'Start a new conversation (Ctrl/Cmd + N)',
			attr: {
				'aria-label': 'Start new chat conversation',
				'role': 'button'
			}
		});
		newChatButton.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				<line x1="12" y1="8" x2="12" y2="16"></line>
				<line x1="8" y1="12" x2="16" y2="12"></line>
			</svg>
			<span>New Chat</span>
		`;
		
		newChatButton.addEventListener('click', () => {
			this.clearChat();
		});
		
		// Add keyboard shortcut for new chat (Ctrl/Cmd + N when view is focused)
		this.containerEl.addEventListener('keydown', (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey && !e.altKey) {
				e.preventDefault();
				this.clearChat();
			}
		});
		
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

		// Gemini model selector (initially hidden)
		const modelContainer = providerContainer.createEl('span', { cls: 'model-container' });
		modelContainer.createEl('span', { 
			text: 'Model: ',
			cls: 'model-label'
		});

		const modelDropdown = modelContainer.createEl('select', { 
			cls: 'model-dropdown'
		});
		
		// Add Gemini model options
		modelDropdown.createEl('option', { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro' });
		modelDropdown.createEl('option', { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash' });
		modelDropdown.createEl('option', { value: 'gemini-2.5-flash-lite', text: 'Gemini 2.5 Flash Lite' });
		
		// Set default value
		modelDropdown.value = this.plugin.settings.geminiModel;

		// Handle model change
		modelDropdown.addEventListener('change', async (e) => {
			const newModel = (e.target as HTMLSelectElement).value;
			this.plugin.settings.geminiModel = newModel;
			await this.plugin.saveSettings();
		});

		// Function to update model container visibility
		const updateModelVisibility = () => {
			const isYouTubeMode = this.currentResearchMode?.id === 'youtube';
			const isGeminiProvider = this.plugin.settings.provider === 'gemini';
			modelContainer.style.display = (isYouTubeMode || isGeminiProvider) ? 'inline' : 'none';
		};

		// Initial visibility
		updateModelVisibility();

		// Handle provider change
		providerDropdown.addEventListener('change', async (e) => {
			const newProvider = (e.target as HTMLSelectElement).value as 'gemini' | 'perplexity' | 'tavily' | 'exa';
			
			// Check if YouTube mode is active and trying to switch from Gemini
			if (this.currentResearchMode?.id === 'youtube' && newProvider !== 'gemini') {
				new Notice('🎬 YouTube mode requires Gemini provider. Please switch to a different research mode first.');
				providerDropdown.value = 'gemini'; // Reset to Gemini
				return;
			}
			
			this.plugin.settings.provider = newProvider;
			await this.plugin.saveSettings();
			updateModelVisibility();
			
			// Check if API key is configured
			const hasApiKey = this.checkApiKey(newProvider);
			if (hasApiKey) {
				this.addMessage('system', `Switched to ${newProvider}. Ready for your questions!`);
			} else {
				this.addMessage('system', `⚠️ Switched to ${newProvider}, but API key not configured. Please add your API key in plugin settings.`);
			}
		});

		// YouTube Video Context Indicator (initially hidden)
		const videoContextContainer = header.createEl('div', { 
			cls: 'video-context-container'
		});
		videoContextContainer.style.display = 'none';
		
		const videoContextHeader = videoContextContainer.createEl('div', { cls: 'video-context-header' });
		videoContextHeader.createEl('span', { 
			text: '🎬 Video Context: ',
			cls: 'video-context-label'
		});
		
		const videoContextTitle = videoContextHeader.createEl('span', { 
			cls: 'video-context-title',
			text: 'No video loaded'
		});
		
		const clearVideoButton = videoContextHeader.createEl('button', {
			cls: 'clear-video-button',
			text: '❌',
			attr: { title: 'Clear video context' }
		});
		
		clearVideoButton.addEventListener('click', () => {
			this.clearVideoContext();
		});

		// Store reference for easy access
		this.videoContextContainer = videoContextContainer;
		this.videoContextTitle = videoContextTitle;

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

	setResearchMode(mode: {id: string, label: string, description: string, model: string, perplexityModel: string, exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast', exaCategory: string, providerLock?: string, requiresUrl?: boolean}) {
		this.currentResearchMode = mode;
		
		// Handle YouTube mode special requirements
		if (mode.id === 'youtube') {
			// Force switch to Gemini provider if not already
			if (this.plugin.settings.provider !== 'gemini') {
				this.plugin.settings.provider = 'gemini';
				this.plugin.saveSettings();
				
				// Update provider dropdown UI
				const providerDropdown = this.containerEl.querySelector('.provider-dropdown') as HTMLSelectElement;
				if (providerDropdown) {
					providerDropdown.value = 'gemini';
				}
				
				new Notice('🎬 Switched to Gemini provider for YouTube video analysis');
			}
			
			// Set model to gemini-2.5-pro (best for video analysis)
			this.plugin.settings.geminiModel = 'gemini-2.5-pro';
			this.plugin.saveSettings();
			
			// Update model dropdown UI
			const modelDropdown = this.containerEl.querySelector('.model-dropdown') as HTMLSelectElement;
			if (modelDropdown) {
				modelDropdown.value = 'gemini-2.5-pro';
			}
		}
		
		// Update button states for bottom buttons
		const buttons = this.containerEl.querySelectorAll('.research-mode-btn-small');
		buttons.forEach(btn => {
			btn.removeClass('active');
			if (btn.getAttribute('data-mode') === mode.id) {
				btn.addClass('active');
			}
		});
		
		// Update model container visibility
		const modelContainer = this.containerEl.querySelector('.model-container') as HTMLElement;
		if (modelContainer) {
			const isYouTubeMode = mode.id === 'youtube';
			const isGeminiProvider = this.plugin.settings.provider === 'gemini';
			modelContainer.style.display = (isYouTubeMode || isGeminiProvider) ? 'inline' : 'none';
		}
		
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

		const saveButton = buttonGroup.createEl('button', {
			cls: 'save-button', 
			text: 'Send & Save',
			attr: { title: 'Send query and save chat to folder' }
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
			},
			{
				id: 'youtube',
				label: '🎬 YouTube',
				description: 'Video analysis',
				model: 'gemini-2.5-pro',
				perplexityModel: 'sonar-pro', // Not used but required for interface
				exaSearchType: 'auto' as const,
				exaCategory: '',
				providerLock: 'gemini',
				requiresUrl: true
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
		saveButton.onclick = () => this.handleSend(textarea.value, false, true);
		
		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.handleSend(textarea.value, false);
			}
		});
	}

	async handleSend(message: string, insertToNote: boolean, saveToFolder: boolean = false) {
		if (!message.trim()) return;

		// YouTube mode Smart Context validation
		if (this.currentResearchMode?.id === 'youtube') {
			const isYouTubeUrl = this.isValidYouTubeUrl(message.trim());
			
			if (!this.currentVideoContext && !isYouTubeUrl) {
				// No video context and not a YouTube URL
				new Notice('🎬 YouTube Mode: Please paste a YouTube URL first to analyze a video\n\nSupported formats:\n• youtube.com/watch?v=VIDEO_ID\n• youtu.be/VIDEO_ID');
				return;
			}
			
			if (isYouTubeUrl) {
				// Store video context when URL is provided
				const videoId = this.extractYouTubeVideoId(message.trim());
				if (videoId) {
					this.setVideoContext(message.trim(), videoId, `Video Analysis`);
				}
			}
		}

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

			// Save to folder if requested
			if (saveToFolder && this.plugin.settings.chatSaveEnabled) {
				await this.saveToFolder();
			}

		} catch (error) {
			this.updateMessage(thinkingId, `Error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	async saveToFolder(): Promise<void> {
		try {
			const folderPath = this.plugin.settings.chatFolderName;
			const vault = this.app.vault;

			// Ensure folder exists
			const folder = vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await vault.createFolder(folderPath);
			}

			// Generate filename based on template
			const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
			const firstUserMessage = this.getFirstUserMessage() || 'chat';
			const query = firstUserMessage.slice(0, 50).replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
			
			let filename: string;
			switch (this.plugin.settings.chatNoteTemplate) {
				case 'timestamp-query':
					filename = `${timestamp}-${query}`;
					break;
				case 'query-timestamp':
					filename = `${query}-${timestamp}`;
					break;
				case 'query-only':
					filename = query;
					break;
				case 'counter':
					// For counter, we'll generate it based on existing files
					const existingFiles = vault.getMarkdownFiles().filter(f => 
						f.path.startsWith(folderPath) && f.basename.startsWith('chat-')
					);
					filename = `chat-${existingFiles.length + 1}`;
					break;
				default:
					filename = `${timestamp}-${query}`;
			}

			// Ensure unique filename
			let uniqueFilename = `${filename}.md`;
			let counter = 1;
			while (vault.getAbstractFileByPath(`${folderPath}/${uniqueFilename}`)) {
				uniqueFilename = `${filename}-${counter}.md`;
				counter++;
			}

			// Format chat content
			const chatContent = this.formatChatNote();
			
			// Create the note
			const filePath = `${folderPath}/${uniqueFilename}`;
			await vault.create(filePath, chatContent);

			// Show success message
			new Notice(`Chat saved to: ${filePath}`);

		} catch (error) {
			new Notice(`Failed to save chat: ${error instanceof Error ? error.message : String(error)}`);
			console.error('Save to folder error:', error);
		}
	}

	// YouTube URL validation helper
	isValidYouTubeUrl(url: string): boolean {
		const youtubeRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
		return youtubeRegex.test(url.trim());
	}

	extractYouTubeVideoId(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return match ? match[1] : null;
	}

	formatChatNote(): string {
		const timestamp = new Date().toLocaleString();
		const provider = this.plugin.settings.provider;
		const researchMode = this.currentResearchMode;
		
		let content = `# AI Web Search Chat\n\n`;
		content += `**Date:** ${timestamp}\n`;
		content += `**Provider:** ${provider}\n`;
		content += `**Research Mode:** ${researchMode}\n\n`;
		content += `---\n\n`;

		// Extract messages from DOM
		const messageElements = this.messageContainer.querySelectorAll('.message');
		messageElements.forEach((messageEl) => {
			const roleEl = messageEl.querySelector('.message-role');
			const contentEl = messageEl.querySelector('.message-content');
			
			if (roleEl && contentEl) {
				const role = roleEl.textContent?.trim();
				const messageContent = contentEl.textContent?.trim() || '';
				
				if (role === 'You') {
					content += `## 🙋 You\n\n${messageContent}\n\n`;
				} else if (role === 'AI Assistant' && !messageContent.includes('Searching the web...')) {
					content += `## 🤖 AI Assistant\n\n${messageContent}\n\n`;
				}
			}
		});

		content += `\n---\n*Generated by AI Web Search Plugin*`;
		return content;
	}

	getFirstUserMessage(): string {
		const userMessages = this.messageContainer.querySelectorAll('.message.user .message-content');
		if (userMessages.length > 0) {
			return userMessages[0].textContent?.trim() || '';
		}
		return '';
	}

	// YouTube video context management
	clearVideoContext(): void {
		this.currentVideoContext = null;
		this.updateVideoContextUI();
	}

	setVideoContext(url: string, videoId: string, title?: string): void {
		this.currentVideoContext = {
			url,
			videoId,
			title,
			analyzed: true
		};
		this.updateVideoContextUI();
	}

	updateVideoContextUI(): void {
		if (!this.videoContextContainer || !this.videoContextTitle) return;

		if (this.currentVideoContext && this.currentResearchMode?.id === 'youtube') {
			this.videoContextContainer.style.display = 'block';
			this.videoContextTitle.textContent = this.currentVideoContext.title || 
				`Video ${this.currentVideoContext.videoId}`;
		} else {
			this.videoContextContainer.style.display = 'none';
		}
	}

	// Public method to get video context
	getVideoContext() {
		return this.currentVideoContext;
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

	// Method to clear chat and start fresh conversation
	clearChat() {
		// Check if there are messages to clear
		const hasMessages = this.messageContainer && this.messageContainer.children.length > 1; // More than welcome message
		
		if (hasMessages) {
			// Show confirmation dialog for user safety
			const confirmed = confirm('Are you sure you want to start a new chat? This will clear the current conversation.');
			if (!confirmed) {
				return;
			}
		}
		
		if (this.messageContainer) {
			// Add fade out animation
			this.messageContainer.addClass('clearing');
			
			setTimeout(() => {
				this.messageContainer.empty();
				this.messageContainer.removeClass('clearing');
				
				// Reset to default research mode
				this.currentResearchMode = {
					id: 'comprehensive',
					label: '🔍 Comprehensive',
					description: 'Balanced research with detailed analysis',
					model: 'gemini-2.5-flash',
					perplexityModel: 'sonar-pro',
					exaSearchType: 'auto',
					exaCategory: ''
				};
				
				// Update button states for research mode buttons
				const buttons = this.containerEl.querySelectorAll('.research-mode-btn-small');
				buttons.forEach(btn => {
					btn.removeClass('active');
					if (btn.getAttribute('data-mode') === 'comprehensive') {
						btn.addClass('active');
					}
				});
				
				// Add fresh welcome message with animation
				const hasApiKey = this.checkApiKey(this.plugin.settings.provider);
				const welcomeMessage = hasApiKey 
					? `🆕 New conversation started! Ask me anything and I'll search the web for you using ${this.plugin.settings.provider}.`
					: `⚠️ New conversation started! Please configure your ${this.plugin.settings.provider} API key in plugin settings before starting.`;
				
				this.addMessage('system', welcomeMessage);
				
				// Focus on input after clearing
				setTimeout(() => {
					const inputEl = this.containerEl.querySelector('.gemini-chat-input') as HTMLTextAreaElement;
					if (inputEl) {
						inputEl.focus();
						inputEl.placeholder = 'Ask anything to start your new conversation...';
						
						// Reset placeholder after a few seconds
						setTimeout(() => {
							inputEl.placeholder = 'Ask anything...';
						}, 3000);
					}
				}, 100);
				
			}, 200); // Short delay for animation
		} else {
			// If no message container, just focus input
			const inputEl = this.containerEl.querySelector('.gemini-chat-input') as HTMLTextAreaElement;
			if (inputEl) {
				inputEl.focus();
			}
		}
	}

	// Method to check if provider has API key configured
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
		// Handle bold, italic, code, and enhanced clickable links
		let html = text;
		
		// Bold **text**
		html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
		
		// Italic *text*
		html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
		
		// Inline code `text`
		html = html.replace(/`(.*?)`/g, '<code>$1</code>');
		
		// Enhanced Links [text](url) - make them actually clickable with external link styling
		html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="external-link">$1 🔗</a>');
		
		// Auto-detect bare URLs and make them clickable
		html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="external-link">$1 🔗</a>');
		
		// Handle citation links [1], [2], etc. - make them scroll to sources section
		html = html.replace(/\[(\d+)\]/g, '<a href="#citation-$1" class="citation-link" onclick="this.closest(\'.message-content\').querySelector(\'h4:contains(Sources), strong:contains(Sources)\')?.scrollIntoView({behavior: \'smooth\', block: \'center\'})">[$1]</a>');
		
		element.innerHTML = html;
		
		// Add click handlers for citation links to scroll to sources
		const citationLinks = element.querySelectorAll('.citation-link');
		citationLinks.forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				// Find the sources section and scroll to it
				const messageElement = element.closest('.message-content');
				if (messageElement) {
					const sourcesHeader = Array.from(messageElement.querySelectorAll('strong, h4'))
						.find(el => el.textContent?.includes('Sources')) as HTMLElement;
					if (sourcesHeader) {
						sourcesHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
						// Highlight the sources section briefly
						sourcesHeader.style.backgroundColor = 'var(--interactive-accent)';
						sourcesHeader.style.color = 'white';
						sourcesHeader.style.padding = '8px';
						sourcesHeader.style.borderRadius = '4px';
						sourcesHeader.style.transition = 'all 0.3s ease';
						
						setTimeout(() => {
							sourcesHeader.style.backgroundColor = '';
							sourcesHeader.style.color = '';
							sourcesHeader.style.padding = '';
						}, 2000);
					}
				}
			});
		});
	}

	async onClose() {
		// Clean up
	}
}

// Enhanced Main Plugin Class
export default class GeminiWebSearchPlugin extends Plugin {
	settings!: GeminiWebSearchSettings;

	async onload() {
		await this.loadSettings();

		// Inject enhanced CSS for settings
		this.injectEnhancedCSS();

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
			editorCallback: (editor: Editor, ctx) => {
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
			editorCallback: (editor: Editor, ctx) => {
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

		// Add command for new chat
		this.addCommand({
			id: 'gemini-new-chat',
			name: 'AI Web Search: Start New Chat',
			callback: () => {
				this.activateView().then(() => {
					// Get the chat view and clear it
					const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]?.view as GeminiChatView;
					if (chatView) {
						chatView.clearChat();
					}
				});
			}
		});

		// Add command to test Perplexity API
		this.addCommand({
			id: 'test-perplexity-api',
			name: 'AI Web Search: Test Perplexity API',
			callback: async () => {
				await this.testPerplexityAPI();
			}
		});

		this.addSettingTab(new GeminiSettingTab(this.app, this));
	}

	// Method to inject enhanced CSS
	injectEnhancedCSS() {
		const cssText = `
/* Enhanced Settings CSS for AI Web Search Plugin */
.gemini-settings-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
    line-height: 1.6;
}

.settings-title-section {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.settings-title-section h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 700;
}

.settings-subtitle {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
}

.setting-section {
    margin-bottom: 1.5rem;
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.setting-section-header {
    padding: 1rem 1.5rem;
    background: var(--background-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid transparent;
    display: flex;
    align-items: center;
}

.setting-section-header:hover {
    background: var(--background-modifier-hover);
}

.setting-section-header.expanded {
    border-bottom-color: var(--background-modifier-border);
}

.setting-section-toggle {
    margin-right: 0.75rem;
    font-weight: bold;
    transition: transform 0.2s ease;
    font-size: 1.2rem;
}

.setting-section-title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
}

.setting-section-description {
    margin: 0.5rem 0 0 2rem;
    opacity: 0.8;
    font-size: 0.9rem;
}

.setting-section-content {
    padding: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
}

.setting-section-content.expanded {
    padding: 1.5rem;
    max-height: 3000px;
}

.provider-info-card {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 1.5rem;
    margin-top: 1rem;
}

.provider-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.provider-info-header h4 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
}

.provider-description {
    margin: 0 0 1rem 0;
    font-style: italic;
    color: var(--text-muted);
}

.provider-features {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
}

.provider-features li {
    margin-bottom: 0.25rem;
}

.provider-specs {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.spec-item {
    background: var(--background-modifier-form-field);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-indicator.connected {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-indicator.disconnected {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.setting-help-text, .settings-help-text {
    background: var(--background-secondary);
    border-left: 4px solid var(--interactive-accent);
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0 6px 6px 0;
    font-size: 0.9rem;
    line-height: 1.5;
}

.setting-help-text ul, .settings-help-text ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
}

.setting-help-text li, .settings-help-text li {
    margin-bottom: 0.5rem;
}

.setting-help-text strong, .settings-help-text strong {
    color: var(--interactive-accent);
}

.provider-tabs {
    display: flex;
    background: var(--background-secondary);
    border-radius: 8px 8px 0 0;
    overflow: hidden;
}

.provider-tab {
    flex: 1;
    padding: 1rem;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
}

.provider-tab:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
}

.provider-tab.active {
    background: var(--interactive-accent);
    color: white;
}

.provider-tabs-content {
    border: 1px solid var(--background-modifier-border);
    border-top: none;
    border-radius: 0 0 8px 8px;
}

.provider-tab-content {
    display: none;
    padding: 1.5rem;
}

.provider-tab-content.active {
    display: block;
}

.presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.exa-presets {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid var(--background-modifier-border);
}
		`;

		// Inject CSS
		const style = document.createElement('style');
		style.textContent = cssText;
		document.head.appendChild(style);
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

		// Get research-mode-specific parameters
		let geminiParams = this.settings.comprehensive; // default
		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					geminiParams = this.settings.quick;
					break;
				case 'comprehensive':
					geminiParams = this.settings.comprehensive;
					break;
				case 'deep':
					geminiParams = this.settings.deep;
					break;
				case 'reasoning':
					geminiParams = this.settings.reasoning;
					break;
				case 'youtube':
					geminiParams = this.settings.comprehensive; // Use comprehensive params for YouTube
					break;
			}
		}

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
				case 'youtube':
					enhancedPrompt = `Analyze this YouTube video and provide a comprehensive summary and insights: ${query}`;
					break;
				default:
					enhancedPrompt = this.settings.comprehensivePrompt.replace('{query}', query);
			}
		} else if (researchMode) {
			// Use improved default prompts
			switch (researchMode.id) {
				case 'quick':
					enhancedPrompt = `### Task: Provide Quick and Accurate Response

You are a domain expert with extensive knowledge. Please answer the following question concisely and accurately:

**Question:** "${query}"

**Output Requirements:**
- Provide direct and concise answers (2-3 sentences maximum)
- Focus on the 2-3 most important points
- Use clear, easy-to-understand language
- If uncertain, state "Need more information to provide accurate answer"

**Format:** Direct answer without lengthy explanations.`;
					break;
				case 'comprehensive':
					enhancedPrompt = `### Framework: Comprehensive Analysis

**Task:** Comprehensive analysis of the topic: "${query}"

**Response Structure:**
1. **Overview** (2-3 introductory sentences)
2. **Key Aspects** (3-4 important dimensions)
3. **Context and Applications** (why this matters)
4. **Concrete Examples** (1-2 illustrative cases)
5. **Conclusions and Future Directions**

**Requirements:** 400-600 words, professional but accessible, cite sources when available.`;
					break;
				case 'deep':
					enhancedPrompt = `### Framework: Deep Research

**Task:** In-depth research on: "${query}"

**Analysis includes:**
1. **Foundation Analysis** - History, origins, definitions
2. **Current Landscape** - Present state, trends  
3. **Multiple Perspectives** - Views from different fields
4. **Deep Analysis** - Causes, effects, interconnections
5. **Future Implications** - Projected impacts, practical applications
6. **Critical Assessment** - Strengths, limitations, controversies

**Requirements:** 800-1200 words, comprehensive and insightful perspective, clear structure.`;
					break;
				case 'reasoning':
					enhancedPrompt = `### Framework: Logical Reasoning

**Analysis Task:** "${query}"

**Thinking Process:**
1. **Problem Decomposition** - Identify core components
2. **Multi-dimensional Analysis** - Logic, context, different perspectives
3. **Evidence Evaluation** - Categorize reliability levels
4. **Synthetic Reasoning** - Logic chain and alternative hypotheses
5. **Structured Conclusion** - Conclusion, confidence level, limitations

**Requirements:** Critical thinking, excellent logical analysis, self-check for logical gaps.`;
					break;
				case 'youtube':
					enhancedPrompt = `### Task: YouTube Video Analysis

**Video URL:** ${query}

**Analysis Framework:**
1. **Video Overview** - Title, creator, duration, upload date
2. **Content Summary** - Main topics and key points covered
3. **Detailed Analysis** - Important insights, data, arguments presented
4. **Context and Relevance** - Why this content matters, target audience
5. **Key Takeaways** - Most valuable information and actionable insights
6. **Critical Assessment** - Strengths, limitations, credibility

**Requirements:** 
- Comprehensive analysis of video content
- Focus on factual information and key insights
- Highlight important quotes or data points
- Assess credibility and educational value
- 600-800 words, well-structured and informative`;
					break;
				default:
					enhancedPrompt = `Please provide comprehensive analysis on: "${query}" with accurate information and reliable sources.`;
			}
		}

		const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent?key=${this.settings.geminiApiKey}`;

		let requestBody: any;

		// Handle YouTube video analysis
		if (researchMode?.id === 'youtube' && chatView?.getVideoContext()) {
			// Use video context for analysis
			const videoContext = chatView.getVideoContext();
			if (!videoContext) return "Error: No video context available";
			
			const videoUrl = videoContext.url;
			const isUrlQuery = chatView.isValidYouTubeUrl(query);
			
			// If user just pasted URL, use comprehensive analysis prompt
			// If user asked a question, combine it with video context
			const analysisPrompt = isUrlQuery ? enhancedPrompt : 
				`Based on the YouTube video at ${videoUrl}, please answer this question: "${query}"

**Context:** You are analyzing the video content to provide a specific answer.
**Requirements:** 
- Focus on answering the specific question asked
- Reference relevant parts of the video content
- Provide accurate and detailed information
- Include timestamps or specific examples when relevant`;

			requestBody = {
				contents: [{
					parts: [
						{ text: analysisPrompt },
						{ 
							fileData: {
								mimeType: "video/*",
								fileUri: videoUrl
							}
						}
					]
				}],
				generationConfig: {
					temperature: geminiParams.geminiTemperature,
					topP: geminiParams.geminiTopP,
					topK: geminiParams.geminiTopK,
					maxOutputTokens: geminiParams.geminiMaxTokens
				}
			};
		} else {
			// Regular web search mode
			requestBody = {
				contents: [{
					parts: [{ text: enhancedPrompt }]
				}],
				tools: [{
					google_search: {}
				}],
				generationConfig: {
					temperature: geminiParams.geminiTemperature,
					topP: geminiParams.geminiTopP,
					topK: geminiParams.geminiTopK,
					maxOutputTokens: geminiParams.geminiMaxTokens
				}
			};
		}

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

		// Use correct Perplexity model names (updated Feb 2025)
		let modelToUse: string;
		switch (researchMode?.id) {
			case 'quick':
				modelToUse = 'sonar';
				break;
			case 'comprehensive':
				modelToUse = 'sonar-pro';
				break;
			case 'deep':
				modelToUse = 'sonar-pro'; // Use pro for deep analysis
				break;
			case 'reasoning':
				modelToUse = 'sonar-reasoning-pro';
				break;
			default:
				modelToUse = 'sonar'; // Safe default
		}

		// Get research-mode-specific Perplexity parameters
		let perplexityParams = this.settings.comprehensivePerplexity; // default
		if (researchMode) {
			switch (researchMode.id) {
				case 'quick':
					perplexityParams = this.settings.quickPerplexity;
					break;
				case 'comprehensive':
					perplexityParams = this.settings.comprehensivePerplexity;
					break;
				case 'deep':
					perplexityParams = this.settings.deepPerplexity;
					break;
				case 'reasoning':
					perplexityParams = this.settings.reasoningPerplexity;
					break;
			}
		}

		// Build minimal request body with only valid Perplexity API parameters
		const requestBody: any = {
			model: modelToUse,
			messages: [{
				role: "user",
				content: query
			}],
			// Force return citations and related questions for enhanced responses
			return_citations: true,
			return_related_questions: true
		};

		// Add only supported parameters
		if (perplexityParams.max_tokens && perplexityParams.max_tokens !== 2000) {
			requestBody.max_tokens = perplexityParams.max_tokens;
		}
		
		if (perplexityParams.temperature !== undefined && perplexityParams.temperature !== 0.6) {
			requestBody.temperature = perplexityParams.temperature;
		}
		
		if (perplexityParams.top_p !== undefined && perplexityParams.top_p !== 0.9) {
			requestBody.top_p = perplexityParams.top_p;
		}

		// Add Perplexity-specific features if enabled
		if (perplexityParams.return_citations) {
			requestBody.return_citations = true;
		}
		
		if (perplexityParams.return_images) {
			requestBody.return_images = true;
		}
		
		if (perplexityParams.return_related_questions) {
			requestBody.return_related_questions = true;
		}

		// Add search filters if configured
		if (perplexityParams.search_domain_filter && perplexityParams.search_domain_filter.length > 0) {
			requestBody.search_domain_filter = perplexityParams.search_domain_filter;
		}
		
		if (perplexityParams.search_recency_filter && perplexityParams.search_recency_filter !== 'month') {
			requestBody.search_recency_filter = perplexityParams.search_recency_filter;
		}

		console.log('🔍 Perplexity API Request:', JSON.stringify(requestBody, null, 2));

		try {
			const response = await requestUrl({
				url: 'https://api.perplexity.ai/chat/completions',
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.settings.perplexityApiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const data = response.json;
			console.log('✅ Perplexity API Response:', data);
			console.log('📊 Response structure keys:', Object.keys(data));
			if (data.choices?.[0]) {
				console.log('🔍 Choice structure:', Object.keys(data.choices[0]));
				if (data.choices[0].message) {
					console.log('💬 Message structure:', Object.keys(data.choices[0].message));
				}
			}
			
			const message = data.choices?.[0]?.message?.content;
			
			if (!message) {
				throw new Error('No response content from Perplexity API');
			}

			// Process and enhance Perplexity response with sources and related questions
			const enhancedResponse = this.enhancePerplexityResponse(message, data);
			
			return enhancedResponse;
			
		} catch (error: any) {
			console.error('❌ Perplexity API Error:', error);
			console.error('Status:', error.status);
			console.error('Response:', error.text);
			
			// Provide detailed error messages
			if (error.status === 400) {
				throw new Error(`Perplexity API 400 Error: ${error.text || 'Invalid request format'}\nModel: ${modelToUse}\nCheck console for request details.`);
			} else if (error.status === 401) {
				throw new Error('Perplexity API key is invalid or expired. Please check your API key.');
			} else if (error.status === 403) {
				throw new Error('Perplexity API access forbidden. Check your subscription status.');
			} else if (error.status === 429) {
				throw new Error('Perplexity API rate limit exceeded. Please wait and try again.');
			} else {
				throw new Error(`Perplexity API Error (${error.status}): ${error.text || error.message}`);
			}
		}
	}

	// Enhanced method to process Perplexity responses with sources and related questions
	enhancePerplexityResponse(content: string, responseData: any): string {
		let enhanced = content;
		
		console.log('🔧 Processing Perplexity response for citations...');
		console.log('📝 Original content length:', content.length);
		
		// Extract citations from response data if available
		const citations = responseData.citations || [];
		const relatedQuestions = responseData.related_questions || [];
		
		console.log('📚 Citations from API:', citations);
		console.log('❓ Related questions from API:', relatedQuestions);
		
		// Add sources section if citations are available
		if (citations && citations.length > 0) {
			enhanced += "\n\n---\n**Sources:**\n";
			
			citations.forEach((citation: any, index: number) => {
				const title = citation.title || citation.url || `Source ${index + 1}`;
				const url = citation.url;
				
				if (url) {
					enhanced += `- [${title}](${url})\n`;
				}
			});
		} else {
			// If no citations in response data, extract from content and try to get sources
			console.log('🔍 No citations in API response, extracting from content...');
			enhanced = this.extractAndFormatCitationsAdvanced(enhanced);
		}
		
		// Add related questions if available
		if (relatedQuestions && relatedQuestions.length > 0) {
			enhanced += "\n\n**Related Questions:**\n";
			relatedQuestions.forEach((question: string) => {
				enhanced += `- ${question}\n`;
			});
		}
		
		console.log('✅ Enhanced content length:', enhanced.length);
		return enhanced;
	}

	// Method to extract and format citations from content
	extractAndFormatCitations(content: string): string {
		// Pattern to match citations like [1], [2], etc.
		const citationPattern = /\[(\d+)\]/g;
		const citations = new Set<string>();
		
		// Extract citation numbers
		let match;
		while ((match = citationPattern.exec(content)) !== null) {
			citations.add(match[1]);
		}
		
		// If we found citations but no sources section, add placeholder
		if (citations.size > 0 && !content.includes('**Sources:**')) {
			content += "\n\n---\n**Sources:**\n";
			
			// Add placeholder source entries
			Array.from(citations).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
				content += `- [Source ${num}](#citation-${num})\n`;
			});
			
			content += "\n*Note: Source links depend on Perplexity's citation data availability*";
		}
		
		return content;
	}

	// Advanced method to extract citations and try to find actual sources
	extractAndFormatCitationsAdvanced(content: string): string {
		console.log('🔍 Advanced citation extraction...');
		
		// Pattern to match citations like [1], [2], etc.
		const citationPattern = /\[(\d+)\]/g;
		const citations = new Set<string>();
		
		// Extract citation numbers
		let match;
		while ((match = citationPattern.exec(content)) !== null) {
			citations.add(match[1]);
		}
		
		console.log('📊 Found citation numbers:', Array.from(citations));
		
		// Check if there's already a sources section in the content
		const hasSourcesSection = content.includes('**Sources:**') || content.includes('Sources:');
		
		if (citations.size > 0) {
			if (!hasSourcesSection) {
				// Try to extract sources from the end of content if they exist
				const lines = content.split('\n');
				const sourceLines: string[] = [];
				let foundSourceStart = false;
				
				// Look for source-like patterns at the end
				for (let i = lines.length - 1; i >= 0; i--) {
					const line = lines[i].trim();
					
					// Check if this looks like a source line
					if (line.match(/^\d+\.\s*https?:\/\//) || 
						line.match(/^\[\d+\]\s*https?:\/\//) ||
						line.match(/^https?:\/\/\S+/)) {
						sourceLines.unshift(line);
						foundSourceStart = true;
					} else if (foundSourceStart && line.length > 0) {
						// Stop if we hit non-source content
						break;
					}
				}
				
				if (sourceLines.length > 0) {
					console.log('📚 Found source lines:', sourceLines);
					
					// Remove source lines from original content
					const contentWithoutSources = lines.slice(0, lines.length - sourceLines.length).join('\n').trim();
					
					// Add properly formatted sources section
					content = contentWithoutSources + "\n\n---\n**Sources:**\n";
					
					sourceLines.forEach((sourceLine, index) => {
						// Extract URL and title from source line
						const urlMatch = sourceLine.match(/(https?:\/\/[^\s]+)/);
						if (urlMatch) {
							const url = urlMatch[1];
							const title = sourceLine.replace(urlMatch[0], '').replace(/^\d+\.\s*/, '').replace(/^\[\d+\]\s*/, '').trim() || `Source ${index + 1}`;
							content += `- [${title || url}](${url})\n`;
						}
					});
				} else {
					// No sources found, add placeholder
					content += "\n\n---\n**Sources:**\n";
					Array.from(citations).sort((a, b) => parseInt(a) - parseInt(b)).forEach(num => {
						content += `- [Source ${num}](#citation-${num})\n`;
					});
					content += "\n*Note: Source links depend on Perplexity's citation data availability*";
				}
			}
		}
		
		return content;
	}

	// Test method for debugging Perplexity API
	async testPerplexityAPI(): Promise<void> {
		console.log('🧪 Testing Perplexity API...');
		console.log('API Key exists:', !!this.settings.perplexityApiKey);
		console.log('API Key prefix:', this.settings.perplexityApiKey?.substring(0, 8) + '...');
		
		// Test with minimal request first
		const testBody = {
			model: "sonar",  // Use new valid model name
			messages: [
				{
					role: "user",
					content: "Hello! Can you tell me what is the capital of France? This is just a test."
				}
			],
			max_tokens: 100,
			temperature: 0.7
		};
		
		console.log('📤 Test Request Body:', JSON.stringify(testBody, null, 2));
		
		try {
			const response = await requestUrl({
				url: 'https://api.perplexity.ai/chat/completions',
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.settings.perplexityApiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(testBody)
			});
			
			console.log('✅ Success! Response:', response.json);
			new Notice('✅ Perplexity API test successful! Check console for details.');
			
		} catch (error: any) {
			console.error('❌ Perplexity API test failed:', error);
			console.error('Status:', error.status);
			console.error('Response text:', error.text);
			
			// Show detailed error to user
			let errorMessage = `❌ Perplexity API test failed!\n\n`;
			errorMessage += `Status: ${error.status}\n`;
			errorMessage += `Error: ${error.text || error.message}\n\n`;
			
			if (error.status === 400) {
				errorMessage += `Likely cause: Invalid request format or model name\n`;
				errorMessage += `Check console for full request details.`;
			} else if (error.status === 401) {
				errorMessage += `Likely cause: Invalid API key\n`;
				errorMessage += `Make sure your API key starts with "pplx-"`;
			} else if (error.status === 403) {
				errorMessage += `Likely cause: No access to this model\n`;
				errorMessage += `Check your Perplexity subscription status`;
			}
			
			new Notice(errorMessage, 10000); // Show for 10 seconds
		}
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
			throw new Error(`Exa search failed: ${error instanceof Error ? error.message : String(error)}`);
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
			new Notice(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
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
	private collapsedSections: Set<string> = new Set();

	constructor(app: App, plugin: GeminiWebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Helper method to create collapsible sections
	createCollapsibleSection(
		containerEl: HTMLElement, 
		title: string, 
		description: string, 
		sectionId: string,
		isExpanded: boolean = false
	): { headerEl: HTMLElement, contentEl: HTMLElement } {
		const sectionEl = containerEl.createEl('div', { cls: 'setting-section' });
		
		const headerEl = sectionEl.createEl('div', { 
			cls: `setting-section-header ${isExpanded ? 'expanded' : 'collapsed'}`,
			attr: { 'data-section': sectionId }
		});
		
		const toggleIcon = headerEl.createEl('span', { 
			cls: 'setting-section-toggle',
			text: isExpanded ? '▼' : '▶'
		});
		
		const titleEl = headerEl.createEl('h3', { 
			text: title,
			cls: 'setting-section-title'
		});
		
		if (description) {
			headerEl.createEl('p', { 
				text: description,
				cls: 'setting-section-description'
			});
		}
		
		const contentEl = sectionEl.createEl('div', { 
			cls: `setting-section-content ${isExpanded ? 'expanded' : 'collapsed'}`
		});
		
		// Toggle functionality
		headerEl.addEventListener('click', () => {
			const isCurrentlyExpanded = !this.collapsedSections.has(sectionId);
			
			if (isCurrentlyExpanded) {
				this.collapsedSections.add(sectionId);
				headerEl.removeClass('expanded');
				headerEl.addClass('collapsed');
				contentEl.removeClass('expanded');
				contentEl.addClass('collapsed');
				toggleIcon.textContent = '▶';
			} else {
				this.collapsedSections.delete(sectionId);
				headerEl.removeClass('collapsed');
				headerEl.addClass('expanded');
				contentEl.removeClass('collapsed');
				contentEl.addClass('expanded');
				toggleIcon.textContent = '▼';
			}
		});
		
		if (!isExpanded) {
			this.collapsedSections.add(sectionId);
		}
		
		return { headerEl, contentEl };
	}

	// Helper method to create status indicator
	createStatusIndicator(hasApiKey: boolean, provider: string): HTMLElement {
		const status = document.createElement('span');
		status.className = `status-indicator ${hasApiKey ? 'connected' : 'disconnected'}`;
		status.textContent = hasApiKey ? '✓ Configured' : '⚠️ Not configured';
		status.title = hasApiKey 
			? `${provider} API key is configured and ready to use`
			: `${provider} API key is missing. Add your API key to enable this provider.`;
		return status;
	}

	// Helper method to create reset button
	createResetButton(
		containerEl: HTMLElement,
		label: string,
		description: string,
		resetCallback: () => void
	): void {
		new Setting(containerEl)
			.setName(label)
			.setDesc(description)
			.addButton(button => button
				.setButtonText('Reset to Defaults')
				.setCta()
				.onClick(async () => {
					resetCallback();
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings
				}));
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		// Add custom CSS for enhanced UX
		containerEl.addClass('gemini-settings-container');
		
		// Main title with plugin info
		const titleSection = containerEl.createEl('div', { cls: 'settings-title-section' });
		titleSection.createEl('h1', {text: '🚀 AI Web Search Settings'});
		titleSection.createEl('p', {
			text: 'Comprehensive AI-powered web search with 4 providers: Gemini, Perplexity, Tavily, and Exa',
			cls: 'settings-subtitle'
		});

		// Quick Setup Section
		const { contentEl: quickSetupContent } = this.createCollapsibleSection(
			containerEl,
			'⚡ Quick Setup',
			'Essential settings to get started quickly',
			'quick-setup',
			true // Expanded by default
		);

		// Provider selection with status indicators
		const providerSetting = new Setting(quickSetupContent)
			.setName('🎯 Search Provider')
			.setDesc('Choose which AI service to use for web search');

		const providerContainer = providerSetting.settingEl.createEl('div', { cls: 'provider-selection-container' });
		
		const providerDropdown = providerContainer.createEl('select', { cls: 'provider-dropdown-enhanced' });
		
		// Add options with detailed descriptions and status
		const providers = [
			{ 
				value: 'gemini', 
				label: 'Google Gemini', 
				description: 'Direct Google Search integration, real-time grounding',
				hasKey: !!this.plugin.settings.geminiApiKey
			},
			{ 
				value: 'perplexity', 
				label: 'Perplexity AI', 
				description: 'Real-time web search with citations and analysis',
				hasKey: !!this.plugin.settings.perplexityApiKey
			},
			{ 
				value: 'tavily', 
				label: 'Tavily Search', 
				description: 'Advanced web search API optimized for AI applications',
				hasKey: !!this.plugin.settings.tavilyApiKey
			},
			{ 
				value: 'exa', 
				label: 'Exa (Neural Search)', 
				description: 'Semantic neural search, 425ms latency, AI-optimized',
				hasKey: !!this.plugin.settings.exaApiKey
			}
		];

		providers.forEach(provider => {
			const option = providerDropdown.createEl('option', { 
				value: provider.value, 
				text: `${provider.label} ${provider.hasKey ? '✓' : '⚠️'}`
			});
		});

		providerDropdown.value = this.plugin.settings.provider;

		// Provider info display
		const providerInfo = providerContainer.createEl('div', { cls: 'provider-info' });
		this.updateProviderInfo(providerInfo, this.plugin.settings.provider);

		providerDropdown.addEventListener('change', async (e) => {
			const newProvider = (e.target as HTMLSelectElement).value as 'gemini' | 'perplexity' | 'tavily' | 'exa';
			this.plugin.settings.provider = newProvider;
			await this.plugin.saveSettings();
			this.updateProviderInfo(providerInfo, newProvider);
			this.display(); // Refresh to show relevant settings
		});

		// Insert mode setting
		new Setting(quickSetupContent)
			.setName('📝 Insert Mode')
			.setDesc('How to insert AI responses when using text selection commands in notes')
			.addDropdown(dropdown => dropdown
				.addOption('replace', '🔄 Replace - Replace selected text with AI response')
				.addOption('append', '➕ Append - Insert AI response at cursor position')
				.setValue(this.plugin.settings.insertMode)
				.onChange(async (value) => {
					this.plugin.settings.insertMode = value as 'replace' | 'append';
					await this.plugin.saveSettings();
				}));

		// Max results with intelligent description
		new Setting(quickSetupContent)
			.setName('🔢 Max Search Results')
			.setDesc('Number of web sources to analyze (more = comprehensive but slower)')
			.addSlider(slider => slider
				.setLimits(1, 20, 1)
				.setValue(this.plugin.settings.maxResults)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxResults = value;
					await this.plugin.saveSettings();
					// Update description based on value
					const desc = value <= 5 ? 'Quick searches (1-2 seconds)' :
								value <= 10 ? 'Balanced speed/depth (2-4 seconds)' :
								'Deep research (4-8 seconds)';
					slider.sliderEl.title = desc;
				}));

		// Custom prompts toggle
		new Setting(quickSetupContent)
			.setName('🎨 Enable Custom Research Prompts')
			.setDesc('Use custom prompts for research modes instead of built-in defaults')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCustomPrompts)
				.onChange(async (value) => {
					this.plugin.settings.enableCustomPrompts = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide custom prompt settings
				}));

		// API Keys Section - always visible for easy setup
		const { contentEl: apiKeyContent } = this.createCollapsibleSection(
			containerEl,
			'🔑 API Keys Configuration',
			'Manage API keys for all providers (only current provider key is required)',
			'api-keys',
			false
		);

		// Add all API keys for easy management
		this.addAllApiKeys(apiKeyContent);

		// Provider-specific settings
		this.addProviderSpecificSettings(containerEl);

		// Custom prompts section
		if (this.plugin.settings.enableCustomPrompts) {
			this.addCustomPromptSettings(containerEl);
		}

		// Advanced sections for each provider
		this.addAdvancedProviderSettings(containerEl);

		// Chat saving settings section
		this.addChatSavingSettings(containerEl);

		// Preset configurations section
		this.addPresetConfigurations(containerEl);
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

		// Research-mode-specific Gemini Parameters
		containerEl.createEl('h4', {text: 'Research-Mode-Specific Gemini Parameters'});
		containerEl.createEl('p', {text: 'Each research mode has its own optimized parameter settings:', cls: 'setting-item-description'});

		this.addResearchModeGeminiSettings(containerEl, 'quick', '⚡ Quick Mode', 'Fast, focused responses');
		this.addResearchModeGeminiSettings(containerEl, 'comprehensive', '🔍 Comprehensive Mode', 'Balanced analysis');
		this.addResearchModeGeminiSettings(containerEl, 'deep', '🔬 Deep Mode', 'Thorough research');
		this.addResearchModeGeminiSettings(containerEl, 'reasoning', '🧠 Reasoning Mode', 'Logical analysis');
	}

	addResearchModeGeminiSettings(containerEl: HTMLElement, mode: string, title: string, description: string) {
		const modeContainer = containerEl.createEl('div', {cls: 'research-mode-settings'});
		modeContainer.createEl('h5', {text: title, cls: 'research-mode-title'});
		modeContainer.createEl('p', {text: description, cls: 'research-mode-description'});

		const modeKey = mode as keyof typeof this.plugin.settings;
		const modeSettings = this.plugin.settings[modeKey] as any;

		new Setting(modeContainer)
			.setName('Temperature')
			.setDesc('Controls randomness (0.0 = deterministic, 1.0 = very random)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(modeSettings.geminiTemperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).geminiTemperature = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Top P')
			.setDesc('Nucleus sampling threshold (0.1 = conservative, 1.0 = diverse)')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(modeSettings.geminiTopP)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).geminiTopP = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Top K')
			.setDesc('Number of top tokens to consider (1-100)')
			.addSlider(slider => slider
				.setLimits(1, 100, 1)
				.setValue(modeSettings.geminiTopK)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).geminiTopK = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Max Output Tokens')
			.setDesc('Maximum response length (100-8192)')
			.addSlider(slider => slider
				.setLimits(100, 8192, 100)
				.setValue(modeSettings.geminiMaxTokens)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).geminiMaxTokens = value;
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

		// Research-mode-specific Perplexity Parameters
		containerEl.createEl('h4', {text: 'Research-Mode-Specific Perplexity Parameters'});
		containerEl.createEl('p', {text: 'Complete Perplexity API parameter set, optimized per research mode:', cls: 'setting-item-description'});

		this.addResearchModePerplexitySettings(containerEl, 'quickPerplexity', '⚡ Quick Mode', 'Fast, focused responses with minimal context');
		this.addResearchModePerplexitySettings(containerEl, 'comprehensivePerplexity', '🔍 Comprehensive Mode', 'Balanced analysis with citations');
		this.addResearchModePerplexitySettings(containerEl, 'deepPerplexity', '🔬 Deep Mode', 'Thorough research with maximum context');
		this.addResearchModePerplexitySettings(containerEl, 'reasoningPerplexity', '🧠 Reasoning Mode', 'Logical analysis with focused search');
	}

	addResearchModePerplexitySettings(containerEl: HTMLElement, mode: string, title: string, description: string) {
		const modeContainer = containerEl.createEl('div', {cls: 'research-mode-settings'});
		modeContainer.createEl('h5', {text: title, cls: 'research-mode-title'});
		modeContainer.createEl('p', {text: description, cls: 'research-mode-description'});

		const modeKey = mode as keyof typeof this.plugin.settings;
		const modeSettings = this.plugin.settings[modeKey] as any;

		// Core generation parameters
		new Setting(modeContainer)
			.setName('Temperature')
			.setDesc('Controls randomness (0.0 = deterministic, 2.0 = very random)')
			.addSlider(slider => slider
				.setLimits(0, 2, 0.1)
				.setValue(modeSettings.temperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).temperature = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Max Tokens')
			.setDesc('Maximum response length (100-4096)')
			.addSlider(slider => slider
				.setLimits(100, 4096, 100)
				.setValue(modeSettings.max_tokens)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).max_tokens = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Top P')
			.setDesc('Nucleus sampling threshold (0.1 = conservative, 1.0 = diverse)')
			.addSlider(slider => slider
				.setLimits(0.1, 1, 0.1)
				.setValue(modeSettings.top_p)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).top_p = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Top K')
			.setDesc('Number of top tokens to consider (1-100)')
			.addSlider(slider => slider
				.setLimits(1, 100, 1)
				.setValue(modeSettings.top_k)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).top_k = value;
					await this.plugin.saveSettings();
				}));

		// Penalty parameters
		new Setting(modeContainer)
			.setName('Frequency Penalty')
			.setDesc('Reduces repetition based on frequency (-2.0 to 2.0)')
			.addSlider(slider => slider
				.setLimits(-2, 2, 0.1)
				.setValue(modeSettings.frequency_penalty)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).frequency_penalty = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Presence Penalty')
			.setDesc('Encourages new topics (-2.0 to 2.0)')
			.addSlider(slider => slider
				.setLimits(-2, 2, 0.1)
				.setValue(modeSettings.presence_penalty)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).presence_penalty = value;
					await this.plugin.saveSettings();
				}));

		// Search parameters
		new Setting(modeContainer)
			.setName('Search Recency Filter')
			.setDesc('Filter search results by recency')
			.addDropdown(dropdown => dropdown
				.addOption('', 'No filter')
				.addOption('hour', 'Past hour')
				.addOption('day', 'Past day') 
				.addOption('week', 'Past week')
				.addOption('month', 'Past month')
				.setValue(modeSettings.search_recency_filter)
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).search_recency_filter = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Search Context Size')
			.setDesc('Number of search results to include in context (1-20)')
			.addSlider(slider => slider
				.setLimits(1, 20, 1)
				.setValue(modeSettings.search_context_size)
				.setDynamicTooltip()
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).search_context_size = value;
					await this.plugin.saveSettings();
				}));

		// Boolean options
		new Setting(modeContainer)
			.setName('Return Related Questions')
			.setDesc('Include related questions in response')
			.addToggle(toggle => toggle
				.setValue(modeSettings.return_related_questions)
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).return_related_questions = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Return Citations')
			.setDesc('Include source citations in response')
			.addToggle(toggle => toggle
				.setValue(modeSettings.return_citations)
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).return_citations = value;
					await this.plugin.saveSettings();
				}));

		new Setting(modeContainer)
			.setName('Return Images')
			.setDesc('Include relevant images in response')
			.addToggle(toggle => toggle
				.setValue(modeSettings.return_images)
				.onChange(async (value) => {
					(this.plugin.settings[modeKey] as any).return_images = value;
					await this.plugin.saveSettings();
				}));

		// Domain filter
		new Setting(modeContainer)
			.setName('Search Domain Filter')
			.setDesc('Comma-separated list of domains to search (e.g., arxiv.org, wikipedia.org)')
			.addTextArea(text => text
				.setPlaceholder('arxiv.org, wikipedia.org, github.com')
				.setValue(modeSettings.search_domain_filter.join(', '))
				.onChange(async (value) => {
					const domains = value.split(',').map(d => d.trim()).filter(d => d);
					(this.plugin.settings[modeKey] as any).search_domain_filter = domains;
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
		// Don't add API key here if we're in advanced settings (it's already in main API section)
		if (!containerEl.hasClass('provider-tab-content')) {
			new Setting(containerEl)
				.setName('🧠 Exa API Key')
				.setDesc('Get your API key from dashboard.exa.ai ($10 free credits to start)')
				.addText(text => text
					.setPlaceholder('Enter your Exa API key')
					.setValue(this.plugin.settings.exaApiKey)
					.onChange(async (value) => {
						this.plugin.settings.exaApiKey = value;
						await this.plugin.saveSettings();
					}));
		}

		// Search Type - with detailed explanations
		containerEl.createEl('h4', {text: '🎯 Search Configuration'});
		
		new Setting(containerEl)
			.setName('Search Type')
			.setDesc('Choose search algorithm based on your needs')
			.addDropdown(dropdown => {
				dropdown.addOption('auto', '🤖 Auto - Intelligent blend of neural & keyword (recommended)');
				dropdown.addOption('neural', '🧠 Neural - Semantic understanding, finds conceptually similar content');
				dropdown.addOption('keyword', '🔤 Keyword - Traditional exact word matching, faster');
				dropdown.addOption('fast', '⚡ Fast - Ultra-fast 425ms search, optimized for speed');
				dropdown.setValue(this.plugin.settings.exaSearchType);
				dropdown.onChange(async (value) => {
					this.plugin.settings.exaSearchType = value as 'auto' | 'neural' | 'keyword' | 'fast';
					await this.plugin.saveSettings();
				});
			});

		// Add search type explanation
		const searchTypeHelp = containerEl.createEl('div', { cls: 'setting-help-text' });
		searchTypeHelp.innerHTML = `
			<strong>Search Type Guide:</strong>
			<ul>
				<li><strong>Auto:</strong> Best of both worlds - combines neural semantic understanding with keyword precision</li>
				<li><strong>Neural:</strong> Understands meaning and context, finds related concepts even without exact keywords</li>
				<li><strong>Keyword:</strong> Traditional search, fast and precise for exact term matching</li>
				<li><strong>Fast:</strong> Lightning-fast results in 425ms, perfect for quick queries</li>
			</ul>
		`;

		new Setting(containerEl)
			.setName('Content Category Filter')
			.setDesc('Focus search on specific content types for better relevance')
			.addDropdown(dropdown => {
				dropdown.addOption('', '🌐 All Categories - Search everywhere');
				dropdown.addOption('company', '🏢 Company - Corporate websites and business info');
				dropdown.addOption('research paper', '📚 Research Papers - Academic and scientific papers');
				dropdown.addOption('news', '📰 News - News articles and journalism');
				dropdown.addOption('pdf', '📄 PDF Documents - Focus on PDF files');
				dropdown.addOption('github', '💻 GitHub - Code repositories and developer content');
				dropdown.addOption('tweet', '🐦 Twitter - Social media posts and discussions');
				dropdown.addOption('personal site', '👤 Personal Sites - Blogs and personal websites');
				dropdown.addOption('linkedin profile', '👔 LinkedIn - Professional profiles and content');
				dropdown.addOption('financial report', '💰 Financial Reports - Financial and investment data');
				dropdown.setValue(this.plugin.settings.exaCategory);
				dropdown.onChange(async (value) => {
					this.plugin.settings.exaCategory = value;
					await this.plugin.saveSettings();
				});
			});

		// Content Extraction - with benefits explanation
		containerEl.createEl('h4', {text: '📄 Content Extraction'});
		containerEl.createEl('p', { 
			text: 'Extract rich content from web pages for comprehensive analysis', 
			cls: 'setting-section-description' 
		});

		new Setting(containerEl)
			.setName('📝 Extract Full Text')
			.setDesc('Extract complete text content from web pages (slower but more comprehensive)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetText)
				.onChange(async (value) => {
					this.plugin.settings.exaGetText = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('✨ Extract Highlights')
			.setDesc('Get key highlights and important excerpts (faster, focuses on main points)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetHighlights)
				.onChange(async (value) => {
					this.plugin.settings.exaGetHighlights = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('📋 Generate AI Summary')
			.setDesc('Create AI-generated summaries of content (best for quick understanding)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exaGetSummary)
				.onChange(async (value) => {
					this.plugin.settings.exaGetSummary = value;
					await this.plugin.saveSettings();
				}));

		// Content extraction guide
		const extractionHelp = containerEl.createEl('div', { cls: 'setting-help-text' });
		extractionHelp.innerHTML = `
			<strong>💡 Content Extraction Tips:</strong>
			<ul>
				<li><strong>Full Text:</strong> Best for detailed analysis, but slower and uses more tokens</li>
				<li><strong>Highlights:</strong> Perfect balance of speed and relevance</li>
				<li><strong>AI Summary:</strong> Fastest option, great for quick research</li>
				<li><strong>Recommendation:</strong> Enable Highlights + Summary for optimal results</li>
			</ul>
		`;

		// Advanced Filtering
		containerEl.createEl('h4', {text: '🔍 Advanced Filtering'});
		containerEl.createEl('p', { 
			text: 'Fine-tune your search with domain and content filters', 
			cls: 'setting-section-description' 
		});

		new Setting(containerEl)
			.setName('✅ Include Domains')
			.setDesc('Only search within these domains (comma-separated). Examples: arxiv.org, github.com, wikipedia.org')
			.addTextArea(text => text
				.setPlaceholder('arxiv.org, github.com, scholar.google.com')
				.setValue(this.plugin.settings.exaIncludeDomains.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaIncludeDomains = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('❌ Exclude Domains')
			.setDesc('Exclude these domains from search results. Examples: reddit.com, quora.com')
			.addTextArea(text => text
				.setPlaceholder('reddit.com, quora.com, pinterest.com')
				.setValue(this.plugin.settings.exaExcludeDomains.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaExcludeDomains = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		// Date Filtering
		containerEl.createEl('h5', {text: '📅 Date Range Filtering'});

		new Setting(containerEl)
			.setName('📅 Start Date')
			.setDesc('Only include content published after this date (YYYY-MM-DD format)')
			.addText(text => text
				.setPlaceholder('2024-01-01')
				.setValue(this.plugin.settings.exaStartDate)
				.onChange(async (value) => {
					this.plugin.settings.exaStartDate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('📅 End Date')
			.setDesc('Only include content published before this date (YYYY-MM-DD format)')
			.addText(text => text
				.setPlaceholder('2024-12-31')
				.setValue(this.plugin.settings.exaEndDate)
				.onChange(async (value) => {
					this.plugin.settings.exaEndDate = value;
					await this.plugin.saveSettings();
				}));

		// Text Pattern Filtering
		containerEl.createEl('h5', {text: '🔤 Text Pattern Filtering'});

		new Setting(containerEl)
			.setName('✅ Must Include Text')
			.setDesc('Results must contain these phrases (comma-separated, max 5 words each)')
			.addTextArea(text => text
				.setPlaceholder('machine learning, artificial intelligence, research')
				.setValue(this.plugin.settings.exaIncludeText.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaIncludeText = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('❌ Must Exclude Text')
			.setDesc('Results must NOT contain these phrases (comma-separated)')
			.addTextArea(text => text
				.setPlaceholder('advertisement, sponsored, click here')
				.setValue(this.plugin.settings.exaExcludeText.join(', '))
				.onChange(async (value) => {
					this.plugin.settings.exaExcludeText = value
						.split(',')
						.map(s => s.trim())
						.filter(s => s.length > 0);
					await this.plugin.saveSettings();
				}));

		// Exa-specific presets
		const exaPresetsContainer = containerEl.createEl('div', { cls: 'exa-presets' });
		exaPresetsContainer.createEl('h5', {text: '🎛️ Exa Quick Presets'});

		const presetsGrid = exaPresetsContainer.createEl('div', { cls: 'presets-grid' });

		// Academic Research Preset
		new Setting(presetsGrid)
			.setName('🎓 Academic Research')
			.setDesc('Optimize for research papers and academic content')
			.addButton(button => button
				.setButtonText('Apply')
				.onClick(async () => {
					this.plugin.settings.exaSearchType = 'neural';
					this.plugin.settings.exaCategory = 'research paper';
					this.plugin.settings.exaIncludeDomains = ['arxiv.org', 'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov', 'ieee.org'];
					this.plugin.settings.exaGetText = true;
					this.plugin.settings.exaGetHighlights = true;
					this.plugin.settings.exaGetSummary = true;
					await this.plugin.saveSettings();
					this.display();
				}));

		// News & Current Events Preset
		new Setting(presetsGrid)
			.setName('📰 News & Current Events')
			.setDesc('Focus on recent news and current information')
			.addButton(button => button
				.setButtonText('Apply')
				.onClick(async () => {
					this.plugin.settings.exaSearchType = 'fast';
					this.plugin.settings.exaCategory = 'news';
					this.plugin.settings.exaStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 30 days
					this.plugin.settings.exaGetHighlights = true;
					this.plugin.settings.exaGetSummary = true;
					this.plugin.settings.exaGetText = false;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Developer Resources Preset
		new Setting(presetsGrid)
			.setName('💻 Developer Resources')
			.setDesc('Focus on code, documentation, and technical content')
			.addButton(button => button
				.setButtonText('Apply')
				.onClick(async () => {
					this.plugin.settings.exaSearchType = 'neural';
					this.plugin.settings.exaCategory = 'github';
					this.plugin.settings.exaIncludeDomains = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'docs.python.org'];
					this.plugin.settings.exaGetText = true;
					this.plugin.settings.exaGetHighlights = true;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Speed Optimized Preset
		new Setting(presetsGrid)
			.setName('⚡ Speed Optimized')
			.setDesc('Ultra-fast searches with minimal latency')
			.addButton(button => button
				.setButtonText('Apply')
				.onClick(async () => {
					this.plugin.settings.exaSearchType = 'fast';
					this.plugin.settings.exaGetText = false;
					this.plugin.settings.exaGetHighlights = true;
					this.plugin.settings.exaGetSummary = false;
					this.plugin.settings.exaIncludeDomains = [];
					this.plugin.settings.exaExcludeDomains = [];
					await this.plugin.saveSettings();
					this.display();
				}));
	}

	addCustomPromptSettings(containerEl: HTMLElement) {
		const { contentEl: customPromptContent } = this.createCollapsibleSection(
			containerEl,
			'🎨 Custom Research Mode Prompts',
			'Advanced prompt engineering with professional frameworks',
			'custom-prompts',
			false
		);

		// Framework explanation
		const frameworkHelp = customPromptContent.createEl('div', { cls: 'setting-help-text' });
		frameworkHelp.innerHTML = `
			<strong>🧠 Professional Prompt Frameworks:</strong>
			<ul>
				<li><strong>Quick Mode:</strong> Role-based + Constraints - Concise, accurate, avoid hallucination</li>
				<li><strong>Comprehensive:</strong> CRISPE Framework - Clarity, Relevance, Iteration, Specificity, Parameters, Examples</li>
				<li><strong>Deep Research:</strong> TRACE Framework - Task, Request, Action, Context, Example</li>
				<li><strong>Reasoning:</strong> Chain-of-Thought + Meta-prompting - Step-by-step logical analysis</li>
			</ul>
			<p><strong>💡 Use placeholder:</strong> <code>{query}</code> will be replaced with the actual question.</p>
		`;

		new Setting(customPromptContent)
			.setName('⚡ Quick Mode Prompt')
			.setDesc('Framework: Role Assignment + Clear Constraints. Focus on concise, accurate answers (2-3 sentences)')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for quick mode...')
				.setValue(this.plugin.settings.quickPrompt)
				.onChange(async (value) => {
					this.plugin.settings.quickPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🔍 Comprehensive Mode Prompt')
			.setDesc('Framework: CRISPE (Clarity, Relevance, Iteration, Specificity, Parameters, Examples). Comprehensive analysis 400-600 words')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for comprehensive mode...')
				.setValue(this.plugin.settings.comprehensivePrompt)
				.onChange(async (value) => {
					this.plugin.settings.comprehensivePrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🎯 Deep Research Mode Prompt')
			.setDesc('Framework: TRACE (Task, Request, Action, Context, Example). Multi-dimensional deep research 800-1200 words')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for deep research mode...')
				.setValue(this.plugin.settings.deepPrompt)
				.onChange(async (value) => {
					this.plugin.settings.deepPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🧠 Reasoning Mode Prompt')
			.setDesc('Framework: Chain-of-Thought + Meta-prompting. Step-by-step logical analysis with self-verification')
			.addTextArea(text => text
				.setPlaceholder('Enter custom prompt for reasoning mode...')
				.setValue(this.plugin.settings.reasoningPrompt)
				.onChange(async (value) => {
					this.plugin.settings.reasoningPrompt = value;
					await this.plugin.saveSettings();
				}));

		// Reset to improved defaults button
		this.createResetButton(
			customPromptContent,
			'🔄 Reset to Improved Professional Prompts',
			'Restore enhanced prompts with professional frameworks',
			() => {
				// Reset to the improved default prompts from DEFAULT_SETTINGS
				this.plugin.settings.quickPrompt = DEFAULT_SETTINGS.quickPrompt;
				this.plugin.settings.comprehensivePrompt = DEFAULT_SETTINGS.comprehensivePrompt;
				this.plugin.settings.deepPrompt = DEFAULT_SETTINGS.deepPrompt;
				this.plugin.settings.reasoningPrompt = DEFAULT_SETTINGS.reasoningPrompt;
			}
		);
	}

	// Helper method to update provider info
	updateProviderInfo(container: HTMLElement, provider: string) {
		container.empty();
		
		const providers = {
			'gemini': {
				name: 'Google Gemini',
				description: 'Direct Google Search integration with real-time grounding',
				features: ['Real-time web search', 'Google Search results', 'Source citations', 'Multiple models'],
				pricing: 'Free tier available',
				latency: '~2-3 seconds',
				hasKey: !!this.plugin.settings.geminiApiKey
			},
			'perplexity': {
				name: 'Perplexity AI',
				description: 'Real-time web search with academic-quality citations',
				features: ['Real-time search', 'Citation tracking', 'Multi-model support', 'Reasoning mode'],
				pricing: '$20/month for Pro',
				latency: '~1-2 seconds',
				hasKey: !!this.plugin.settings.perplexityApiKey
			},
			'tavily': {
				name: 'Tavily Search',
				description: 'Advanced web search API optimized for AI applications',
				features: ['Advanced search depth', 'AI-optimized results', 'Source ranking', 'Content filtering'],
				pricing: '1000 free credits/month',
				latency: '~1-2 seconds',
				hasKey: !!this.plugin.settings.tavilyApiKey
			},
			'exa': {
				name: 'Exa Neural Search',
				description: 'Semantic neural search with 425ms lightning-fast latency',
				features: ['Neural semantic search', '425ms latency', 'Content extraction', 'Domain filtering'],
				pricing: '$10 free credits',
				latency: '~425ms (fastest)',
				hasKey: !!this.plugin.settings.exaApiKey
			}
		};

		const info = providers[provider as keyof typeof providers];
		if (!info) return;

		const infoCard = container.createEl('div', { cls: 'provider-info-card' });
		
		// Status and name
		const header = infoCard.createEl('div', { cls: 'provider-info-header' });
		header.createEl('h4', { text: info.name });
		header.appendChild(this.createStatusIndicator(info.hasKey, info.name));
		
		// Description
		infoCard.createEl('p', { text: info.description, cls: 'provider-description' });
		
		// Features
		const featuresList = infoCard.createEl('ul', { cls: 'provider-features' });
		info.features.forEach(feature => {
			featuresList.createEl('li', { text: feature });
		});
		
		// Specs
		const specs = infoCard.createEl('div', { cls: 'provider-specs' });
		specs.createEl('span', { text: `💰 ${info.pricing}`, cls: 'spec-item' });
		specs.createEl('span', { text: `⚡ ${info.latency}`, cls: 'spec-item' });
	}

	// Method to add all API keys for easy management
	addAllApiKeys(containerEl: HTMLElement) {
		// Gemini API Key
		const geminiSetting = new Setting(containerEl)
			.setName('🤖 Google Gemini API Key')
			.setDesc('Get from Google AI Studio (aistudio.google.com) - Free tier with generous limits');
		
		geminiSetting.settingEl.appendChild(this.createStatusIndicator(!!this.plugin.settings.geminiApiKey, 'Gemini'));
		
		geminiSetting.addText(text => text
			.setPlaceholder('Enter your Gemini API key')
			.setValue(this.plugin.settings.geminiApiKey)
			.onChange(async (value) => {
				this.plugin.settings.geminiApiKey = value;
				await this.plugin.saveSettings();
				this.display(); // Refresh status indicators
			}));

		// Perplexity API Key
		const perplexitySetting = new Setting(containerEl)
			.setName('🔍 Perplexity AI API Key')
			.setDesc('Get from Perplexity.ai - $20/month Pro plan for full access');
		
		perplexitySetting.settingEl.appendChild(this.createStatusIndicator(!!this.plugin.settings.perplexityApiKey, 'Perplexity'));
		
		perplexitySetting.addText(text => text
			.setPlaceholder('Enter your Perplexity API key')
			.setValue(this.plugin.settings.perplexityApiKey)
			.onChange(async (value) => {
				this.plugin.settings.perplexityApiKey = value;
				await this.plugin.saveSettings();
				this.display(); // Refresh status indicators
			}));

		// Tavily API Key
		const tavilySetting = new Setting(containerEl)
			.setName('🌐 Tavily Search API Key')
			.setDesc('Get from Tavily.com - 1000 free credits monthly, then $50/month');
		
		tavilySetting.settingEl.appendChild(this.createStatusIndicator(!!this.plugin.settings.tavilyApiKey, 'Tavily'));
		
		tavilySetting.addText(text => text
			.setPlaceholder('Enter your Tavily API key')
			.setValue(this.plugin.settings.tavilyApiKey)
			.onChange(async (value) => {
				this.plugin.settings.tavilyApiKey = value;
				await this.plugin.saveSettings();
				this.display(); // Refresh status indicators
			}));

		// Exa API Key
		const exaSetting = new Setting(containerEl)
			.setName('🧠 Exa Neural Search API Key')
			.setDesc('Get from dashboard.exa.ai - $10 free credits, then usage-based pricing');
		
		exaSetting.settingEl.appendChild(this.createStatusIndicator(!!this.plugin.settings.exaApiKey, 'Exa'));
		
		exaSetting.addText(text => text
			.setPlaceholder('Enter your Exa API key')
			.setValue(this.plugin.settings.exaApiKey)
			.onChange(async (value) => {
				this.plugin.settings.exaApiKey = value;
				await this.plugin.saveSettings();
				this.display(); // Refresh status indicators
			}));
	}

	// Method for provider-specific settings
	addProviderSpecificSettings(containerEl: HTMLElement) {
		// Provider-specific advanced settings
		const { contentEl: providerContent } = this.createCollapsibleSection(
			containerEl,
			`⚙️ ${this.plugin.settings.provider.charAt(0).toUpperCase() + this.plugin.settings.provider.slice(1)} Settings`,
			`Advanced configuration for ${this.plugin.settings.provider}`,
			'provider-specific',
			false
		);

		// Add provider-specific settings based on current provider
		switch (this.plugin.settings.provider) {
			case 'gemini':
				this.addGeminiSettings(providerContent);
				break;
			case 'perplexity':
				this.addPerplexitySettings(providerContent);
				break;
			case 'tavily':
				this.addTavilySettings(providerContent);
				break;
			case 'exa':
				this.addExaSettings(providerContent);
				break;
		}
	}

	// Method for advanced provider settings (for all providers)
	addAdvancedProviderSettings(containerEl: HTMLElement) {
		const { contentEl: advancedContent } = this.createCollapsibleSection(
			containerEl,
			'🔧 Advanced Provider Configurations',
			'Fine-tune settings for all providers (for power users)',
			'advanced-providers',
			false
		);

		// Add tabs or sections for each provider
		const tabsContainer = advancedContent.createEl('div', { cls: 'provider-tabs' });
		const contentContainer = advancedContent.createEl('div', { cls: 'provider-tabs-content' });

		const providers = ['gemini', 'perplexity', 'tavily', 'exa'];
		
		providers.forEach((provider, index) => {
			// Tab button
			const tab = tabsContainer.createEl('button', {
				cls: `provider-tab ${index === 0 ? 'active' : ''}`,
				text: provider.charAt(0).toUpperCase() + provider.slice(1),
				attr: { 'data-provider': provider }
			});

			// Tab content
			const content = contentContainer.createEl('div', {
				cls: `provider-tab-content ${index === 0 ? 'active' : ''}`,
				attr: { 'data-provider': provider }
			});

			// Add settings for each provider
			switch (provider) {
				case 'gemini':
					this.addGeminiAdvancedSettings(content);
					break;
				case 'perplexity':
					this.addPerplexityAdvancedSettings(content);
					break;
				case 'tavily':
					this.addTavilyAdvancedSettings(content);
					break;
				case 'exa':
					this.addExaAdvancedSettings(content);
					break;
			}

			// Tab click event
			tab.addEventListener('click', () => {
				// Remove active from all tabs and contents
				tabsContainer.querySelectorAll('.provider-tab').forEach(t => t.removeClass('active'));
				contentContainer.querySelectorAll('.provider-tab-content').forEach(c => c.removeClass('active'));
				
				// Add active to clicked tab and corresponding content
				tab.addClass('active');
				content.addClass('active');
			});
		});
	}

	// Method for preset configurations
	addPresetConfigurations(containerEl: HTMLElement) {
		const { contentEl: presetContent } = this.createCollapsibleSection(
			containerEl,
			'🎛️ Preset Configurations',
			'Quick presets for different use cases',
			'presets',
			false
		);

		// Preset buttons
		const presetButtons = presetContent.createEl('div', { cls: 'preset-buttons' });

		// Speed Optimized Preset
		new Setting(presetContent)
			.setName('⚡ Speed Optimized')
			.setDesc('Optimize for fastest responses (Exa fast search, minimal results)')
			.addButton(button => button
				.setButtonText('Apply Speed Preset')
				.onClick(async () => {
					this.plugin.settings.provider = 'exa';
					this.plugin.settings.exaSearchType = 'fast';
					this.plugin.settings.maxResults = 3;
					this.plugin.settings.exaGetText = false;
					this.plugin.settings.exaGetHighlights = true;
					this.plugin.settings.exaGetSummary = false;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Comprehensive Research Preset
		new Setting(presetContent)
			.setName('🔍 Comprehensive Research')
			.setDesc('Optimize for thorough research (Multiple sources, full content)')
			.addButton(button => button
				.setButtonText('Apply Research Preset')
				.onClick(async () => {
					this.plugin.settings.maxResults = 10;
					this.plugin.settings.exaSearchType = 'neural';
					this.plugin.settings.exaGetText = true;
					this.plugin.settings.exaGetHighlights = true;
					this.plugin.settings.exaGetSummary = true;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Academic Focus Preset
		new Setting(presetContent)
			.setName('🎓 Academic Focus')
			.setDesc('Optimize for academic and research sources')
			.addButton(button => button
				.setButtonText('Apply Academic Preset')
				.onClick(async () => {
					this.plugin.settings.provider = 'exa';
					this.plugin.settings.exaSearchType = 'neural';
					this.plugin.settings.exaCategory = 'research paper';
					this.plugin.settings.exaIncludeDomains = ['arxiv.org', 'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov'];
					this.plugin.settings.maxResults = 8;
					await this.plugin.saveSettings();
					this.display();
				}));

		// Reset to defaults
		this.createResetButton(
			presetContent,
			'🔄 Reset All Settings',
			'Reset all settings to default values',
			() => {
				Object.assign(this.plugin.settings, DEFAULT_SETTINGS);
			}
		);
	}

	// Chat saving settings
	addChatSavingSettings(containerEl: HTMLElement) {
		const { contentEl: chatContent } = this.createCollapsibleSection(
			containerEl,
			'💾 Chat Saving',
			'Save chat conversations as notes in your vault',
			'chat-saving',
			false
		);

		// Enable chat saving
		new Setting(chatContent)
			.setName('Enable Chat Saving')
			.setDesc('Allow saving chat conversations to your vault')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.chatSaveEnabled)
				.onChange(async (value) => {
					this.plugin.settings.chatSaveEnabled = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide other options
				}));

		if (this.plugin.settings.chatSaveEnabled) {
			// Folder name setting
			new Setting(chatContent)
				.setName('Chat Folder Name')
				.setDesc('Folder where chat conversations will be saved')
				.addText(text => text
					.setPlaceholder('AI Web Search Chats')
					.setValue(this.plugin.settings.chatFolderName)
					.onChange(async (value) => {
						this.plugin.settings.chatFolderName = value || 'AI Web Search Chats';
						await this.plugin.saveSettings();
					}));

			// Note template setting
			new Setting(chatContent)
				.setName('Note Naming Template')
				.setDesc('How to name saved chat notes')
				.addDropdown(dropdown => dropdown
					.addOption('timestamp-query', 'Timestamp + Query (2024-01-15-12-30-how-to-cook)')
					.addOption('query-timestamp', 'Query + Timestamp (how-to-cook-2024-01-15-12-30)')
					.addOption('query-only', 'Query Only (how-to-cook)')
					.addOption('counter', 'Counter Only (chat-1, chat-2, ...)')
					.setValue(this.plugin.settings.chatNoteTemplate)
					.onChange(async (value) => {
						this.plugin.settings.chatNoteTemplate = value as 'timestamp-query' | 'query-timestamp' | 'query-only' | 'counter';
						await this.plugin.saveSettings();
					}));

			// Help text
			chatContent.createEl('div', {
				cls: 'settings-help-text',
				text: '💡 Use the "Send & Save" button in the chat interface to save conversations. Saved notes will include metadata, timestamps, and full conversation history.'
			});
		}
	}

	// Additional methods for specific provider advanced settings
	addGeminiAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Gemini Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Fine-tune Gemini model behavior. These affect creativity, randomness, and response quality.',
			cls: 'settings-help-text'
		});
		
		// Add advanced Gemini settings here (temperature, topP, etc.)
		// These are already in addGeminiSettings, so we can reference that or create specific advanced ones
	}

	addPerplexityAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Perplexity Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Control Perplexity search depth and response characteristics.',
			cls: 'settings-help-text'
		});
	}

	addTavilyAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Tavily Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Tavily uses intelligent defaults. Additional customization options may be added in future updates.',
			cls: 'settings-help-text'
		});
	}

	addExaAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Exa Neural Search Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Exa offers the most customization options for semantic search and content filtering.',
			cls: 'settings-help-text'
		});
		
		// Show all Exa advanced settings here
		this.addExaSettings(containerEl);
	}
}

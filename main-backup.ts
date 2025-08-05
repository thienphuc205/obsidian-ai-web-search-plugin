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

	comprehensivePrompt: `### Framework: Phân tích toàn diện CRISPE

**Clarity (Rõ ràng):** Bạn là một nhà nghiên cứu chuyên nghiệp có nhiều năm kinh nghiệm.

**Relevance (Phù hợp):** Phân tích toàn diện chủ đề: "{query}"

**Iteration (Lặp lại):** Cấu trúc phản hồi theo các bước logic:

1. **Tổng quan** (2-3 câu giới thiệu chủ đề)
2. **Các khía cạnh chính** (ít nhất 3-4 khía cạnh quan trọng)
3. **Bối cảnh và ứng dụng** (tại sao điều này quan trọng)
4. **Ví dụ cụ thể** (1-2 ví dụ minh họa)
5. **Kết luận và hướng phát triển**

**Specificity (Cụ thể):** 
- Độ dài: 400-600 từ
- Ngôn ngữ: Chuyên nghiệp nhưng dễ hiểu
- Trích dẫn: Nếu có thông tin cụ thể, hãy đề cập nguồn

**Parameters (Tham số):**
- Sử dụng bullet points và headings để tổ chức thông tin
- Tránh jargon quá kỹ thuật trừ khi cần thiết
- Cân bằng giữa độ sâu và khả năng tiếp cận

**Examples (Ví dụ):** Bao gồm ví dụ thực tế để minh họa các khái niệm trừu tượng.`,

	deepPrompt: `### Framework: Nghiên cứu sâu TRACE

**Task (Nhiệm vụ):** Thực hiện nghiên cứu chuyên sâu về: "{query}"

**Request (Yêu cầu cụ thể):**
- Phân tích đa chiều từ ít nhất 4-5 góc độ khác nhau
- Đánh giá các quan điểm đối lập (nếu có)
- Kết nối với các lĩnh vực liên quan
- Độ dài: 800-1200 từ

**Action (Hành động thực hiện):**
1. **Phân tích nền tảng** - Lịch sử, nguồn gốc, định nghĩa
2. **Khảo sát toàn cảnh** - Tình trạng hiện tại, xu hướng
3. **Đa góc nhìn** - Quan điểm từ các lĩnh vực/trường phái khác nhau
4. **Phân tích sâu** - Nguyên nhân, hệ quả, mối liên hệ
5. **Dự báo và hàm ý** - Tác động tương lai, ứng dụng thực tiễn
6. **Đánh giá phản biện** - Điểm mạnh, hạn chế, tranh cãi

**Context (Bối cảnh):**
- Bạn là một chuyên gia hàng đầu trong lĩnh vực này
- Đối tượng: Độc giả có kiến thức nền tảng tốt
- Mục tiêu: Cung cấp cái nhìn toàn diện và sâu sắc nhất

**Example (Định dạng mẫu):**
## I. Phân tích nền tảng
[Nội dung chi tiết...]

## II. Đa góc nhìn chuyên môn
### A. Góc độ [lĩnh vực 1]
### B. Góc độ [lĩnh vực 2]
[...]

## III. Kết luận và hàm ý
[Tổng hợp, dự báo...]

**Lưu ý chất lượng:** Chỉ trình bày thông tin bạn có độ tin cậy cao. Nếu thiếu dữ liệu ở phần nào, hãy thừa nhận và đề xuất hướng nghiên cứu thêm.`,

	reasoningPrompt: `### Framework: Lý luận logic nâng cao

**Meta-instruction:** Bạn là một chuyên gia tư duy phản biện với khả năng phân tích logic xuất sắc.

**Nhiệm vụ phân tích:** "{query}"

**Quy trình tư duy (Chain-of-Thought):**

### Bước 1: Phân tách vấn đề
- Xác định các thành phần cốt lõi của vấn đề
- Phân loại thông tin: Dữ kiện | Giả thiết | Yếu tố chưa rõ

### Bước 2: Phân tích đa chiều  
**A. Phân tích logic:**
- Tiền đề nào đang được giả định?
- Các mối quan hệ nhân-quả tiềm ẩn?

**B. Phân tích ngữ cảnh:**
- Yếu tố môi trường/hoàn cảnh ảnh hưởng?
- Các constraint và boundary conditions?

**C. Phân tích góc nhìn:**
- Quan điểm từ các stakeholder khác nhau?
- Bias tiềm ẩn trong cách đặt vấn đề?

### Bước 3: Đánh giá bằng chứng
- Phân loại: Bằng chứng mạnh | Bằng chứng yếu | Thiếu bằng chứng
- Cross-validation: Các nguồn có nhất quán không?
- Reliability check: Độ tin cậy của từng luận điểm?

### Bước 4: Lý luận tổng hợp
**Suy luận chính:**
[Trình bày logic chain chính với các bước intermediate]

**Các giả thuyết thay thế:**
[Nêu và đánh giá ít nhất 2 cách hiểu khác]

**Độ tin cậy của kết luận:**
[Đánh giá mức độ chắc chắn với lý do]

### Bước 5: Kết luận có cấu trúc
- **Kết luận chính:** [1-2 câu tóm tắt]
- **Độ tin cậy:** [Cao/Trung bình/Thấp + lý do]  
- **Điều kiện:** [Trong hoàn cảnh nào kết luận này đúng]
- **Hạn chế:** [Những gì chưa được xem xét đầy đủ]
- **Hướng nghiên cứu thêm:** [Câu hỏi mở cho tương lai]

**Kiểm tra cuối:** Hãy tự đặt câu hỏi về logic của chính mình - có lỗ hổng nào không?`
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
			// Use improved default prompts
			switch (researchMode.id) {
				case 'quick':
					enhancedPrompt = `### Nhiệm vụ: Trả lời nhanh và chính xác

Bạn là một chuyên gia có kiến thức sâu rộng. Hãy trả lời câu hỏi sau một cách ngắn gọn và chính xác:

**Câu hỏi:** "${query}"

**Yêu cầu đầu ra:**
- Trả lời trực tiếp và súc tích (2-3 câu tối đa)
- Tập trung vào 2-3 điểm quan trọng nhất
- Sử dụng ngôn ngữ rõ ràng, dễ hiểu

**Định dạng:** Trả lời trực tiếp, không cần giải thích dài dòng.`;
					break;
				case 'comprehensive':
					enhancedPrompt = `### Framework: Phân tích toàn diện

**Nhiệm vụ:** Phân tích toàn diện chủ đề: "${query}"

**Cấu trúc phản hồi:**
1. **Tổng quan** (2-3 câu giới thiệu)
2. **Các khía cạnh chính** (3-4 khía cạnh quan trọng)
3. **Bối cảnh và ứng dụng** (tại sao quan trọng)
4. **Ví dụ cụ thể** (1-2 ví dụ minh họa)
5. **Kết luận và hướng phát triển**

**Yêu cầu:** 400-600 từ, chuyên nghiệp nhưng dễ hiểu, có nguồn khi có thể.`;
					break;
				case 'deep':
					enhancedPrompt = `### Framework: Nghiên cứu sâu

**Nhiệm vụ:** Nghiên cứu chuyên sâu về: "${query}"

**Phân tích bao gồm:**
1. **Phân tích nền tảng** - Lịch sử, nguồn gốc, định nghĩa
2. **Khảo sát toàn cảnh** - Tình trạng hiện tại, xu hướng  
3. **Đa góc nhìn** - Quan điểm từ các lĩnh vực khác nhau
4. **Phân tích sâu** - Nguyên nhân, hệ quả, mối liên hệ
5. **Dự báo và hàm ý** - Tác động tương lai, ứng dụng thực tiễn
6. **Đánh giá phản biện** - Điểm mạnh, hạn chế, tranh cãi

**Yêu cầu:** 800-1200 từ, cái nhìn toàn diện và sâu sắc, có cấu trúc rõ ràng.`;
					break;
				case 'reasoning':
					enhancedPrompt = `### Framework: Lý luận logic

**Nhiệm vụ phân tích:** "${query}"

**Quy trình tư duy:**
1. **Phân tách vấn đề** - Xác định thành phần cốt lõi
2. **Phân tích đa chiều** - Logic, ngữ cảnh, góc nhìn khác nhau
3. **Đánh giá bằng chứng** - Phân loại độ tin cậy
4. **Lý luận tổng hợp** - Logic chain và giả thuyết thay thế
5. **Kết luận có cấu trúc** - Kết luận, độ tin cậy, hạn chế

**Yêu cầu:** Tư duy phản biện, phân tích logic xuất sắc, tự kiểm tra lỗ hổng logic.`;
					break;
				default:
					enhancedPrompt = `Hãy cung cấp phân tích toàn diện về: "${query}" với thông tin chính xác và nguồn đáng tin cậy.`;
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
				.onChange(async (value: 'replace' | 'append') => {
					this.plugin.settings.insertMode = value;
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
				dropdown.onChange(async (value: 'auto' | 'neural' | 'keyword' | 'fast') => {
					this.plugin.settings.exaSearchType = value;
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
				<li><strong>Quick Mode:</strong> Role-based + Constraints - Ngắn gọn, chính xác, tránh hallucination</li>
				<li><strong>Comprehensive:</strong> CRISPE Framework - Clarity, Relevance, Iteration, Specificity, Parameters, Examples</li>
				<li><strong>Deep Research:</strong> TRACE Framework - Task, Request, Action, Context, Example</li>
				<li><strong>Reasoning:</strong> Chain-of-Thought + Meta-prompting - Phân tích logic từng bước</li>
			</ul>
			<p><strong>💡 Sử dụng placeholder:</strong> <code>{query}</code> sẽ được thay thế bằng câu hỏi thực tế.</p>
		`;

		new Setting(customPromptContent)
			.setName('⚡ Quick Mode Prompt')
			.setDesc('Framework: Role Assignment + Clear Constraints. Tập trung vào trả lời ngắn gọn, chính xác (2-3 câu)')
			.addTextArea(text => text
				.setPlaceholder('Nhập prompt tùy chỉnh cho chế độ nhanh...')
				.setValue(this.plugin.settings.quickPrompt)
				.onChange(async (value) => {
					this.plugin.settings.quickPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🔍 Comprehensive Mode Prompt')
			.setDesc('Framework: CRISPE (Clarity, Relevance, Iteration, Specificity, Parameters, Examples). Phân tích toàn diện 400-600 từ')
			.addTextArea(text => text
				.setPlaceholder('Nhập prompt tùy chỉnh cho chế độ toàn diện...')
				.setValue(this.plugin.settings.comprehensivePrompt)
				.onChange(async (value) => {
					this.plugin.settings.comprehensivePrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🎯 Deep Research Mode Prompt')
			.setDesc('Framework: TRACE (Task, Request, Action, Context, Example). Nghiên cứu sâu đa chiều 800-1200 từ')
			.addTextArea(text => text
				.setPlaceholder('Nhập prompt tùy chỉnh cho chế độ nghiên cứu sâu...')
				.setValue(this.plugin.settings.deepPrompt)
				.onChange(async (value) => {
					this.plugin.settings.deepPrompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(customPromptContent)
			.setName('🧠 Reasoning Mode Prompt')
			.setDesc('Framework: Chain-of-Thought + Meta-prompting. Phân tích logic từng bước với tự kiểm tra')
			.addTextArea(text => text
				.setPlaceholder('Nhập prompt tùy chỉnh cho chế độ lý luận...')
				.setValue(this.plugin.settings.reasoningPrompt)
				.onChange(async (value) => {
					this.plugin.settings.reasoningPrompt = value;
					await this.plugin.saveSettings();
				}));

		// Reset to improved defaults button
		this.createResetButton(
			customPromptContent,
			'🔄 Reset to Improved Professional Prompts',
			'Khôi phục các prompt đã được cải thiện với frameworks chuyên nghiệp',
			() => {
				// Reset to the improved default prompts from DEFAULT_SETTINGS
				this.plugin.settings.quickPrompt = DEFAULT_SETTINGS.quickPrompt;
				this.plugin.settings.comprehensivePrompt = DEFAULT_SETTINGS.comprehensivePrompt;
				this.plugin.settings.deepPrompt = DEFAULT_SETTINGS.deepPrompt;
				this.plugin.settings.reasoningPrompt = DEFAULT_SETTINGS.reasoningPrompt;
				this.plugin.saveSettings();
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

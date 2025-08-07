import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf } from 'obsidian';

// Enhanced Error Handling and Logging System
class PluginLogger {
	private static instance: PluginLogger;
	private debugMode: boolean = true;
	
	static getInstance(): PluginLogger {
		if (!PluginLogger.instance) {
			PluginLogger.instance = new PluginLogger();
		}
		return PluginLogger.instance;
	}
	
	debug(message: string, data?: any) {
		if (this.debugMode) {
			console.log(`[AI Web Search Debug] ${message}`, data || '');
		}
	}
	
	info(message: string, data?: any) {
		console.log(`[AI Web Search Info] ${message}`, data || '');
	}
	
	warn(message: string, data?: any) {
		console.warn(`[AI Web Search Warning] ${message}`, data || '');
	}
	
	error(message: string, error?: any) {
		console.error(`[AI Web Search Error] ${message}`, error || '');
	}
}

// Performance Monitoring System
class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private metrics: Map<string, number> = new Map();
	
	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}
	
	startTimer(operationId: string): void {
		this.metrics.set(operationId, Date.now());
	}
	
	endTimer(operationId: string): number {
		const startTime = this.metrics.get(operationId);
		if (!startTime) return 0;
		
		const duration = Date.now() - startTime;
		this.metrics.delete(operationId);
		
		const logger = PluginLogger.getInstance();
		logger.debug(`Performance: ${operationId} took ${duration}ms`);
		
		return duration;
	}
	
	logMetrics(operation: string, duration: number, metadata?: any) {
		const logger = PluginLogger.getInstance();
		logger.info(`Performance Metric: ${operation}`, {
			duration: `${duration}ms`,
			timestamp: new Date().toISOString(),
			...metadata
		});
	}
}

// Input Validation System
class InputValidator {
	static validateApiKey(key: string): boolean {
		return typeof key === 'string' && key.length > 0 && key.trim().length > 0;
	}
	
	static validateUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}
	
	static validateYouTubeUrl(url: string): boolean {
		if (!this.validateUrl(url)) return false;
		const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
		return youtubeRegex.test(url);
	}
	
	static validateQuery(query: string): boolean {
		return typeof query === 'string' && query.trim().length > 0 && query.length <= 10000;
	}
	
	static validateResearchMode(mode: string): boolean {
		const validModes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'];
		return validModes.includes(mode);
	}
	
	static validateProvider(provider: string): boolean {
		const validProviders = ['gemini', 'perplexity', 'tavily', 'exa'];
		return validProviders.includes(provider);
	}
	
	static sanitizeInput(input: string): string {
		return input.trim().replace(/[<>]/g, '');
	}
}

// Enhanced settings with multiple providers and research-mode-specific parameters
interface GeminiWebSearchSettings {
	provider: 'gemini' | 'perplexity' | 'tavily' | 'exa';
	geminiApiKey: string;
	perplexityApiKey: string;
	tavilyApiKey: string;
	exaApiKey: string;
	insertMode: 'replace' | 'append';
	maxResults: number;
	includeImages: boolean;
	
	// Chat saving settings
	chatFolderName: string;
	chatNoteTemplate: 'timestamp-query' | 'query-timestamp' | 'query-only' | 'counter';
	chatSaveEnabled: boolean;
	
	// Enhanced Model Configuration for Research Modes
	researchModeConfigs: {
		quick: {
			// Available Models
			geminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
			perplexityModel: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
			
			// Gemini Parameters (from AI Studio docs)
			geminiParams: {
				temperature: number; // 0.0-2.0
				topP: number; // 0.0-1.0 
				topK: number; // 0-100
				maxOutputTokens: number; // up to 8192
				responseMimeType: 'text/plain' | 'application/json';
				candidateCount: number; // 1-8, default 1
				stopSequences: string[];
				seed: number | null; // For reproducible outputs
			};
			
			// Gemini Safety Settings
			geminiSafety: {
				harassment: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				hateSpeech: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				dangerousContent: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
			};
			
			// Perplexity Parameters (from API docs)
			perplexityParams: {
				temperature: number; // 0.0-2.0
				max_tokens: number; // model-dependent
				top_p: number; // 0.0-1.0
				top_k: number; // 0-2048
				frequency_penalty: number; // -2.0 to 2.0
				presence_penalty: number; // -2.0 to 2.0
				stream: boolean;
				
				// Search-specific parameters
				search_domain_filter: string[]; // Allow/deny domains
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				search_mode: 'web' | 'academic';
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
				search_context_size: number; // Number of search results to use
			};
		};
		comprehensive: {
			geminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
			perplexityModel: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
			geminiParams: {
				temperature: number;
				topP: number;
				topK: number;
				maxOutputTokens: number;
				responseMimeType: 'text/plain' | 'application/json';
				candidateCount: number;
				stopSequences: string[];
				seed: number | null;
			};
			geminiSafety: {
				harassment: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				hateSpeech: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				dangerousContent: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
			};
			perplexityParams: {
				temperature: number;
				max_tokens: number;
				top_p: number;
				top_k: number;
				frequency_penalty: number;
				presence_penalty: number;
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				search_mode: 'web' | 'academic';
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
				search_context_size: number;
			};
		};
		deep: {
			geminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
			perplexityModel: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
			geminiParams: {
				temperature: number;
				topP: number;
				topK: number;
				maxOutputTokens: number;
				responseMimeType: 'text/plain' | 'application/json';
				candidateCount: number;
				stopSequences: string[];
				seed: number | null;
			};
			geminiSafety: {
				harassment: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				hateSpeech: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				dangerousContent: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
			};
			perplexityParams: {
				temperature: number;
				max_tokens: number;
				top_p: number;
				top_k: number;
				frequency_penalty: number;
				presence_penalty: number;
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				search_mode: 'web' | 'academic';
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
				search_context_size: number;
			};
		};
		reasoning: {
			geminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
			perplexityModel: 'sonar' | 'sonar-pro' | 'sonar-reasoning' | 'sonar-reasoning-pro' | 'sonar-deep-research';
			geminiParams: {
				temperature: number;
				topP: number;
				topK: number;
				maxOutputTokens: number;
				responseMimeType: 'text/plain' | 'application/json';
				candidateCount: number;
				stopSequences: string[];
				seed: number | null;
			};
			geminiSafety: {
				harassment: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				hateSpeech: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				dangerousContent: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
			};
			perplexityParams: {
				temperature: number;
				max_tokens: number;
				top_p: number;
				top_k: number;
				frequency_penalty: number;
				presence_penalty: number;
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				search_mode: 'web' | 'academic';
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
				search_context_size: number;
			};
		};
		youtube: {
			geminiModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
			geminiParams: {
				temperature: number;
				topP: number;
				topK: number;
				maxOutputTokens: number;
				responseMimeType: 'text/plain' | 'application/json';
				candidateCount: number;
				stopSequences: string[];
				seed: number | null;
			};
			geminiSafety: {
				harassment: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				hateSpeech: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				sexuallyExplicit: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
				dangerousContent: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
			};
		};
	};
	
	// Exa (Metaphor) Parameters
	exaSearchType: 'auto' | 'keyword' | 'neural';
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
	
	// Custom prompts with professional frameworks optimized for Obsidian
	enableCustomPrompts: boolean;
	quickPrompt: string;
	comprehensivePrompt: string;
	deepPrompt: string;
	reasoningPrompt: string;
	youtubePrompt: string;
	
	// Provider search/chat mode settings
	providerSearchModes: {
		[key: string]: boolean; // true = search mode, false = chat mode
	};
	
	// Context Memory System
	contextMemoryEnabled: boolean;
	maxContextMessages: number;
	contextMemoryStrategy: 'recent' | 'summary' | 'token-limit';
	
	// Advanced Configuration Presets
	configurationPresets: {
		[presetName: string]: {
			description: string;
			modeName: 'quick' | 'comprehensive' | 'deep' | 'reasoning' | 'youtube';
			provider: 'gemini' | 'perplexity';
			parameters: any;
		};
	};
	
	// UI Preferences  
	uiPreferences: {
		showAdvancedSettings: boolean;
		showParameterTooltips: boolean;
		autoSaveSettings: boolean;
		showPerformanceMetrics: boolean;
		compactMode: boolean;
	};
	
	// Backward compatibility
	geminiModel: string;
	perplexityModel: string;
	researchModeModels: {
		quick: string;
		comprehensive: string;
		deep: string;
		reasoning: string;
		youtube: string;
	};
}

const DEFAULT_SETTINGS: GeminiWebSearchSettings = {
	provider: 'gemini',
	geminiApiKey: '',
	perplexityApiKey: '',
	tavilyApiKey: '',
	exaApiKey: '',
	insertMode: 'replace',
	maxResults: 5,
	includeImages: false,
	
	// Chat saving settings
	chatFolderName: 'AI Web Search Chats',
	chatNoteTemplate: 'timestamp-query',
	chatSaveEnabled: true,
	
	// Enhanced Research Mode Configurations
	researchModeConfigs: {
		quick: {
			geminiModel: 'gemini-2.5-flash-lite',
			perplexityModel: 'sonar',
			geminiParams: {
				temperature: 0.5,
				topP: 0.7,
				topK: 20,
				maxOutputTokens: 1000,
				responseMimeType: 'text/plain',
				candidateCount: 1,
				stopSequences: [],
				seed: null
			},
			geminiSafety: {
				harassment: 'BLOCK_MEDIUM_AND_ABOVE',
				hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
				sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
				dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
			},
			perplexityParams: {
				temperature: 0.4,
				max_tokens: 800,
				top_p: 0.7,
				top_k: 20,
				frequency_penalty: 0.0,
				presence_penalty: 0.0,
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'day',
				search_mode: 'web',
				return_related_questions: false,
				return_citations: true,
				return_images: false,
				search_context_size: 3
			}
		},
		comprehensive: {
			geminiModel: 'gemini-2.5-flash',
			perplexityModel: 'sonar-pro',
			geminiParams: {
				temperature: 0.7,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2000,
				responseMimeType: 'text/plain',
				candidateCount: 1,
				stopSequences: [],
				seed: null
			},
			geminiSafety: {
				harassment: 'BLOCK_MEDIUM_AND_ABOVE',
				hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
				sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
				dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
			},
			perplexityParams: {
				temperature: 0.6,
				max_tokens: 2000,
				top_p: 0.8,
				top_k: 40,
				frequency_penalty: 0.1,
				presence_penalty: 0.1,
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'week',
				search_mode: 'web',
				return_related_questions: true,
				return_citations: true,
				return_images: true,
				search_context_size: 8
			}
		},
		deep: {
			geminiModel: 'gemini-2.5-pro',
			perplexityModel: 'sonar-deep-research',
			geminiParams: {
				temperature: 0.8,
				topP: 0.9,
				topK: 60,
				maxOutputTokens: 4000,
				responseMimeType: 'text/plain',
				candidateCount: 1,
				stopSequences: [],
				seed: null
			},
			geminiSafety: {
				harassment: 'BLOCK_MEDIUM_AND_ABOVE',
				hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
				sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
				dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
			},
			perplexityParams: {
				temperature: 0.7,
				max_tokens: 4000,
				top_p: 0.9,
				top_k: 60,
				frequency_penalty: 0.2,
				presence_penalty: 0.2,
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'month',
				search_mode: 'academic',
				return_related_questions: true,
				return_citations: true,
				return_images: true,
				search_context_size: 12
			}
		},
		reasoning: {
			geminiModel: 'gemini-2.5-pro',
			perplexityModel: 'sonar-reasoning-pro',
			geminiParams: {
				temperature: 0.3,
				topP: 0.6,
				topK: 20,
				maxOutputTokens: 3000,
				responseMimeType: 'text/plain',
				candidateCount: 1,
				stopSequences: [],
				seed: null
			},
			geminiSafety: {
				harassment: 'BLOCK_MEDIUM_AND_ABOVE',
				hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
				sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
				dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
			},
			perplexityParams: {
				temperature: 0.2,
				max_tokens: 3000,
				top_p: 0.6,
				top_k: 20,
				frequency_penalty: 0.0,
				presence_penalty: 0.0,
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'month',
				search_mode: 'web',
				return_related_questions: false,
				return_citations: true,
				return_images: false,
				search_context_size: 10
			}
		},
		youtube: {
			geminiModel: 'gemini-2.5-pro',
			geminiParams: {
				temperature: 0.3,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2048,
				responseMimeType: 'text/plain',
				candidateCount: 1,
				stopSequences: [],
				seed: null
			},
			geminiSafety: {
				harassment: 'BLOCK_MEDIUM_AND_ABOVE',
				hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
				sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
				dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE'
			}
		}
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
	
	// Custom prompts with professional frameworks optimized for Obsidian
	enableCustomPrompts: false,
	quickPrompt: "### Quick Research Response Framework\\n\\nYou are an expert researcher providing concise, actionable insights. Focus on immediate value and clear conclusions.\\n\\n**Research Query:** \\\"{query}\\\"\\n\\n**Response Structure:**\\n## 🎯 Key Findings\\n- Present 2-3 most important insights\\n- Use bullet points for clarity\\n- Keep each point to 1-2 sentences\\n\\n## 📚 Essential Sources\\nWhen referencing sources, use this format:\\n- **Source Name** - Brief description [^1]\\n- **Source Name** - Brief description [^2]\\n\\n## 🔗 Recommended Reading\\nFor additional external resources, format as:\\n- [Resource Title](https://example.com) - Why this is valuable\\n\\n---\\n### Citations\\n[^1]: Full citation with author, title, publication, date\\n[^2]: Full citation with author, title, publication, date\\n\\n**Guidelines:**\\n- Maximum 300 words total\\n- Prioritize recent, authoritative sources\\n- Include actionable next steps if relevant\\n- Use Obsidian-compatible markdown formatting",

	comprehensivePrompt: "### Comprehensive Research Analysis for Obsidian\\n\\nYou are a senior researcher conducting thorough analysis. Create well-structured content optimized for Obsidian knowledge management.\\n\\n**Research Topic:** \\\"{query}\\\"\\n\\n**Response Framework:**\\n\\n## 📋 Executive Summary\\nBrief overview highlighting key themes and conclusions (2-3 sentences)\\n\\n## 🔍 Detailed Analysis\\n\\n### Core Concepts\\n- **Concept 1**: Definition and significance [^1]\\n- **Concept 2**: Definition and significance [^2]\\n- **Concept 3**: Definition and significance [^3]\\n\\n### Current Landscape\\nAnalyze current state, trends, and developments with proper citations [^4][^5]\\n\\n### Multiple Perspectives\\n#### Academic Perspective\\nResearch findings and scholarly insights [^6]\\n\\n#### Industry Perspective\\nPractical applications and market trends [^7]\\n\\n#### Critical Analysis\\nLimitations, controversies, or gaps [^8]\\n\\n## 🌐 External Resources\\nFor deeper exploration:\\n- [Primary Resource](https://example.com) - Comprehensive overview\\n- [Research Database](https://example.com) - Latest studies\\n- [Expert Analysis](https://example.com) - Professional insights\\n\\n## 🔗 Related Topics for Your Vault\\nConsider exploring: [[Topic 1]], [[Topic 2]], [[Topic 3]]\\n\\n---\\n### Sources and Citations\\n[^1]: Author, Title, Publication, Year, URL\\n[^2]: Author, Title, Publication, Year, URL\\n[^3]: Author, Title, Publication, Year, URL\\n[^4]: Author, Title, Publication, Year, URL\\n[^5]: Author, Title, Publication, Year, URL\\n[^6]: Author, Title, Publication, Year, URL\\n[^7]: Author, Title, Publication, Year, URL\\n[^8]: Author, Title, Publication, Year, URL\\n\\n**Quality Standards:**\\n- 600-800 words with proper structure\\n- Minimum 8 quality citations with full bibliographic details\\n- Use Obsidian-compatible internal links for related concepts\\n- External links open in new browser tabs when clicked",

	deepPrompt: "### Deep Research Investigation for Advanced Knowledge Management\\n\\nYou are a leading expert conducting comprehensive multi-dimensional analysis. Create research-grade content structured for Obsidian's advanced features.\\n\\n**Research Question:** \\\"{query}\\\"\\n\\n## 🎯 Research Overview\\n**Scope**: Comprehensive multi-perspective analysis\\n**Approach**: Systematic investigation across disciplines\\n**Expected Outcome**: Research-grade insights with complete documentation\\n\\n## 📚 Foundation Analysis\\n\\n### Historical Context\\nEvolution and development of the topic [^1][^2]\\n\\n### Theoretical Framework\\n- **Primary Theory A**: Core principles and applications [^3]\\n- **Primary Theory B**: Alternative approaches and methodologies [^4]\\n- **Synthesis**: Integration and comparative analysis [^5]\\n\\n## 🔬 Multi-Dimensional Investigation\\n\\n### Dimension 1: Academic Research\\n**Methodology**: Systematic literature review\\n**Key Findings**: [^6][^7][^8]\\n- Finding 1 with supporting evidence\\n- Finding 2 with methodological details\\n- Finding 3 with statistical significance\\n\\n### Dimension 2: Professional Practice\\n**Industry Applications**: [^9][^10]\\n- Implementation strategies and success factors\\n- Challenges and mitigation approaches\\n- ROI and performance metrics\\n\\n### Dimension 3: Interdisciplinary Connections\\n**Cross-Field Insights**: [^11][^12]\\n- Connections to [[Related Field 1]]\\n- Applications in [[Related Field 2]]\\n- Emerging interdisciplinary opportunities\\n\\n### Dimension 4: Future Implications\\n**Trend Analysis**: [^13][^14]\\n- Short-term developments (1-2 years)\\n- Medium-term evolution (3-5 years)\\n- Long-term transformation (5+ years)\\n\\n## ⚖️ Critical Evaluation\\n\\n### Strengths and Advantages\\nEvidence-based assessment of positive aspects [^15]\\n\\n### Limitations and Challenges\\nSystematic analysis of constraints and difficulties [^16]\\n\\n### Controversies and Debates\\nBalanced examination of disputed areas [^17][^18]\\n\\n## 🌐 Comprehensive Resource Library\\n\\n### Primary Sources\\n- [Foundational Research](https://example.com) - Seminal papers and studies\\n- [Current Literature](https://example.com) - Recent peer-reviewed articles\\n- [Institutional Reports](https://example.com) - Official analyses and data\\n\\n### Secondary Sources\\n- [Expert Commentary](https://example.com) - Professional perspectives\\n- [Industry Analysis](https://example.com) - Market and trend reports\\n- [Educational Resources](https://example.com) - Learning and development materials\\n\\n### Specialized Databases\\n- [Academic Database](https://example.com) - Scholarly articles and citations\\n- [Professional Database](https://example.com) - Industry insights and case studies\\n- [Government Resources](https://example.com) - Policy and regulatory information\\n\\n## 🔗 Knowledge Graph Connections\\n**Vault Integration Suggestions:**\\n- Create new notes: [[Topic Analysis]], [[Methodology Review]], [[Implementation Guide]]\\n- Link to existing: [[Research Methods]], [[Industry Trends]], [[Theoretical Frameworks]]\\n- Tag suggestions: #research #analysis #[topic-specific-tags]\\n\\n## 📊 Synthesis and Conclusions\\n\\n### Primary Conclusions\\nEvidence-based summary of key findings with confidence levels\\n\\n### Research Gaps\\nIdentified areas requiring further investigation\\n\\n### Actionable Recommendations\\nSpecific next steps for different stakeholder groups\\n\\n---\\n### Complete Bibliography\\n[^1]: Author, A. (Year). \\\"Article Title,\\\" *Journal Name*, Vol(Issue), pp. Pages. DOI/URL\\n[^2]: Author, B. (Year). *Book Title*. Publisher. ISBN. URL\\n[^3]: Author, C. (Year). \\\"Chapter Title,\\\" in *Book Title*, Editor (Ed.), Publisher, pp. Pages\\n[^4]: Organization. (Year). \\\"Report Title.\\\" *Publication Series*. Retrieved from URL\\n[^5]: Author, D. (Year). \\\"Conference Paper Title,\\\" *Conference Proceedings*, Location, Date\\n[^6]: Author, E. et al. (Year). \\\"Research Article,\\\" *Academic Journal*, Vol(Issue), pp. Pages\\n[^7]: Author, F. (Year). \\\"Analysis Title,\\\" *Professional Publication*, Date. URL\\n[^8]: Institution. (Year). \\\"Study Report,\\\" *Research Series*, Report Number. URL\\n[^9]: Author, G. (Year). \\\"Industry Report,\\\" *Business Publication*, Date. URL\\n[^10]: Expert, H. (Year). \\\"Commentary Title,\\\" *Expert Platform*, Date. URL\\n[^11]: Author, I. (Year). \\\"Cross-Disciplinary Study,\\\" *Interdisciplinary Journal*, Vol(Issue)\\n[^12]: Researcher, J. (Year). \\\"Integration Analysis,\\\" *Academic Publisher*, Location\\n[^13]: Analyst, K. (Year). \\\"Future Trends Report,\\\" *Research Institute*, Date. URL\\n[^14]: Futurist, L. (Year). \\\"Projection Analysis,\\\" *Think Tank Publication*, Date\\n[^15]: Evaluator, M. (Year). \\\"Strengths Assessment,\\\" *Evaluation Journal*, Vol(Issue)\\n[^16]: Critic, N. (Year). \\\"Limitations Review,\\\" *Critical Analysis Quarterly*, Vol(Issue)\\n[^17]: Debater, O. (Year). \\\"Controversy Overview,\\\" *Debate Forum*, Date. URL\\n[^18]: Scholar, P. (Year). \\\"Dispute Analysis,\\\" *Academic Review*, Vol(Issue), pp. Pages\\n\\n**Research Standards:**\\n- 1200-1500 words with academic rigor\\n- Minimum 18 high-quality citations with complete bibliographic information\\n- Multiple source types: peer-reviewed, professional, institutional\\n- Full integration with Obsidian linking and tagging systems\\n- Research-grade analysis suitable for academic or professional publication",

	reasoningPrompt: "### Advanced Logical Reasoning Framework for Obsidian Knowledge Systems\\n\\nYou are a critical thinking expert with exceptional analytical capabilities. Conduct systematic logical analysis optimized for Obsidian's knowledge management features.\\n\\n**Reasoning Task:** \\\"{query}\\\"\\n\\n## 🎯 Objective Definition\\n**Primary Goal**: Deconstruct the query, evaluate evidence, and synthesize a logically sound conclusion.\\n**Key Questions**:\\n1. What are the core assumptions?\\n2. What is the quality of evidence?\\n3. What are the potential biases?\\n4. What are the logical implications?\\n\\n## 📚 Evidence Deconstruction\\n\\n### Premise Identification\\n- **Premise 1**: [Statement] - (Source: [^1], Confidence: [High/Medium/Low])\\n- **Premise 2**: [Statement] - (Source: [^2], Confidence: [High/Medium/Low])\\n- **Premise 3**: [Statement] - (Source: [^3], Confidence: [High/Medium/Low])\\n\\n### Evidence Evaluation\\n- **Source Credibility**: Assessment of author, publication, and potential conflicts of interest [^4][^5]\\n- **Data Validity**: Methodological rigor, sample size, and statistical significance [^6][^7]\\n- **Logical Soundness**: Coherence and consistency of arguments [^8]\\n\\n## 🧠 Cognitive Bias Analysis\\n\\n### Potential Biases Detected\\n- **Confirmation Bias**: Tendency to favor information confirming existing beliefs [^9][^10]\\n- **Anchoring Bias**: Over-reliance on initial information [^11]\\n- **Availability Heuristic**: Overestimating importance of easily recalled information [^12]\\n- **Selection Bias**: Non-random sampling leading to skewed conclusions [^13]\\n\\n### Mitigation Strategies\\n- **Seeking Disconfirming Evidence**: Actively looking for data that challenges the premises [^14]\\n- **Considering Alternative Perspectives**: Exploring different viewpoints and frameworks [^15]\\n- **Blinding and Control Groups**: Methodological approaches to reduce bias in data collection [^16]\\n\\n## ⛓️ Logical Inference and Synthesis\\n\\n### Argument Mapping\\n- **Logical Chain 1**: [Premise 1] + [Premise 2] -> [Intermediate Conclusion A] [^17]\\n- **Logical Chain 2**: [Intermediate Conclusion A] + [Premise 3] -> [Final Conclusion B] [^18]\\n\\n### Hypothesis Testing\\n- **Hypothesis H1**: [Statement] - (Supporting Evidence: [^19], Contradicting Evidence: [^20])\\n- **Hypothesis H2**: [Statement] - (Supporting Evidence: [^21], Contradicting Evidence: [^22])\\n\\n### Synthesis of Conclusions\\n- **Primary Conclusion**: [Synthesized statement] with [Confidence Level]\\n- **Secondary Conclusion**: [Alternative or nuanced finding]\\n- **Unresolved Issues**: [Questions requiring further analysis]\\n\\n## ⚖️ Uncertainty and Limitation Assessment\\n\\n### Quantifying Uncertainty\\n- **Confidence Intervals**: Statistical range of plausible values [^23]\\n- **Sensitivity Analysis**: Impact of changing key assumptions [^24]\\n- **Scenario Planning**: Exploring outcomes under different conditions [^25]\\n\\n### Acknowledged Limitations\\n- **Data Gaps**: Information that is unavailable or incomplete [^26]\\n- **Methodological Constraints**: Limitations of the research design [^27]\\n- **Scope Boundaries**: What is not covered by this analysis [^28]\\n\\n## 🔗 Knowledge Integration for Obsidian\\n\\n**Actionable Insights**:\\n- **Decision Point**: [Key decision this analysis informs]\\n- **Next Steps**: [Recommended actions based on conclusions]\\n\\n**Vault Connections**:\\n- **Create Notes**: [[Logical Deconstruction]], [[Bias Mitigation Strategies]], [[Evidence Evaluation Checklist]]\\n- **Link to Notes**: [[Critical Thinking]], [[Mental Models]], [[Argument Mapping]]\\n- **Tags**: #reasoning #logic #critical-thinking #[topic-specific]\\n\\n---\\n### Bibliography and Evidence Base\\n[^1]: Source for Premise 1\\n[^2]: Source for Premise 2\\n[^3]: Source for Premise 3\\n[^4]: Credibility assessment source\\n[^5]: Conflict of interest documentation\\n[^6]: Methodological review source\\n[^7]: Statistical analysis documentation\\n[^8]: Logical soundness evaluation\\n[^9]: Confirmation bias research\\n[^10]: Disconfirming evidence source\\n[^11]: Anchoring bias study\\n[^12]: Availability heuristic research\\n[^13]: Selection bias analysis\\n[^14]: Disconfirming evidence strategy source\\n[^15]: Alternative perspectives documentation\\n[^16]: Control group methodology source\\n[^17]: Logical chain 1 evidence\\n[^18]: Logical chain 2 evidence\\n[^19]: Hypothesis H1 support\\n[^20]: Hypothesis H1 contradiction\\n[^21]: Hypothesis H2 support\\n[^22]: Hypothesis H2 contradiction\\n[^23]: Confidence interval data source\\n[^24]: Sensitivity analysis report\\n[^25]: Scenario planning documentation\\n[^26]: Data gap analysis\\n[^27]: Methodological constraint source\\n[^28]: Scope definition document\\n\\n**Reasoning Standards**:\\n- 1000-1300 words with complete logical documentation\\n- Minimum 28 citations supporting the reasoning process\\n- Systematic bias detection and uncertainty quantification\\n- Full integration with Obsidian knowledge management features\\n- Professional-grade logical analysis suitable for strategic decision-making",

	youtubePrompt: "### Comprehensive YouTube Video Analysis for Obsidian\\n\\n**Video URL:** {url}\\n\\nYou are a media analysis expert creating comprehensive video documentation for academic and professional knowledge management.\\n\\n## 📺 Video Documentation Framework\\n\\n### Basic Information\\n**Title**: [Extract video title]\\n**Creator/Channel**: [Channel name and credentials]\\n**Duration**: [Video length]\\n**Upload Date**: [Publication date]\\n**URL**: [Video URL] [^1]\\n\\n### Content Analysis Structure\\n\\n## 🎯 Executive Summary\\nBrief overview of video's main purpose and key value (2-3 sentences)\\n\\n## 📚 Content Breakdown\\n\\n### Primary Topics Covered\\n1. **Topic 1**: Key points and insights [^2]\\n2. **Topic 2**: Supporting arguments and evidence [^3]\\n3. **Topic 3**: Practical applications discussed [^4]\\n\\n### Key Insights and Data\\n- **Important Statistic/Claim 1**: [Quote with timestamp] [^5]\\n- **Important Statistic/Claim 2**: [Quote with timestamp] [^6]\\n- **Important Statistic/Claim 3**: [Quote with timestamp] [^7]\\n\\n### Notable Quotes\\n> \\\"Significant quote 1\\\" - [Speaker name, timestamp] [^8]\\n> \\\"Significant quote 2\\\" - [Speaker name, timestamp] [^9]\\n\\n## 🔍 Critical Evaluation\\n\\n### Credibility Assessment\\n- **Speaker Credentials**: [Qualifications and expertise] [^10]\\n- **Source Quality**: [Evidence quality and citations used] [^11]\\n- **Bias Considerations**: [Potential limitations or perspectives] [^12]\\n\\n### Educational Value\\n- **Target Audience**: [Who benefits most from this content]\\n- **Learning Outcomes**: [What viewers should understand]\\n- **Practical Applications**: [How to apply the information]\\n\\n## 🌐 Related Resources\\nFor additional context and verification:\\n- [Primary Source/Research](https://example.com) - Original research mentioned\\n- [Expert Analysis](https://example.com) - Related expert commentary\\n- [Institutional Resource](https://example.com) - Official documentation\\n\\n## 🔗 Knowledge Vault Integration\\n**Suggested Internal Links**: [[Video Analysis Method]], [[Research Methodology]], [[Topic Category]]\\n**Recommended Tags**: #video-analysis #[topic-specific] #[creator-name] #research\\n**Related Notes**: Consider creating [[Follow-up Research]] and [[Implementation Plan]]\\n\\n---\\n### Video Citations and References\\n[^1]: Video Source: [Creator Name]. \\\"[Video Title].\\\" YouTube, [Upload Date]. {url}\\n[^2]: Reference for Topic 1 information - timestamp or external source\\n[^3]: Reference for Topic 2 content - timestamp or supporting research\\n[^4]: Reference for Topic 3 applications - timestamp or related documentation\\n[^5]: Timestamp reference for statistic/claim 1 - [mm:ss format]\\n[^6]: Timestamp reference for statistic/claim 2 - [mm:ss format]\\n[^7]: Timestamp reference for statistic/claim 3 - [mm:ss format]\\n[^8]: Quote reference with exact timestamp - [mm:ss format]\\n[^9]: Quote reference with exact timestamp - [mm:ss format]\\n[^10]: Speaker credential source - website, LinkedIn, or institutional affiliation\\n[^11]: Source quality documentation - research papers, data sources referenced\\n[^12]: Bias analysis source - independent evaluation or comparative analysis\\n\\n**Analysis Standards:**\\n- 600-800 words with comprehensive video documentation\\n- Minimum 12 citations including timestamps and external sources\\n- Full Obsidian compatibility with internal linking\\n- Professional media analysis suitable for academic reference\\n- Include actionable insights and practical applications\\n\\nPlease analyze the video thoroughly and provide detailed documentation.",
	
	// Provider search/chat mode settings
	providerSearchModes: {
		gemini: true,
		perplexity: true,
		tavily: true,
		exa: true,
	},
	
	// Context Memory System
	contextMemoryEnabled: true,
	maxContextMessages: 10,
	contextMemoryStrategy: 'recent',
	
	// Advanced Configuration Presets
	configurationPresets: {
		"QuickFactCheck": {
			description: "Fast, concise answers for quick verification.",
			modeName: "quick",
			provider: "perplexity",
			parameters: {
				temperature: 0.2,
				max_tokens: 500,
				search_recency_filter: "day"
			}
		},
		"DeepDiveAnalysis": {
			description: "In-depth academic research for detailed papers.",
			modeName: "deep",
			provider: "gemini",
			parameters: {
				temperature: 0.8,
				topP: 0.9,
				maxOutputTokens: 4000
			}
		},
		"CreativeBrainstorming": {
			description: "Generate creative ideas and outlines.",
			modeName: "comprehensive",
			provider: "gemini",
			parameters: {
				temperature: 1.2,
				topP: 0.95
			}
		}
	},
	
	// UI Preferences
	uiPreferences: {
		showAdvancedSettings: false,
		showParameterTooltips: true,
		autoSaveSettings: true,
		showPerformanceMetrics: false,
		compactMode: false,
	},
	
	// Backward compatibility
	geminiModel: 'gemini-2.5-flash',
	perplexityModel: 'sonar-pro',
	researchModeModels: {
		quick: 'gemini-2.5-flash-lite',
		comprehensive: 'gemini-2.5-flash',
		deep: 'gemini-2.5-pro',
		reasoning: 'gemini-2.5-pro',
		youtube: 'gemini-2.5-pro',
	},
};

// Continue with other classes and functions here...

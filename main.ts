import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf, Modal, SuggestModal, FuzzySuggestModal } from 'obsidian';

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

	// Global provider-level settings for advanced UI
	geminiModel: string;
	geminiTemperature: number;
	geminiTopP: number;
	geminiTopK: number;
	geminiMaxOutputTokens: number;
	geminiHarassmentFilter: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
	geminiHateSpeechFilter: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
	geminiSexuallyExplicitFilter: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
	geminiDangerousContentFilter: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';

	perplexityModel: string;
	perplexityTemperature: number;
	perplexityMaxTokens: number;
	perplexityTopP: number;
	perplexityTopK: number;
	perplexityFrequencyPenalty: number;
	perplexityPresencePenalty: number;
	perplexityReturnCitations: boolean;
	perplexityReturnImages: boolean;
	perplexityReturnRelated: boolean;
	perplexitySearchDomainFilter: string;

	tavilySearchDepth: 'basic' | 'advanced';
	tavilyMaxResults: number;
	tavilyIncludeDomains: string;
	tavilyExcludeDomains: string;
	tavilyIncludeAnswer: boolean;
	tavilyIncludeRawContent: boolean;
	tavilyIncludeImages: boolean;
	tavilyTopic: string;
	tavilyDays: number;

	exaSearchType: 'neural' | 'keyword' | 'auto' | 'fast';
	exaUseAutoprompt: boolean;
	exaCategory: string;
	exaNumResults: number;
	exaIncludeDomains: string;
	exaExcludeDomains: string;
	exaStartCrawlDate: string;
	exaEndCrawlDate: string;
	exaStartPublishedDate: string;
	exaEndPublishedDate: string;
	exaIncludeText: boolean;
	exaIncludeHighlights: boolean;
	
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
				stream: boolean;
				
				// Search-specific parameters
				search_domain_filter: string[]; // Allow/deny domains
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
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
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
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
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
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
				stream: boolean;
				search_domain_filter: string[];
				search_recency_filter: 'month' | 'week' | 'day' | 'hour' | null;
				return_related_questions: boolean;
				return_citations: boolean;
				return_images: boolean;
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
	
	// Tavily Search Parameters (from API docs)
	tavilyParams: {
		query: string;
		search_depth: 'basic' | 'advanced';
		include_answer: boolean;
		include_images: boolean;
		include_raw_content: boolean;
		max_results: number;
		include_domains: string[];
		exclude_domains: string[];
		auto_parameters: {
			topic: 'general' | 'news' | 'finance' | 'research' | 'shopping';
			search_depth: 'basic' | 'advanced';
		};
		days: number | null; // Search freshness in days
		api_format: 'json' | 'markdown';
	};

	// Exa (Metaphor) Parameters (from API docs)
	exaParams: {
		query: string;
		type: 'auto' | 'keyword' | 'neural' | 'fast';
		category: 'company' | 'research paper' | 'news' | 'pdf' | 'github' | 'tweet' | 'personal site' | 'linkedin profile' | 'financial report' | '';
		numResults: number;
		includeDomains: string[];
		excludeDomains: string[];
		startCrawlDate: string;
		endCrawlDate: string;
		startPublishedDate: string;
		endPublishedDate: string;
		includeText: string[];
		excludeText: string[];
		getText: boolean;
		getHighlights: boolean;
		getSummary: boolean;
		userLocation: string; // Two-letter ISO country code
	};

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
	
	// Research mode model settings for backward compatibility
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
	
	// Global provider-level settings for advanced UI
	geminiModel: 'gemini-2.5-flash',
	geminiTemperature: 0.7,
	geminiTopP: 0.8,
	geminiTopK: 40,
	geminiMaxOutputTokens: 2000,
	geminiHarassmentFilter: 'BLOCK_MEDIUM_AND_ABOVE',
	geminiHateSpeechFilter: 'BLOCK_MEDIUM_AND_ABOVE',
	geminiSexuallyExplicitFilter: 'BLOCK_MEDIUM_AND_ABOVE',
	geminiDangerousContentFilter: 'BLOCK_MEDIUM_AND_ABOVE',

	perplexityModel: 'sonar-pro',
	perplexityTemperature: 0.5,
	perplexityMaxTokens: 1500,
	perplexityTopP: 0.8,
	perplexityTopK: 30,
	perplexityFrequencyPenalty: 0.0,
	perplexityPresencePenalty: 0.0,
	perplexityReturnCitations: true,
	perplexityReturnImages: false,
	perplexityReturnRelated: false,
	perplexitySearchDomainFilter: '',

	tavilySearchDepth: 'basic',
	tavilyMaxResults: 5,
	tavilyIncludeDomains: '',
	tavilyExcludeDomains: '',
	tavilyIncludeAnswer: true,
	tavilyIncludeRawContent: false,
	tavilyIncludeImages: false,
	tavilyTopic: '',
	tavilyDays: 7,

	exaSearchType: 'auto',
	exaUseAutoprompt: false,
	exaCategory: '',
	exaNumResults: 10,
	exaIncludeDomains: '',
	exaExcludeDomains: '',
	exaStartCrawlDate: '',
	exaEndCrawlDate: '',
	exaStartPublishedDate: '',
	exaEndPublishedDate: '',
	exaIncludeText: true,
	exaIncludeHighlights: true,
	
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
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'day',
				return_related_questions: false,
				return_citations: true,
				return_images: false
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
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'week',
				return_related_questions: true,
				return_citations: true,
				return_images: true
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
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'month',
				return_related_questions: true,
				return_citations: true,
				return_images: true
			}
		},
		reasoning: {
			geminiModel: 'gemini-2.5-pro',
			perplexityModel: 'sonar-reasoning',
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
				stream: false,
				search_domain_filter: [],
				search_recency_filter: 'month',
				return_related_questions: false,
				return_citations: true,
				return_images: false
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
	
	// Tavily Search Parameters (optimized defaults)
	tavilyParams: {
		query: '',
		search_depth: 'basic',
		include_answer: true,
		include_images: false,
		include_raw_content: false,
		max_results: 5,
		include_domains: [],
		exclude_domains: [],
		auto_parameters: {
			topic: 'general',
			search_depth: 'basic'
		},
		days: null,
		api_format: 'json'
	},

	// Exa Search Parameters (optimized defaults from API docs)
	exaParams: {
		query: '',
		type: 'auto',
		category: '',
		numResults: 10,
		includeDomains: [],
		excludeDomains: [],
		startCrawlDate: '',
		endCrawlDate: '',
		startPublishedDate: '',
		endPublishedDate: '',
		includeText: [],
		excludeText: [],
		getText: true,
		getHighlights: true,
		getSummary: true,
		userLocation: 'US'
	},

	// Custom prompts with professional frameworks optimized for Obsidian
	enableCustomPrompts: false,
	quickPrompt: "### ⚡ Quick Research Framework for Obsidian\n\nYou are an expert researcher providing rapid, actionable insights optimized for Obsidian knowledge management.\n\n**Query:** \"{query}\"\n\n## 🎯 Key Findings\n- **Finding 1**: [Concise insight with evidence] [^1]\n- **Finding 2**: [Supporting data or trend] [^2]\n- **Finding 3**: [Practical application] [^3]\n\n## 📚 Essential Context\n**Background**: Brief context explaining why this matters [^4]\n\n**Current Status**: What's happening now in this space [^5]\n\n## 🔗 Knowledge Connections\n*For your Obsidian vault:*\n- Consider linking to: [[Research Methods]], [[Data Analysis]], [[{query}]]\n- Related concepts: #quick-research #data #analysis\n- External resource: [Primary Source](https://example.com) - Why this matters\n\n## 📖 References\n[^1]: Author, \"Title,\" *Publication*, Date. Available: URL\n[^2]: Organization, \"Report Title,\" Date. Link: URL\n[^3]: Expert Name, \"Analysis,\" *Journal*, Date. URL: URL\n[^4]: Institution, \"Background Study,\" Date. Source: URL\n[^5]: Recent Study, \"Current Trends,\" Date. Available: URL\n\n**Standards**: 250-350 words, 5+ authoritative sources, Obsidian-optimized formatting",

	comprehensivePrompt: "### 🔍 Comprehensive Research Analysis for Obsidian Knowledge Management\n\nYou are a senior researcher conducting systematic analysis with full documentation for professional knowledge management.\n\n**Research Topic:** \"{query}\"\n\n## 📋 Executive Summary\n[2-3 sentence overview highlighting key themes, significance, and main conclusions] [^1][^2]\n\n## � Detailed Analysis\n\n### Core Concepts & Definitions\n- **Primary Concept**: Definition, significance, and applications [^3]\n- **Secondary Concept**: Supporting framework and methodology [^4]\n- **Key Metrics**: Quantitative measures and benchmarks [^5]\n\n### Current Landscape Analysis\n**Market/Field Overview**: Present state, major players, trends [^6][^7]\n\n**Recent Developments**: Latest changes, innovations, disruptions [^8][^9]\n\n**Challenges & Opportunities**: Current obstacles and emerging possibilities [^10]\n\n### Multi-Perspective Examination\n#### Academic Perspective\nResearch findings, peer-reviewed insights, theoretical frameworks [^11][^12]\n\n#### Industry Application\nReal-world implementations, case studies, best practices [^13][^14]\n\n#### Critical Analysis\nLimitations, controversies, knowledge gaps, bias considerations [^15][^16]\n\n## 🌐 External Resources & Further Reading\n- [Primary Research Database](https://example.com) - Comprehensive academic sources\n- [Industry Analysis Portal](https://example.com) - Current market data and trends\n- [Expert Commentary Hub](https://example.com) - Professional insights and opinions\n- [Technical Documentation](https://example.com) - Implementation guides and standards\n\n## 🔗 Obsidian Vault Integration\n**Suggested Note Creation:**\n- [[{query} - Overview]] - Main topic summary\n- [[{query} - Analysis]] - Detailed findings\n- [[{query} - Sources]] - Reference compilation\n- [[Research Methodology]] - Link to analysis methods\n\n**Recommended Tags:** #comprehensive-research #analysis #{topic-specific} #academic #industry\n\n**Cross-References:** [[Research Framework]], [[Data Sources]], [[Analysis Methods]]\n\n## 📚 Complete Source Documentation\n[^1]: Lead Author et al., \"Primary Study Title,\" *Journal Name*, Vol. X(Y), pp. Pages, Year. DOI: doi Available: URL\n[^2]: Organization Name, \"Report Title,\" *Publication Series*, Date. Retrieved from: URL\n[^3]: Expert Author, \"Definitional Framework,\" *Academic Press*, Year, pp. Pages. ISBN: isbn\n[^4]: Research Team, \"Supporting Analysis,\" *Conference Proceedings*, Location, Date. Link: URL\n[^5]: Data Institution, \"Metrics Report,\" *Statistical Series*, Year. Dataset: URL\n[^6]: Market Analyst, \"Industry Overview,\" *Business Journal*, Date. Available: URL\n[^7]: Think Tank, \"Sector Analysis,\" *Policy Report*, Year. Source: URL\n[^8]: News Source, \"Recent Development,\" *Publication*, Date. Article: URL\n[^9]: Innovation Hub, \"Trend Analysis,\" *Tech Report*, Date. Link: URL\n[^10]: Strategy Firm, \"Opportunity Assessment,\" *Consulting Report*, Year. URL: URL\n[^11]: Academic Institution, \"Research Findings,\" *University Press*, Year. Study: URL\n[^12]: Scholar Name, \"Theoretical Framework,\" *Academic Journal*, Vol(Issue), Year. DOI: URL\n[^13]: Company/Org, \"Case Study,\" *Implementation Report*, Date. Reference: URL\n[^14]: Industry Expert, \"Best Practices Guide,\" *Professional Publication*, Year. Guide: URL\n[^15]: Critical Analyst, \"Limitation Study,\" *Review Journal*, Vol(Issue), Year. Analysis: URL\n[^16]: Independent Researcher, \"Bias Assessment,\" *Methodology Journal*, Date. Paper: URL\n\n**Quality Standards:** 600-800 words, 16+ high-quality citations, full Obsidian integration, professional-grade analysis",

	deepPrompt: "### 🎯 Deep Research Investigation for Advanced Knowledge Systems\n\nYou are a leading domain expert conducting comprehensive multi-dimensional analysis for research-grade documentation.\n\n**Research Question:** \"{query}\"\n\n## 🎯 Research Framework\n**Scope**: Comprehensive interdisciplinary investigation\n**Methodology**: Systematic evidence synthesis across multiple domains\n**Output Standard**: Research-grade documentation with complete source verification\n\n## 📚 Foundational Analysis\n\n### Historical Development & Context\n**Evolution Timeline**: Key developments, paradigm shifts, milestone events [^1][^2][^3]\n\n**Foundational Theories**: Core theoretical frameworks and their originators [^4][^5]\n\n**Paradigm Changes**: Major shifts in understanding or approach [^6][^7]\n\n### Theoretical Framework Deep Dive\n#### Primary Theoretical Approach\n- **Core Principles**: Fundamental assumptions and logical structure [^8][^9]\n- **Key Contributors**: Major theorists and their specific contributions [^10][^11]\n- **Applications**: Real-world implementations and use cases [^12][^13]\n\n#### Alternative Theoretical Perspectives\n- **Competing Framework A**: Different approach, strengths, limitations [^14][^15]\n- **Competing Framework B**: Third perspective, synthesis opportunities [^16][^17]\n- **Integration Analysis**: How different theories complement or conflict [^18][^19]\n\n## 🔬 Multi-Dimensional Evidence Analysis\n\n### Dimension 1: Empirical Research Evidence\n**Methodology Review**: Research designs, sample sizes, statistical power [^20][^21]\n- Finding A: [Specific result with confidence intervals/effect sizes] [^22]\n- Finding B: [Replication studies and meta-analysis results] [^23]\n- Finding C: [Longitudinal data and trend analysis] [^24]\n\n### Dimension 2: Professional Practice Integration\n**Implementation Studies**: Real-world effectiveness, scalability, constraints [^25][^26]\n- Case Study A: [Successful implementation with metrics] [^27]\n- Case Study B: [Failed implementation with lessons learned] [^28]\n- Best Practice Synthesis: [Evidence-based recommendations] [^29][^30]\n\n### Dimension 3: Cross-Disciplinary Connections\n**Field Integration Analysis**: How this topic connects across disciplines [^31][^32]\n- **Connection to [[Field A]]**: Shared concepts, methodologies, applications [^33]\n- **Connection to [[Field B]]**: Collaborative opportunities, knowledge transfer [^34]\n- **Emerging Interdisciplinary Approaches**: New synthesis areas [^35][^36]\n\n### Dimension 4: Future Trajectory Analysis\n**Trend Identification**: Statistical analysis of development patterns [^37][^38]\n- **Short-term (1-2 years)**: Predictable developments, ongoing projects [^39]\n- **Medium-term (3-5 years)**: Probable innovations, market evolution [^40]\n- **Long-term (5+ years)**: Potential paradigm shifts, disruptive possibilities [^41]\n\n## ⚖️ Critical Evaluation & Synthesis\n\n### Strengths & Robust Evidence\n**High-Confidence Findings**: Well-supported conclusions with strong evidence [^42][^43]\n\n**Methodological Strengths**: Rigorous research designs, large samples [^44][^45]\n\n### Limitations & Knowledge Gaps\n**Identified Weaknesses**: Methodological limitations, sample constraints [^46][^47]\n\n**Research Gaps**: Areas needing investigation, unanswered questions [^48][^49]\n\n### Controversy & Debate Analysis\n**Major Debates**: Unresolved questions, competing evidence [^50][^51]\n\n**Bias Assessment**: Potential conflicts of interest, funding influences [^52][^53]\n\n## 🌐 Comprehensive Resource Ecosystem\n\n### Primary Research Sources\n- [Leading Research Institution Database](https://example.com) - Peer-reviewed studies and data\n- [Government Research Portal](https://example.com) - Official statistics and policy research\n- [International Organization Hub](https://example.com) - Global standards and comparative studies\n\n### Secondary Analysis Sources\n- [Expert Analysis Platform](https://example.com) - Professional commentary and interpretation\n- [Industry Intelligence Service](https://example.com) - Market analysis and trend reporting\n- [Academic Review Consortium](https://example.com) - Systematic reviews and meta-analyses\n\n### Specialized Databases & Tools\n- [Specialized Database A](https://example.com) - Domain-specific research repository\n- [Analytical Tool B](https://example.com) - Data analysis and visualization platform\n- [Professional Network C](https://example.com) - Expert community and collaboration space\n\n## 🔗 Advanced Knowledge Graph Integration\n\n### Core Note Architecture\n**Primary Notes to Create:**\n- [[{query} - Deep Analysis]] - Main research compilation\n- [[{query} - Theoretical Framework]] - Conceptual foundations\n- [[{query} - Evidence Base]] - Empirical findings summary\n- [[{query} - Methodology Review]] - Research methods analysis\n- [[{query} - Future Research]] - Gaps and opportunities\n- [[{query} - Implementation Guide]] - Practical applications\n\n### Cross-Reference Network\n**Foundational Connections:**\n- [[Research Methodology]] - Link to methods discussion\n- [[Statistical Analysis]] - Connect to analytical approaches\n- [[Literature Review]] - Reference review techniques\n- [[Critical Thinking]] - Link to evaluation frameworks\n\n**Domain-Specific Links:**\n- [[{topic} Theory]] - Theoretical foundations\n- [[{topic} Applications]] - Practical implementations\n- [[{topic} Research]] - Ongoing investigations\n\n### Tagging Strategy\n**Primary Tags:** #deep-research #evidence-based #multi-dimensional #academic\n**Domain Tags:** #{field-specific} #{methodology-type} #{application-area}\n**Status Tags:** #comprehensive #verified #research-grade\n\n## 📊 Research Synthesis & Conclusions\n\n### Primary Conclusions\n**High-Confidence Conclusions**: Well-supported findings with quantified certainty [^54][^55]\n\n**Moderate-Confidence Insights**: Probable conclusions with noted limitations [^56][^57]\n\n**Preliminary Findings**: Early indicators requiring further investigation [^58][^59]\n\n### Strategic Implications\n**For Researchers**: Priority areas for future investigation [^60]\n\n**For Practitioners**: Evidence-based implementation recommendations [^61]\n\n**For Policymakers**: Regulatory and policy considerations [^62]\n\n### Research Roadmap\n**Immediate Priorities**: Critical gaps requiring urgent investigation\n**Medium-term Goals**: Systematic research program development\n**Long-term Vision**: Transformative research possibilities\n\n---\n### Complete Academic Bibliography\n[Complete 62 reference citations with DOI and URLs where available]\n[^1] through [^62]: [Standard academic citation format with Author, Title, Journal/Publisher, Year, DOI/URL]\n\n**Research Standards:** 1200-1500 words, 62+ peer-reviewed citations, complete methodological documentation, research-grade analysis suitable for academic publication",

	reasoningPrompt: "### 🧠 Advanced Logical Reasoning & Critical Analysis Framework\n\nYou are a master logician and critical thinking expert conducting systematic reasoning analysis optimized for Obsidian knowledge systems.\n\n**Reasoning Challenge:** \"{query}\"\n\n## 🎯 Logical Framework Definition\n**Primary Objective**: Deconstruct arguments, evaluate evidence quality, identify logical fallacies, and synthesize sound conclusions\n\n**Reasoning Standards**: Formal logic principles, evidence hierarchy, bias mitigation, uncertainty quantification\n\n**Output Goal**: Rigorous logical analysis suitable for decision-making and knowledge building\n\n## 📚 Premise Deconstruction & Evidence Hierarchy\n\n### Core Premise Identification\n**Premise 1**: [Explicit statement]\n- *Source Quality*: [Peer-reviewed/Expert opinion/Anecdotal] [^1]\n- *Evidence Strength*: [Strong/Moderate/Weak with justification]\n- *Logical Role*: [Foundation/Supporting/Contingent]\n\n**Premise 2**: [Supporting statement]\n- *Source Quality*: [Academic/Professional/Popular media] [^2]\n- *Evidence Strength*: [Quantified confidence level]\n- *Logical Role*: [How this supports the argument] [^3]\n\n**Premise 3**: [Additional evidence]\n- *Source Quality*: [Primary/Secondary/Tertiary source] [^4]\n- *Evidence Strength*: [Statistical significance if applicable]\n- *Logical Role*: [Necessary/Sufficient/Contributing condition] [^5]\n\n### Evidence Quality Assessment Matrix\n#### Tier 1: High-Quality Evidence\n- **Systematic Reviews & Meta-Analyses**: [Citations with effect sizes] [^6][^7]\n- **Randomized Controlled Studies**: [Sample sizes, controls, replication] [^8][^9]\n- **Peer-Reviewed Research**: [Journal impact factors, citation counts] [^10][^11]\n\n#### Tier 2: Moderate-Quality Evidence\n- **Expert Consensus**: [Professional qualifications, agreement level] [^12][^13]\n- **Observational Studies**: [Methodology, confounding controls] [^14][^15]\n- **Government/Institutional Reports**: [Methodology transparency] [^16][^17]\n\n#### Tier 3: Supporting Evidence\n- **Expert Opinion**: [Individual expertise, potential bias] [^18][^19]\n- **Case Studies**: [Generalizability limitations] [^20][^21]\n- **Preliminary Research**: [Sample limitations, replication needs] [^22][^23]\n\n## 🔍 Cognitive Bias Detection & Mitigation\n\n### Identified Potential Biases\n#### Confirmation Bias Assessment\n**Evidence**: Tendency to favor information supporting existing beliefs [^24]\n- *Detection Methods*: Look for contradictory evidence actively sought [^25]\n- *Mitigation Strategy*: Steel-man opposing arguments [^26]\n- *Quality Check*: Proportion of disconfirming evidence considered [^27]\n\n#### Anchoring Bias Analysis\n**Evidence**: Over-reliance on first information encountered [^28]\n- *Detection*: Trace reasoning from initial assumptions [^29]\n- *Mitigation*: Consider alternative starting points [^30]\n- *Validation*: Test conclusions from different entry points [^31]\n\n#### Availability Heuristic Check\n**Evidence**: Overestimate probability of easily recalled events [^32]\n- *Detection*: Analyze if vivid examples dominate reasoning [^33]\n- *Mitigation*: Seek base rate statistics [^34]\n- *Correction*: Weight evidence by actual frequency data [^35]\n\n#### Selection & Sampling Bias\n**Evidence**: Non-representative data leading to skewed conclusions [^36]\n- *Detection*: Examine data collection methodology [^37]\n- *Mitigation*: Seek diverse data sources [^38]\n- *Validation*: Cross-reference with population statistics [^39]\n\n### Bias Mitigation Protocols\n**Protocol 1**: Systematic Devil's Advocate Analysis [^40]\n**Protocol 2**: Red Team Critical Review [^41]\n**Protocol 3**: Blind Spot Identification Matrix [^42]\n\n## ⛓️ Logical Structure Analysis & Inference Mapping\n\n### Argument Mapping & Logical Flow\n#### Primary Logical Chain\n**Step 1**: [Premise A] + [Premise B] → [Intermediate Conclusion X] [^43]\n- *Logic Type*: [Deductive/Inductive/Abductive]\n- *Validity Check*: [Valid/Invalid with explanation]\n- *Soundness Assessment*: [Sound/Unsound with reasoning]\n\n**Step 2**: [Intermediate Conclusion X] + [Premise C] → [Secondary Conclusion Y] [^44]\n- *Logical Operator*: [AND/OR/IF-THEN relationship]\n- *Strength Assessment*: [Strong/Moderate/Weak inference]\n- *Alternative Explanations*: [List competing interpretations] [^45]\n\n**Step 3**: [Secondary Conclusion Y] + [Additional Evidence] → [Final Conclusion Z] [^46]\n- *Confidence Level*: [Quantified certainty with bounds]\n- *Assumptions Required*: [Explicit unstated assumptions]\n- *Logical Dependencies*: [What must be true for conclusion to hold] [^47]\n\n#### Alternative Logical Pathways\n**Pathway A**: Different evidence combination leading to same conclusion [^48]\n**Pathway B**: Same evidence leading to different conclusions [^49]\n**Pathway C**: Null hypothesis testing and falsification attempts [^50]\n\n### Formal Logic Application\n#### Syllogistic Analysis\n- **Major Premise**: [Universal statement] [^51]\n- **Minor Premise**: [Specific application] [^52]\n- **Conclusion**: [Logical necessity] [^53]\n- **Validity Test**: [Form analysis independent of content]\n\n#### Propositional Logic Structure\n- **If P then Q**: [Conditional statement analysis] [^54]\n- **P or Q**: [Disjunctive reasoning examination] [^55]\n- **P and Q**: [Conjunctive logic verification] [^56]\n- **Not P**: [Negation and contradiction testing] [^57]\n\n## 📊 Uncertainty Quantification & Probability Assessment\n\n### Statistical Confidence Analysis\n**Confidence Intervals**: [Range estimates with statistical basis] [^58]\n- *Primary Finding*: [Point estimate ± margin of error] [^59]\n- *Secondary Finding*: [Probability bounds with assumptions] [^60]\n- *Tertiary Finding*: [Conditional probabilities] [^61]\n\n### Sensitivity Analysis Protocol\n**Assumption Variation Testing**: How conclusions change with different assumptions [^62]\n- *Robust Findings*: [Conclusions stable across assumption changes] [^63]\n- *Sensitive Findings*: [Results dependent on specific assumptions] [^64]\n- *Critical Dependencies*: [Assumptions that dramatically affect conclusions] [^65]\n\n### Scenario Analysis Framework\n**Best Case Scenario**: [Optimistic but realistic assessment] [^66]\n**Most Likely Scenario**: [Central tendency with highest probability] [^67]\n**Worst Case Scenario**: [Pessimistic but plausible assessment] [^68]\n**Black Swan Considerations**: [Low probability, high impact possibilities] [^69]\n\n## ⚖️ Limitation Acknowledgment & Knowledge Boundaries\n\n### Methodological Constraints\n**Data Limitations**: [Sample sizes, time ranges, scope boundaries] [^70]\n**Measurement Limitations**: [Precision, accuracy, reliability issues] [^71]\n**Analytical Limitations**: [Model assumptions, statistical power] [^72]\n\n### Scope & Generalizability Boundaries\n**Population Limits**: [Demographics, geographic, temporal boundaries] [^73]\n**Context Constraints**: [Environmental, cultural, institutional factors] [^74]\n**Domain Boundaries**: [Where findings apply vs. don't apply] [^75]\n\n### Acknowledged Uncertainties\n**Known Unknowns**: [Identified gaps in knowledge/data] [^76]\n**Model Limitations**: [Simplifications and assumptions required] [^77]\n**Future Contingencies**: [How changing conditions affect conclusions] [^78]\n\n## 🔗 Obsidian Knowledge Integration & Decision Framework\n\n### Core Knowledge Architecture\n**Central Analysis Note**: [[{query} - Logical Analysis]] - Complete reasoning documentation\n**Evidence Base Note**: [[{query} - Evidence Evaluation]] - Source quality assessment\n**Bias Assessment Note**: [[{query} - Cognitive Bias Check]] - Bias detection and mitigation\n**Logic Structure Note**: [[{query} - Argument Map]] - Formal logical analysis\n**Uncertainty Note**: [[{query} - Confidence Assessment]] - Probability and limitations\n\n### Cross-Reference Network\n**Methodological Links**:\n- [[Critical Thinking Methods]] - Link to reasoning frameworks\n- [[Logical Fallacies]] - Connect to error identification\n- [[Evidence Evaluation]] - Reference quality assessment\n- [[Bias Mitigation]] - Link to objectivity tools\n- [[Decision Theory]] - Connect to choice frameworks\n\n**Domain-Specific Connections**:\n- [[{topic} Controversies]] - Related debates and disputes\n- [[{topic} Evidence Base]] - Field-specific research\n- [[{topic} Expert Opinion]] - Professional consensus\n\n### Tagging Strategy\n**Method Tags**: #logical-analysis #critical-thinking #evidence-based #bias-checked\n**Quality Tags**: #high-confidence #moderate-confidence #preliminary #needs-verification\n**Process Tags**: #systematic #peer-reviewed #multi-perspective #uncertainty-quantified\n\n## 🎯 Synthesis & Actionable Conclusions\n\n### Primary Conclusions (High Confidence)\n**Conclusion 1**: [Statement with confidence level 90-95%] [^79]\n- *Supporting Evidence*: [Tier 1 sources, replication, expert consensus]\n- *Logical Basis*: [Deductive reasoning, validated premises]\n- *Practical Implication*: [What this means for decisions/actions]\n\n**Conclusion 2**: [Statement with confidence level 85-90%] [^80]\n- *Supporting Evidence*: [Multiple independent confirmations]\n- *Logical Basis*: [Strong inductive reasoning]\n- *Uncertainty Range*: [Bounds on confidence]\n\n### Secondary Conclusions (Moderate Confidence)\n**Provisional Finding**: [Statement with confidence level 70-85%] [^81]\n- *Evidence Gaps*: [What additional evidence would increase confidence]\n- *Alternative Explanations*: [Competing hypotheses not yet ruled out]\n- *Contingencies*: [Conditions under which this may not hold]\n\n### Research & Decision Recommendations\n**Immediate Actions**: Evidence-based steps with high confidence [^82]\n**Conditional Actions**: Steps dependent on additional verification [^83]\n**Future Investigation**: Priority areas for reducing uncertainty [^84]\n\n### Meta-Analysis of Reasoning Process\n**Reasoning Quality Assessment**: [Self-evaluation of logical rigor]\n**Bias Mitigation Success**: [How well cognitive biases were addressed]\n**Uncertainty Management**: [Appropriateness of confidence claims]\n\n---\n### Complete Logical Evidence Bibliography\n[Complete 84 reference citations with appropriate academic formatting]\n[^1] through [^84]: [Standard academic citation format with Author, Title, Journal/Publisher, Year, DOI/URL]\n\n**Reasoning Standards:** 1000-1300 words, 84+ citations supporting complete logical documentation, systematic bias detection, uncertainty quantification, full Obsidian integration, professional-grade logical analysis suitable for critical decision-making",

	youtubePrompt: "### 🎬 Comprehensive YouTube Video Analysis for Professional Knowledge Management\n\nYou are a media analysis expert creating research-grade video documentation optimized for Obsidian's knowledge management capabilities.\n\n**Video URL:** {url}\n\n## 📺 Video Intelligence Profile\n\n### Essential Metadata\n**Title**: [Extract and verify video title] [^1]\n**Creator/Channel**: [Channel name, subscriber count, verification status] [^2]\n**Publication Date**: [Upload date, recency relevance] [^3]\n**Duration**: [Total length, content density analysis] [^4]\n**View Metrics**: [View count, engagement rate, trending status] [^5]\n**Content Category**: [Educational/Entertainment/News/Tutorial/Review] [^6]\n\n### Content Classification & Quality Assessment\n**Content Type**: [Lecture/Discussion/Demonstration/Interview/Documentary] [^7]\n**Target Audience**: [Academic/Professional/General public/Specialized] [^8]\n**Production Quality**: [Professional/Semi-professional/Amateur with quality indicators] [^9]\n**Educational Value**: [High/Medium/Low with justification] [^10]\n\n## 🎯 Executive Summary & Strategic Overview\n**Core Purpose**: [2-3 sentence description of video's main objective and unique value] [^11]\n\n**Key Value Proposition**: [What makes this video worth watching/referencing] [^12]\n\n**Relevance Score**: [High/Medium/Low with context for your research/work] [^13]\n\n## 📚 Structured Content Analysis\n\n### Primary Topic Architecture\n#### Topic 1: [Main Subject Area]\n**Time Range**: [Start-End timestamps] [^14]\n- **Core Concepts**: [Key ideas presented with timestamp references] [^15]\n- **Supporting Evidence**: [Data, examples, case studies mentioned] [^16]\n- **Expert Claims**: [Specific assertions with speaker credentials] [^17]\n- **Practical Applications**: [How this applies to real-world scenarios] [^18]\n\n#### Topic 2: [Secondary Focus Area]\n**Time Range**: [Start-End timestamps] [^19]\n- **Theoretical Framework**: [Conceptual models or theories discussed] [^20]\n- **Methodological Approaches**: [Techniques, processes, or systems explained] [^21]\n- **Comparative Analysis**: [How this compares to alternatives] [^22]\n- **Implementation Considerations**: [Practical constraints and requirements] [^23]\n\n#### Topic 3: [Additional Content Area]\n**Time Range**: [Start-End timestamps] [^24]\n- **Emerging Trends**: [Future developments or innovations mentioned] [^25]\n- **Industry Insights**: [Market perspective or professional viewpoints] [^26]\n- **Technical Details**: [Specific procedures, formulas, or specifications] [^27]\n- **Success Metrics**: [How effectiveness or progress is measured] [^28]\n\n### Critical Information Extraction\n#### Quantitative Data Points\n- **Statistic 1**: [Specific number/percentage with context] [^29] *(Timestamp: [MM:SS])*\n- **Statistic 2**: [Performance metric or research finding] [^30] *(Timestamp: [MM:SS])*\n- **Statistic 3**: [Market data or comparative figures] [^31] *(Timestamp: [MM:SS])*\n\n#### Qualitative Insights\n- **Expert Opinion 1**: [Professional judgment or recommendation] [^32] *(Timestamp: [MM:SS])*\n- **Case Study**: [Real-world example or success story] [^33] *(Timestamp: [MM:SS])*\n- **Best Practice**: [Recommended approach or methodology] [^34] *(Timestamp: [MM:SS])*\n\n### Notable Quotations & Key Statements\n> **\"[Significant Quote 1]\"** - [Speaker Name/Role] [^35] *(Timestamp: [MM:SS])*\n> *Context: [Why this quote is important for your knowledge base]*\n\n> **\"[Significant Quote 2]\"** - [Speaker Name/Role] [^36] *(Timestamp: [MM:SS])*\n> *Application: [How this applies to practical work/research]*\n\n> **\"[Significant Quote 3]\"** - [Speaker Name/Role] [^37] *(Timestamp: [MM:SS])*\n> *Implication: [What this means for the field/industry]*\n\n## 🔍 Critical Evaluation & Source Verification\n\n### Speaker Credibility Assessment\n**Primary Speaker**: [Name, title, institutional affiliation] [^38]\n- **Expertise Level**: [Recognized expert/Practitioner/Thought leader] [^39]\n- **Relevant Credentials**: [Degrees, certifications, experience] [^40]\n- **Publication Record**: [Books, papers, previous media appearances] [^41]\n- **Potential Conflicts**: [Financial interests, organizational bias] [^42]\n\n**Additional Contributors**: [Other speakers or experts featured] [^43]\n\n### Content Verification & Fact-Checking\n#### Claims Requiring Verification\n- **Claim 1**: [Specific assertion made] [^44]\n  - *Verification Status*: [Confirmed/Disputed/Unverified]\n  - *Supporting Source*: [Independent verification if available] [^45]\n- **Claim 2**: [Statistical or factual statement] [^46]\n  - *Source Quality*: [Primary/Secondary/Tertiary data source]\n  - *Methodology*: [How data was collected/analyzed] [^47]\n\n#### Bias & Limitation Analysis\n**Potential Biases Detected**: [Commercial/Ideological/Selection biases] [^48]\n**Methodological Limitations**: [Sample size/Time period/Scope constraints] [^49]\n**Perspective Gaps**: [Missing viewpoints or alternative approaches] [^50]\n\n### Educational & Research Value Assessment\n**Strengths**:\n- [What the video does exceptionally well] [^51]\n- [Unique insights or perspectives provided] [^52]\n- [Quality of explanation or demonstration] [^53]\n\n**Limitations**:\n- [Areas where content could be stronger] [^54]\n- [Missing context or important considerations] [^55]\n- [Potential oversimplifications] [^56]\n\n## 🌐 Extended Research & Verification Resources\n\n### Primary Source Verification\n- [Original Research Paper](https://example.com) - Core study referenced in video [^57]\n- [Official Documentation](https://example.com) - Authoritative source for claims [^58]\n- [Government/Institutional Data](https://example.com) - Statistical verification [^59]\n\n### Expert Perspective & Commentary\n- [Expert Analysis Article](https://example.com) - Independent expert view on topic [^60]\n- [Professional Industry Report](https://example.com) - Industry context and trends [^61]\n- [Academic Review](https://example.com) - Scholarly perspective on subject [^62]\n\n### Additional Learning Resources\n- [Comprehensive Course/Tutorial](https://example.com) - Deeper learning on the topic [^63]\n- [Technical Documentation](https://example.com) - Implementation guides and details [^64]\n- [Community Discussion](https://example.com) - Ongoing conversation and updates [^65]\n\n### Contradictory or Alternative Viewpoints\n- [Alternative Perspective](https://example.com) - Different approach or opinion [^66]\n- [Critical Analysis](https://example.com) - Challenges or limitations discussed [^67]\n- [Debate/Discussion](https://example.com) - Multiple viewpoints presented [^68]\n\n## 🔗 Obsidian Knowledge Integration Strategy\n\n### Core Note Architecture for Your Vault\n**Primary Analysis Note**: [[{video-topic} - Video Analysis]] - This comprehensive analysis\n**Topic Deep Dive**: [[{video-topic} - Core Concepts]] - Extract key concepts for separate development\n**Speaker Profile**: [[{speaker-name} - Expert Profile]] - Track this expert's contributions\n**Methodology Notes**: [[{method/technique} - Implementation]] - Practical application guidance\n**Research Trail**: [[{video-topic} - Source Verification]] - Fact-checking and validation\n\n### Strategic Cross-Referencing\n**Conceptual Links**:\n- [[Video Analysis Methodology]] - Link to your analysis framework\n- [[Expert Opinion Tracking]] - Connect to expert knowledge system\n- [[Research Verification]] - Link to fact-checking protocols\n- [[Learning Resources]] - Connect to educational content organization\n\n**Topic-Specific Connections**:\n- [[{main-topic}]] - Primary subject area\n- [[{secondary-topic}]] - Related concepts and ideas\n- [[{industry/field}]] - Broader context and applications\n- [[{methodology/technique}]] - Specific approaches discussed\n\n**Temporal & Project Links**:\n- [[Current Research Projects]] - How this relates to ongoing work\n- [[Future Learning Goals]] - What to explore next\n- [[Industry Trend Tracking]] - How this fits broader patterns\n\n### Advanced Tagging Strategy\n**Content Tags**: #video-analysis #expert-opinion #educational-content #research-source\n**Quality Tags**: #high-credibility #verified-claims #comprehensive #well-sourced\n**Topic Tags**: #{main-topic} #{industry} #{methodology} #{application-area}\n**Status Tags**: #fully-analyzed #partially-verified #requires-follow-up #implementation-ready\n**Utility Tags**: #reference-material #teaching-resource #practical-guide #theoretical-framework\n\n### Implementation Roadmap\n**Immediate Actions** (Next 24-48 hours):\n1. Create linked notes for key concepts identified\n2. Verify 2-3 most important claims through independent sources\n3. Add to relevant project notes or research areas\n\n**Short-term Development** (Next week):\n1. Explore 3-5 additional resources from reference list\n2. Connect with related content in your vault\n3. Create implementation plan if applicable\n\n**Long-term Integration** (Next month):\n1. Track speaker for additional content\n2. Monitor topic for new developments\n3. Assess impact on related research or projects\n\n## 📊 Video Analysis Metrics & Quality Assessment\n\n### Content Quality Scorecard\n- **Information Density**: [High/Medium/Low] - Amount of useful information per minute\n- **Source Attribution**: [Excellent/Good/Poor] - How well claims are sourced\n- **Practical Applicability**: [High/Medium/Low] - Real-world utility of content\n- **Educational Structure**: [Excellent/Good/Poor] - Logical flow and clarity\n- **Update Frequency**: [Current/Recent/Outdated] - Relevance of information\n\n### Recommendation Score\n**Overall Rating**: [Essential/Recommended/Optional/Skip] [^69]\n**Best Use Case**: [Research reference/Learning resource/Background info/Entertainment]\n**Target Audience Match**: [Perfect fit/Good match/Partial relevance/Poor fit]\n**Follow-up Priority**: [High/Medium/Low] - Should you seek more from this source?\n\n---\n### Complete Video Documentation Bibliography\n[Complete 69 reference citations with timestamps and external verification]\n[^1] through [^69]: [Standard academic citation format with Video metadata, timestamps, and external source verification]\n\n**Analysis Standards:** 800-1000 words comprehensive documentation, 69+ citations including timestamps and external verification, complete Obsidian integration with linking strategy, research-grade video analysis suitable for professional knowledge management and academic reference.",
	
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
	
	// Research mode model settings for backward compatibility
	researchModeModels: {
		quick: 'gemini-2.5-flash-lite',
		comprehensive: 'gemini-2.5-flash',
		deep: 'gemini-2.5-pro',
		reasoning: 'gemini-2.5-pro',
		youtube: 'gemini-2.5-pro',
	},
};

// Constants for views
const CHAT_VIEW_TYPE = "gemini-chat-view";

// Enhanced Main Plugin Class
export default class GeminiWebSearchPlugin extends Plugin {
	settings!: GeminiWebSearchSettings;

	getCurrentResearchMode(): 'quick' | 'comprehensive' | 'deep' | 'reasoning' | 'youtube' {
		try {
			// Get current research mode from chat view
			const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)?.[0]?.view as GeminiChatView;
			const researchMode = chatView?.currentResearchMode;
			
			if (researchMode && InputValidator.validateResearchMode(researchMode.id)) {
				return researchMode.id as 'quick' | 'comprehensive' | 'deep' | 'reasoning' | 'youtube';
			}
			
			// Default to comprehensive if no mode is found
			return 'comprehensive';
		} catch (error) {
			PluginLogger.getInstance().warn('Failed to get current research mode, using default', error);
			return 'comprehensive';
		}
	}

	async onload() {
		const logger = PluginLogger.getInstance();
		const monitor = PerformanceMonitor.getInstance();
		const loadTimer = 'plugin-load';
		
		try {
			logger.info('Plugin loading started');
			monitor.startTimer(loadTimer);
			
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
				name: 'Search Web for Selected Text',
				editorCallback: async (editor: Editor, view: MarkdownView) => {
					const selection = editor.getSelection();
					if (selection) {
						await this.searchWeb(selection, 'replace');
					} else {
						new Notice('Please select some text first');
					}
				}
			});

			this.addCommand({
				id: 'gemini-web-search-append',
				name: 'Search Web for Selected Text (Append)',
				editorCallback: async (editor: Editor, view: MarkdownView) => {
					const selection = editor.getSelection();
					if (selection) {
						await this.searchWeb(selection, 'append');
					} else {
						new Notice('Please select some text first');
					}
				}
			});

			// Add chat command
			this.addCommand({
				id: 'open-ai-chat',
				name: 'Open AI Web Search Chat',
				callback: () => {
					this.activateView();
				}
			});

			// Add custom search command
			this.addCommand({
				id: 'gemini-web-search-prompt',
				name: 'AI Web Search: Custom query',
				editorCallback: (editor: Editor, ctx) => {
					this.promptForCustomSearch(editor);
				}
			});

			// Add new chat command
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

			// This creates an icon in the left ribbon.
			this.addRibbonIcon('search', 'AI Web Search', () => {
				this.showSearchModal();
			});

			// This adds a settings tab so the user can configure various aspects of the plugin
			this.addSettingTab(new GeminiSettingTab(this.app, this));

			const duration = monitor.endTimer(loadTimer);
			logger.info(`Plugin loaded successfully in ${duration}ms`);
		} catch (error) {
			logger.error('Plugin loading failed', error);
			new Notice(`AI Web Search Plugin failed to load: ${error}`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	showSearchModal() {
		const modal = new SearchModal(this.app, this);
		modal.open();
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async performWebSearch(query: string): Promise<string> {
		const logger = PluginLogger.getInstance();
		const monitor = PerformanceMonitor.getInstance();
		const operationId = `web-search-${this.settings.provider}-${Date.now()}`;
		
		try {
			monitor.startTimer(operationId);
			logger.debug('Starting web search', { 
				provider: this.settings.provider, 
				query: InputValidator.sanitizeInput(query).substring(0, 100) + '...'
			});
			
			// Validate inputs
			if (!InputValidator.validateQuery(query)) {
				throw new Error('Invalid search query provided');
			}
			
			if (!InputValidator.validateProvider(this.settings.provider)) {
				throw new Error(`Invalid provider: ${this.settings.provider}`);
			}
			
			let result: string;
			
			switch (this.settings.provider) {
				case 'gemini':
					result = await this.searchWithGemini(query);
					break;
				case 'perplexity':
					result = await this.searchWithPerplexity(query);
					break;
				case 'tavily':
					result = await this.searchWithTavily(query);
					break;
				case 'exa':
					result = await this.searchWithExa(query);
					break;
				default:
					throw new Error(`Invalid provider: ${this.settings.provider}`);
			}
			
			const duration = monitor.endTimer(operationId);
			monitor.logMetrics('web-search', duration, {
				provider: this.settings.provider,
				queryLength: query.length,
				resultLength: result.length
			});
			
			return result;
		} catch (error) {
			monitor.endTimer(operationId);
			logger.error('Web search failed', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			return `Search failed for: "${query}"\n\nError: ${errorMessage}\n\nPlease check your API configuration and try again.`;
		}
	}

	// Chat mode for Gemini - uses conversation context
	async performGeminiChat(query: string, chatHistory: Array<{role: string, content: string}>): Promise<string> {
		if (!this.settings.geminiApiKey) {
			throw new Error('Gemini API key not configured');
		}

		const logger = PluginLogger.getInstance();
		logger.debug('Starting Gemini chat', { query, historyLength: chatHistory.length });

		// Build conversation context
		const contents = [];
		
		// Add chat history
		chatHistory.forEach(msg => {
			contents.push({
				role: msg.role === 'user' ? 'user' : 'model',
				parts: [{ text: msg.content }]
			});
		});

		// Add current query
		contents.push({
			role: 'user',
			parts: [{ text: query }]
		});

		try {
			const response = await requestUrl({
				url: `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': this.settings.geminiApiKey
				},
				body: JSON.stringify({
					contents: contents,
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 2048,
						topP: 0.8,
						topK: 40
					}
				})
			});

			const data = response.json;
			
			if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
				return data.candidates[0].content.parts[0].text;
			} else {
				throw new Error('No valid response from Gemini API');
			}
		} catch (error) {
			logger.error('Gemini chat failed', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Gemini chat failed: ${errorMessage}`);
		}
	}

	// Chat mode for Perplexity - uses conversation context
	async performPerplexityChat(query: string, chatHistory: Array<{role: string, content: string}>): Promise<string> {
		if (!this.settings.perplexityApiKey) {
			throw new Error('Perplexity API key not configured');
		}

		const logger = PluginLogger.getInstance();
		logger.debug('Starting Perplexity chat', { query, historyLength: chatHistory.length });

		// Build conversation messages
		const messages = [];
		
		// Add chat history
		chatHistory.forEach(msg => {
			messages.push({
				role: msg.role,
				content: msg.content
			});
		});

		// Add current query
		messages.push({
			role: 'user',
			content: query
		});

		const requestBody = {
			model: this.settings.perplexityModel,
			messages: messages,
			temperature: this.settings.perplexityTemperature,
			max_tokens: this.settings.perplexityMaxTokens,
			top_p: this.settings.perplexityTopP,
			top_k: this.settings.perplexityTopK,
			frequency_penalty: this.settings.perplexityFrequencyPenalty,
			presence_penalty: this.settings.perplexityPresencePenalty
		};

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
			
			if (data.choices && data.choices[0]?.message?.content) {
				return data.choices[0].message.content;
			} else {
				throw new Error('No valid response from Perplexity API');
			}
		} catch (error) {
			logger.error('Perplexity chat failed', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Perplexity chat failed: ${errorMessage}`);
		}
	}

	async searchWithGemini(query: string): Promise<string> {
		const logger = PluginLogger.getInstance();
		const monitor = PerformanceMonitor.getInstance();
		const operationId = `gemini-search-${Date.now()}`;
		
		try {
			monitor.startTimer(operationId);
			logger.debug('Starting Gemini search', { queryLength: query.length });
			
			// Validate API key
			if (!InputValidator.validateApiKey(this.settings.geminiApiKey)) {
				throw new Error('Gemini API key not configured or invalid');
			}

			// Get current research mode from chat view
			const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]?.view as GeminiChatView;
			const researchMode = chatView?.currentResearchMode;

		// Get research-mode-specific parameters with validation
		let geminiParams = this.settings.researchModeConfigs.comprehensive.geminiParams; // default
		if (researchMode && InputValidator.validateResearchMode(researchMode.id)) {
			switch (researchMode.id) {
				case 'quick':
					geminiParams = this.settings.researchModeConfigs.quick.geminiParams;
					break;
				case 'comprehensive':
					geminiParams = this.settings.researchModeConfigs.comprehensive.geminiParams;
				break;
			case 'deep':
				geminiParams = this.settings.researchModeConfigs.deep.geminiParams;
				break;
			case 'reasoning':
				geminiParams = this.settings.researchModeConfigs.reasoning.geminiParams;
				break;
			case 'youtube':
				geminiParams = this.settings.researchModeConfigs.youtube.geminiParams; // Use youtube-specific params
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
					enhancedPrompt = this.settings.youtubePrompt.replace('{query}', query).replace('{url}', query);
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
					enhancedPrompt = `### YouTube Video Analysis for Obsidian Knowledge Management

**Video URL:** ${query}

You are a media analysis expert creating comprehensive video documentation for academic and professional knowledge management.

## 📺 Video Documentation Framework

### Basic Information
**Title**: [Extract video title]  
**Creator/Channel**: [Channel name and credentials]  
**Duration**: [Video length]  
**Upload Date**: [Publication date]  
**URL**: [Video URL] [^1]

### Content Analysis Structure

## 🎯 Executive Summary
Brief overview of video's main purpose and key value (2-3 sentences)

## 📚 Content Breakdown

### Primary Topics Covered
1. **Topic 1**: Key points and insights [^2]
2. **Topic 2**: Supporting arguments and evidence [^3]  
3. **Topic 3**: Practical applications discussed [^4]

### Key Insights and Data
- **Important Statistic/Claim 1**: [Quote with timestamp] [^5]
- **Important Statistic/Claim 2**: [Quote with timestamp] [^6]
- **Important Statistic/Claim 3**: [Quote with timestamp] [^7]

### Notable Quotes
> "Significant quote 1" - [Speaker name, timestamp] [^8]
> "Significant quote 2" - [Speaker name, timestamp] [^9]

## 🔍 Critical Evaluation

### Credibility Assessment
- **Speaker Credentials**: [Qualifications and expertise] [^10]
- **Source Quality**: [Evidence quality and citations used] [^11]
- **Bias Considerations**: [Potential limitations or perspectives] [^12]

### Educational Value
- **Target Audience**: [Who benefits most from this content]
- **Learning Outcomes**: [What viewers should understand]
- **Practical Applications**: [How to apply the information]

## 🌐 Related Resources
For additional context and verification:
- [Primary Source/Research](https://example.com) - Original research mentioned
- [Expert Analysis](https://example.com) - Related expert commentary  
- [Institutional Resource](https://example.com) - Official documentation

## 🔗 Knowledge Vault Integration
**Suggested Internal Links**: [[Video Analysis Method]], [[Research Methodology]], [[Topic Category]]  
**Recommended Tags**: #video-analysis #[topic-specific] #[creator-name] #research  
**Related Notes**: Consider creating [[Follow-up Research]] and [[Implementation Plan]]

---
### Video Citations and References
[^1]: Video Source: [Creator Name]. "[Video Title]." YouTube, [Upload Date]. [Full URL]
[^2]: Reference for Topic 1 information - timestamp or external source
[^3]: Reference for Topic 2 content - timestamp or supporting research
[^4]: Reference for Topic 3 applications - timestamp or related documentation
[^5]: Timestamp reference for statistic/claim 1 - [mm:ss format]
[^6]: Timestamp reference for statistic/claim 2 - [mm:ss format]  
[^7]: Timestamp reference for statistic/claim 3 - [mm:ss format]
[^8]: Quote reference with exact timestamp - [mm:ss format]
[^9]: Quote reference with exact timestamp - [mm:ss format]
[^10]: Speaker credential source - website, LinkedIn, or institutional affiliation
[^11]: Source quality documentation - research papers, data sources referenced
[^12]: Bias analysis source - independent evaluation or comparative analysis

**Analysis Standards:**
- 600-800 words with comprehensive video documentation
- Minimum 12 citations including timestamps and external sources
- Full Obsidian compatibility with internal linking
- Professional media analysis suitable for academic reference
- Include actionable insights and practical applications`;
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
					temperature: geminiParams.temperature,
					topP: geminiParams.topP,
					topK: geminiParams.topK,
					maxOutputTokens: geminiParams.maxOutputTokens
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
					temperature: geminiParams.temperature,
					topP: geminiParams.topP,
					topK: geminiParams.topK,
					maxOutputTokens: geminiParams.maxOutputTokens
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

		const duration = monitor.endTimer(operationId);
		monitor.logMetrics('gemini-search', duration, {
			queryLength: query.length,
			resultLength: result.length,
			researchMode: researchMode?.id
		});

		return result;
		} catch (error) {
			monitor.endTimer(operationId);
			logger.error('Gemini search failed', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Gemini search failed: ${errorMessage}`);
		}
	}

	async searchWeb(query: string, insertMode: 'replace' | 'append') {
		// Existing search functionality
		try {
			let result: string;

			switch (this.settings.provider) {
				case 'gemini':
					result = await this.searchWithGemini(query);
					break;
				case 'perplexity':
					result = await this.searchWithPerplexity(query);
					break;
				case 'tavily':
					result = await this.searchWithTavily(query);
					break;
				case 'exa':
					result = await this.searchWithExa(query);
					break;
				default:
					throw new Error(`Unknown provider: ${this.settings.provider}`);
			}

			this.insertResult(result, insertMode);
		} catch (error) {
			new Notice(`Search failed: ${error.message}`);
		}
	}

	async searchWithPerplexity(query: string): Promise<string> {
		if (!this.settings.perplexityApiKey) {
			throw new Error('Perplexity API key not configured');
		}

		// Validate API key format
		if (!this.settings.perplexityApiKey.startsWith('pplx-')) {
			throw new Error('Invalid Perplexity API key format. Must start with "pplx-"');
		}

		const logger = PluginLogger.getInstance();
		const performanceMonitor = PerformanceMonitor.getInstance();
		const operationId = `perplexity-search-${Date.now()}`;
		
		try {
			performanceMonitor.startTimer(operationId);
			logger.debug('Starting Perplexity search', { query });

			// Get current research mode config (excluding youtube for Perplexity)
			const currentMode = this.getCurrentResearchMode();
			let perplexityParams;
			let model: string;
			
			// YouTube mode doesn't support Perplexity, fall back to comprehensive
			if (currentMode === 'youtube') {
				perplexityParams = this.settings.researchModeConfigs.comprehensive.perplexityParams;
				model = this.settings.researchModeConfigs.comprehensive.perplexityModel;
			} else {
				perplexityParams = this.settings.researchModeConfigs[currentMode].perplexityParams;
				model = this.settings.researchModeConfigs[currentMode].perplexityModel;
			}

			// MIGRATION: Update old model names to new ones
			const modelMigration: Record<string, string> = {
				'llama-3.1-sonar-small-128k-online': 'sonar',
				'llama-3.1-sonar-large-128k-online': 'sonar-pro',
				'llama-3.1-sonar-huge-128k-online': 'sonar-pro',
				'llama-3.1-70b-instruct': 'sonar-reasoning',
				'llama-3.1-8b-instruct': 'sonar'
			};

			if (modelMigration[model]) {
				logger.info(`Migrating old model ${model} to ${modelMigration[model]}`);
				model = modelMigration[model];
				
				// Update the settings to avoid future migration
				if (currentMode === 'youtube') {
					this.settings.researchModeConfigs.comprehensive.perplexityModel = model as any;
				} else {
					(this.settings.researchModeConfigs[currentMode] as any).perplexityModel = model;
				}
				await this.saveSettings();
			}

			// Validate model name
			const validModels = ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-reasoning-pro', 'sonar-deep-research'];
			if (!validModels.includes(model)) {
				logger.warn(`Invalid model ${model}, falling back to sonar`);
				model = 'sonar';
			}

			// Prepare Perplexity API request - simplified for debugging
			const requestBody: Record<string, any> = {
				model: model,
				messages: [
					{
						role: 'user',
						content: query
					}
				],
				max_tokens: perplexityParams.max_tokens || 1000,
				temperature: perplexityParams.temperature || 0.7,
				return_citations: true,
				return_related_questions: false,
				return_images: false
			};

			logger.debug('Perplexity API request details', { 
				model, 
				currentMode,
				params: requestBody,
				apiKeyPrefix: this.settings.perplexityApiKey.substring(0, 8) + '...'
			});

			// Remove undefined fields
			Object.keys(requestBody).forEach(key => {
				if (requestBody[key] === undefined) {
					delete requestBody[key];
				}
			});

			logger.debug('Perplexity API request', { model, params: requestBody });

			const response = await requestUrl({
				url: 'https://api.perplexity.ai/chat/completions',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.settings.perplexityApiKey}`
				},
				body: JSON.stringify(requestBody)
			});

			const duration = performanceMonitor.endTimer(operationId);
			performanceMonitor.logMetrics('Perplexity Search', duration, {
				queryLength: query.length,
				model: model,
				maxTokens: perplexityParams.max_tokens
			});

			if (response.status !== 200) {
				logger.error('Perplexity API error', { 
					status: response.status, 
					statusText: response.text,
					headers: response.headers,
					requestBody: requestBody
				});
				throw new Error(`Perplexity search failed: Request failed, status ${response.status}. Response: ${response.text}`);
			}

			const result = response.json;
			logger.debug('Perplexity search results received', { 
				choices: result.choices?.length || 0,
				model: result.model 
			});

			// Format results for Obsidian
			let formattedResult = `# Perplexity Search Results\n\n**Query:** ${query}\n\n`;
			formattedResult += `**Model:** ${result.model || model}\n\n`;

			if (result.choices && result.choices.length > 0) {
				const choice = result.choices[0];
				
				if (choice.message && choice.message.content) {
					formattedResult += `## AI Response\n\n${choice.message.content}\n\n`;
				}

				// Include citations if available
				if (choice.citations && choice.citations.length > 0) {
					formattedResult += `## Sources\n\n`;
					choice.citations.forEach((citation: any, index: number) => {
						formattedResult += `${index + 1}. [${citation.title || citation.url}](${citation.url})\n`;
					});
					formattedResult += `\n`;
				}

				// Include related questions if available
				if (choice.related_questions && choice.related_questions.length > 0) {
					formattedResult += `## Related Questions\n\n`;
					choice.related_questions.forEach((question: string) => {
						formattedResult += `- ${question}\n`;
					});
					formattedResult += `\n`;
				}
			}

			// Add usage statistics if available
			if (result.usage) {
				formattedResult += `## Usage Statistics\n\n`;
				formattedResult += `- **Prompt Tokens:** ${result.usage.prompt_tokens || 'N/A'}\n`;
				formattedResult += `- **Completion Tokens:** ${result.usage.completion_tokens || 'N/A'}\n`;
				formattedResult += `- **Total Tokens:** ${result.usage.total_tokens || 'N/A'}\n\n`;
			}

			// Add metadata
			formattedResult += `\n---\n*Search performed using Perplexity API (${model}) on ${new Date().toISOString()}*\n`;

			logger.info('Perplexity search completed successfully', {
				duration: duration,
				model: result.model,
				tokensUsed: result.usage?.total_tokens || 0
			});

			return formattedResult;

		} catch (error) {
			const duration = performanceMonitor.endTimer(operationId);
			logger.error('Perplexity search failed', error);
			
			performanceMonitor.logMetrics('Perplexity Search (Failed)', duration, {
				error: error.message,
				queryLength: query.length
			});

			throw new Error(`Perplexity search failed: ${error.message}`);
		}
	}

	async searchWithTavily(query: string): Promise<string> {
		if (!this.settings.tavilyApiKey) {
			throw new Error('Tavily API key not configured');
		}

		const logger = PluginLogger.getInstance();
		const performanceMonitor = PerformanceMonitor.getInstance();
		const operationId = `tavily-search-${Date.now()}`;
		
		try {
			performanceMonitor.startTimer(operationId);
			logger.debug('Starting Tavily search', { query });

			// Prepare Tavily API request with actual parameters from API docs
			const requestBody: Record<string, any> = {
				api_key: this.settings.tavilyApiKey,
				query: query,
				search_depth: this.settings.tavilySearchDepth,
				include_answer: this.settings.tavilyIncludeAnswer,
				include_images: this.settings.tavilyIncludeImages,
				include_raw_content: this.settings.tavilyIncludeRawContent,
				max_results: this.settings.tavilyMaxResults,
				include_domains: this.settings.tavilyIncludeDomains ? this.settings.tavilyIncludeDomains.split(',').map(d => d.trim()) : undefined,
				exclude_domains: this.settings.tavilyExcludeDomains ? this.settings.tavilyExcludeDomains.split(',').map(d => d.trim()) : undefined,
				topic: this.settings.tavilyTopic,
				days: this.settings.tavilyDays
			};

			// Remove undefined fields to avoid API errors
			Object.keys(requestBody).forEach(key => {
				if (requestBody[key] === undefined) {
					delete requestBody[key];
				}
			});

			logger.debug('Tavily API request body', requestBody);

			const response = await requestUrl({
				url: 'https://api.tavily.com/search',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const duration = performanceMonitor.endTimer(operationId);
			performanceMonitor.logMetrics('Tavily Search', duration, {
				queryLength: query.length,
				maxResults: this.settings.tavilyMaxResults,
				searchDepth: this.settings.tavilySearchDepth
			});

			if (response.status !== 200) {
				throw new Error(`Tavily API error: ${response.status} - ${response.text}`);
			}

			const searchResults = response.json;
			logger.debug('Tavily search results received', { 
				resultsCount: searchResults.results?.length || 0,
				hasAnswer: !!searchResults.answer 
			});

			// Format results for Obsidian
			let formattedResult = `# Tavily Search Results\n\n**Query:** ${query}\n\n`;

			// Include the AI-generated answer if available
			if (searchResults.answer) {
				formattedResult += `## AI Summary\n\n${searchResults.answer}\n\n`;
			}

			// Format search results
			if (searchResults.results && searchResults.results.length > 0) {
				formattedResult += `## Search Results\n\n`;
				
				searchResults.results.forEach((result: any, index: number) => {
					formattedResult += `### ${index + 1}. ${result.title}\n\n`;
					if (result.url) {
						formattedResult += `**URL:** [${result.url}](${result.url})\n\n`;
					}
					if (result.content) {
						formattedResult += `**Content:** ${result.content}\n\n`;
					}
					if (result.score) {
						formattedResult += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%\n\n`;
					}
					formattedResult += `---\n\n`;
				});
			}

			// Include images if requested and available
			if (this.settings.tavilyIncludeImages && searchResults.images && searchResults.images.length > 0) {
				formattedResult += `## Related Images\n\n`;
				searchResults.images.forEach((image: any, index: number) => {
					if (image.url) {
						formattedResult += `![Image ${index + 1}](${image.url})\n\n`;
					}
				});
			}

			// Add metadata
			formattedResult += `\n---\n*Search performed using Tavily API on ${new Date().toISOString()}*\n`;

			logger.info('Tavily search completed successfully', {
				resultsCount: searchResults.results?.length || 0,
				duration: duration
			});

			return formattedResult;

		} catch (error) {
			const duration = performanceMonitor.endTimer(operationId);
			logger.error('Tavily search failed', error);
			
			performanceMonitor.logMetrics('Tavily Search (Failed)', duration, {
				error: error.message,
				queryLength: query.length
			});

			throw new Error(`Tavily search failed: ${error.message}`);
		}
	}

	async searchWithExa(query: string): Promise<string> {
		if (!this.settings.exaApiKey) {
			throw new Error('Exa API key not configured');
		}

		const logger = PluginLogger.getInstance();
		const performanceMonitor = PerformanceMonitor.getInstance();
		const operationId = `exa-search-${Date.now()}`;
		
		try {
			performanceMonitor.startTimer(operationId);
			logger.debug('Starting Exa search', { query });

			// Prepare Exa API request with actual parameters from API docs
			const requestBody: Record<string, any> = {
				query: query,
				type: this.settings.exaSearchType,
				numResults: this.settings.exaNumResults,
				includeDomains: this.settings.exaIncludeDomains ? this.settings.exaIncludeDomains.split(',').map(d => d.trim()) : undefined,
				excludeDomains: this.settings.exaExcludeDomains ? this.settings.exaExcludeDomains.split(',').map(d => d.trim()) : undefined,
				startCrawlDate: this.settings.exaStartCrawlDate || undefined,
				endCrawlDate: this.settings.exaEndCrawlDate || undefined,
				startPublishedDate: this.settings.exaStartPublishedDate || undefined,
				endPublishedDate: this.settings.exaEndPublishedDate || undefined,
				category: this.settings.exaCategory || undefined,
				useAutoprompt: this.settings.exaUseAutoprompt,
				
				// Content options
				contents: {
					text: this.settings.exaIncludeText,
					highlights: this.settings.exaIncludeHighlights
				}
			};

			// Remove undefined fields to avoid API errors
			Object.keys(requestBody).forEach(key => {
				if (requestBody[key] === undefined) {
					delete requestBody[key];
				}
			});

			// Clean up contents object
			if (requestBody.contents) {
				Object.keys(requestBody.contents).forEach(key => {
					if (requestBody.contents[key] === undefined) {
						delete requestBody.contents[key];
					}
				});
				if (Object.keys(requestBody.contents).length === 0) {
					delete requestBody.contents;
				}
			}

			logger.debug('Exa API request body', requestBody);

			const response = await requestUrl({
				url: 'https://api.exa.ai/search',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': this.settings.exaApiKey
				},
				body: JSON.stringify(requestBody)
			});

			const duration = performanceMonitor.endTimer(operationId);
			performanceMonitor.logMetrics('Exa Search', duration, {
				queryLength: query.length,
				numResults: this.settings.exaParams.numResults,
				searchType: this.settings.exaParams.type
			});

			if (response.status !== 200) {
				throw new Error(`Exa API error: ${response.status} - ${response.text}`);
			}

			const searchResults = response.json;
			logger.debug('Exa search results received', { 
				resultsCount: searchResults.results?.length || 0,
				searchType: searchResults.resolvedSearchType
			});

			// Format results for Obsidian
			let formattedResult = `# Exa Search Results\n\n**Query:** ${query}\n\n`;

			if (searchResults.resolvedSearchType) {
				formattedResult += `**Search Type:** ${searchResults.resolvedSearchType}\n\n`;
			}

			// Include context if available
			if (searchResults.context) {
				formattedResult += `## AI Context Summary\n\n${searchResults.context}\n\n`;
			}

			// Format search results
			if (searchResults.results && searchResults.results.length > 0) {
				formattedResult += `## Search Results\n\n`;
				
				searchResults.results.forEach((result: any, index: number) => {
					formattedResult += `### ${index + 1}. ${result.title}\n\n`;
					
					if (result.url) {
						formattedResult += `**URL:** [${result.url}](${result.url})\n\n`;
					}
					
					if (result.author) {
						formattedResult += `**Author:** ${result.author}\n\n`;
					}
					
					if (result.publishedDate) {
						const publishedDate = new Date(result.publishedDate).toLocaleDateString();
						formattedResult += `**Published:** ${publishedDate}\n\n`;
					}
					
					if (result.score) {
						formattedResult += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%\n\n`;
					}

					// Include content if available
					if (result.text) {
						formattedResult += `**Content:**\n${result.text}\n\n`;
					}

					// Include highlights if available
					if (result.highlights && result.highlights.length > 0) {
						formattedResult += `**Key Highlights:**\n`;
						result.highlights.forEach((highlight: string) => {
							formattedResult += `- ${highlight}\n`;
						});
						formattedResult += `\n`;
					}

					// Include summary if available
					if (result.summary) {
						formattedResult += `**Summary:** ${result.summary}\n\n`;
					}

					// Include subpages if available
					if (result.subpages && result.subpages.length > 0) {
						formattedResult += `**Related Pages:**\n`;
						result.subpages.slice(0, 3).forEach((subpage: any) => {
							formattedResult += `- [${subpage.title}](${subpage.url})\n`;
						});
						formattedResult += `\n`;
					}

					formattedResult += `---\n\n`;
				});
			}

			// Add cost information if available
			if (searchResults.costDollars) {
				formattedResult += `## Search Cost\n\n`;
				formattedResult += `**Total Cost:** $${searchResults.costDollars.total}\n\n`;
			}

			// Add metadata
			formattedResult += `\n---\n*Search performed using Exa API on ${new Date().toISOString()}*\n`;

			logger.info('Exa search completed successfully', {
				resultsCount: searchResults.results?.length || 0,
				duration: duration,
				cost: searchResults.costDollars?.total || 0
			});

			return formattedResult;

		} catch (error) {
			const duration = performanceMonitor.endTimer(operationId);
			logger.error('Exa search failed', error);
			
			performanceMonitor.logMetrics('Exa Search (Failed)', duration, {
				error: error.message,
				queryLength: query.length
			});

			throw new Error(`Exa search failed: ${error.message}`);
		}
	}

	insertResult(result: string, mode: 'replace' | 'append') {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			new Notice('No active markdown view');
			return;
		}

		const editor = activeView.editor;
		if (mode === 'replace') {
			editor.replaceSelection(result);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('\n\n' + result, cursor);
		}
	}

	// Method to prompt for custom search
	promptForCustomSearch(editor: Editor) {
		const query = prompt('Enter your search query:');
		if (query) {
			this.searchWeb(query, 'append');
		}
	}

	// Method to test Perplexity API
	async testPerplexityAPI() {
		try {
			const result = await this.searchWithPerplexity('test query');
			new Notice('Perplexity API test successful');
			console.log('Perplexity test result:', result);
		} catch (error) {
			new Notice(`Perplexity API test failed: ${error.message}`);
			console.error('Perplexity test error:', error);
		}
	}

	// Method to inject enhanced CSS
	injectEnhancedCSS() {
		const cssText = `
		/* Enhanced Settings CSS for AI Web Search Plugin */
		.gemini-settings-container {
			font-family: var(--font-interface);
			line-height: var(--line-height-normal);
		}
		
		/* Chat Container - Responsive and Theme-aware */
		.gemini-chat-container {
			display: flex;
			flex-direction: column;
			height: 100%;
			background: var(--background-primary);
			color: var(--text-normal);
			font-family: var(--font-interface);
		}
		
		/* Chat Header - Mobile-responsive */
		.gemini-chat-header {
			padding: var(--size-4-2) var(--size-4-3);
			border-bottom: 1px solid var(--background-modifier-border);
			background: var(--background-secondary);
			flex-shrink: 0;
		}
		
		.title-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: var(--size-4-1);
			flex-wrap: wrap;
			gap: var(--size-4-1);
		}
		
		.title-container h3 {
			margin: 0;
			font-size: var(--font-ui-medium);
			font-weight: var(--font-weight-medium);
			color: var(--text-normal);
		}
		
		/* New Chat Button - Touch-friendly */
		.new-chat-button {
			display: flex;
			align-items: center;
			gap: var(--size-2-1);
			padding: var(--size-2-1) var(--size-4-1);
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			border-radius: var(--radius-s);
			cursor: pointer;
			font-size: var(--font-ui-small);
			font-weight: var(--font-weight-medium);
			transition: all 0.2s ease;
			min-height: 32px; /* Touch-friendly minimum */
		}
		
		.new-chat-button:hover {
			background: var(--interactive-accent-hover);
			transform: translateY(-1px);
		}
		
		.new-chat-button svg {
			width: 14px;
			height: 14px;
			flex-shrink: 0;
		}
		
		/* Provider Container - Responsive */
		.provider-container {
			display: flex;
			align-items: center;
			gap: var(--size-2-2);
			flex-wrap: wrap;
		}
		
		.provider-label {
			font-size: var(--font-ui-small);
			color: var(--text-muted);
			font-weight: var(--font-weight-medium);
		}
		
		.provider-dropdown {
			padding: var(--size-2-1) var(--size-2-3);
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			color: var(--text-normal);
			font-size: var(--font-ui-small);
			min-width: 160px;
			cursor: pointer;
		}
		
		.provider-dropdown:focus {
			outline: 2px solid var(--interactive-accent);
			outline-offset: 2px;
		}
		
		/* Model Selection Container */
		.model-container {
			display: flex;
			align-items: center;
			gap: var(--size-2-2);
			margin-left: var(--size-4-2);
		}
		
		.model-label {
			font-size: var(--font-ui-small);
			color: var(--text-muted);
			font-weight: var(--font-weight-medium);
		}
		
		.model-dropdown {
			padding: var(--size-2-1) var(--size-2-3);
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			color: var(--text-normal);
			font-size: var(--font-ui-small);
			min-width: 200px;
			cursor: pointer;
		}
		
		.model-dropdown:focus {
			outline: 2px solid var(--interactive-accent);
			outline-offset: 2px;
		}
		
		/* Messages Container - Responsive and scrollable */
		.gemini-chat-messages {
			flex: 1;
			overflow-y: auto;
			padding: var(--size-4-2);
			scroll-behavior: smooth;
		}
		
		/* Message Styling - Improved readability */
		.message {
			margin-bottom: var(--size-4-3);
			padding: var(--size-4-2);
			border-radius: var(--radius-m);
			word-wrap: break-word;
			line-height: var(--line-height-normal);
		}
		
		.message.user {
			background: var(--background-modifier-form-field);
			border: 1px solid var(--background-modifier-border);
			margin-left: 10%;
		}
		
		.message.assistant {
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			margin-right: 10%;
		}
		
		.message.system {
			background: var(--background-modifier-success);
			border: 1px solid var(--color-green);
			text-align: center;
			font-style: italic;
			margin: var(--size-4-1) 20%;
		}
		
		/* Message Role Headers */
		.message-role, .message-role-header {
			font-weight: var(--font-weight-bold);
			font-size: var(--font-ui-small);
			color: var(--text-accent);
			margin-bottom: var(--size-2-2);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		
		/* Message Content - Responsive text */
		.message-content {
			font-size: max(var(--font-ui-medium), 16px); /* Minimum 16px for mobile */
			color: var(--text-normal);
			white-space: pre-wrap;
			word-break: break-word;
		}
		
		.message-content.selectable-text {
			user-select: text;
			-webkit-user-select: text;
		}
		
		/* Copy Button - Touch-friendly */
		.copy-button {
			background: var(--interactive-normal);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			padding: var(--size-2-1) var(--size-2-2);
			font-size: var(--font-ui-smaller);
			color: var(--text-muted);
			cursor: pointer;
			transition: all 0.2s ease;
			min-height: 28px;
			min-width: 60px;
		}
		
		.copy-button:hover {
			background: var(--interactive-hover);
			color: var(--text-normal);
		}
		
		/* Progress Bar - Smooth animations */
		.progress-container {
			margin: var(--size-2-2) 0;
		}
		
		.progress-bar {
			width: 100%;
			height: 4px;
			background: var(--background-modifier-border);
			border-radius: var(--radius-s);
			overflow: hidden;
		}
		
		.progress-bar-fill {
			height: 100%;
			background: var(--interactive-accent);
			transition: width 0.3s ease;
			border-radius: inherit;
		}
		
		.thinking-text {
			color: var(--text-muted);
			font-style: italic;
			margin-top: var(--size-2-2);
		}
		
		/* Input Container - Responsive and accessible */
		.gemini-chat-input-container {
			padding: var(--size-4-2);
			background: var(--background-primary);
			border-top: 1px solid var(--background-modifier-border);
			flex-shrink: 0;
		}
		
		.input-group {
			display: flex;
			flex-direction: column;
			gap: var(--size-2-3);
		}
		
		.gemini-chat-input {
			width: 100%;
			min-height: 60px;
			max-height: 200px;
			padding: var(--size-4-1) var(--size-4-2);
			background: var(--background-primary);
			border: 2px solid var(--background-modifier-border);
			border-radius: var(--radius-m);
			color: var(--text-normal);
			font-size: max(var(--font-ui-medium), 16px); /* Minimum 16px for mobile */
			font-family: var(--font-interface);
			resize: vertical;
			line-height: var(--line-height-normal);
		}
		
		.gemini-chat-input:focus {
			outline: none;
			border-color: var(--interactive-accent);
			box-shadow: 0 0 0 2px var(--interactive-accent-hover);
		}
		
		.gemini-chat-input::placeholder {
			color: var(--text-faint);
		}
		
		/* Button Group - Responsive layout */
		.button-group {
			display: flex;
			gap: var(--size-2-2);
			flex-wrap: wrap;
		}
		
		.send-button, .save-button {
			flex: 1;
			min-width: 100px;
			padding: var(--size-2-3) var(--size-4-2);
			border: none;
			border-radius: var(--radius-m);
			font-size: var(--font-ui-medium);
			font-weight: var(--font-weight-medium);
			cursor: pointer;
			transition: all 0.2s ease;
			min-height: 40px; /* Touch-friendly */
		}
		
		.send-button {
			background: var(--interactive-accent);
			color: var(--text-on-accent);
		}
		
		.send-button:hover {
			background: var(--interactive-accent-hover);
		}
		
		.save-button {
			background: var(--interactive-normal);
			color: var(--text-normal);
			border: 1px solid var(--background-modifier-border);
		}
		
		.save-button:hover {
			background: var(--interactive-hover);
		}
		
		/* Research Mode Buttons - Mobile-first responsive */
		.research-mode-container-bottom {
			margin-top: var(--size-4-2);
			padding-top: var(--size-4-1);
			border-top: 1px solid var(--background-modifier-border);
		}
		
		.research-mode-label-small {
			font-size: var(--font-ui-small);
			color: var(--text-muted);
			margin-bottom: var(--size-2-2);
			font-weight: var(--font-weight-medium);
		}
		
		.research-mode-buttons-bottom {
			display: flex;
			gap: var(--size-2-1);
			flex-wrap: wrap;
		}
		
		.research-mode-btn-small {
			flex: 1;
			min-width: calc(50% - var(--size-2-1)); /* 2 per row on mobile */
			padding: var(--size-2-1) var(--size-2-2);
			background: var(--background-secondary);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			color: var(--text-normal);
			font-size: max(var(--font-ui-small), 14px); /* Minimum readable size */
			font-weight: var(--font-weight-medium);
			cursor: pointer;
			transition: all 0.2s ease;
			text-align: center;
			min-height: 36px; /* Touch-friendly */
		}
		
		.research-mode-btn-small:hover {
			background: var(--interactive-hover);
			border-color: var(--interactive-accent);
		}
		
		.research-mode-btn-small.active {
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border-color: var(--interactive-accent);
		}
		
		/* Advanced Settings - Responsive tabs */
		.setting-section {
			margin-bottom: var(--size-4-3);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-m);
			overflow: hidden;
			background: var(--background-primary);
		}
		
		.advanced-tabs-container {
			display: flex;
			border-bottom: 1px solid var(--background-modifier-border);
			overflow-x: auto;
			scrollbar-width: none;
			-ms-overflow-style: none;
		}
		
		.advanced-tabs-container::-webkit-scrollbar {
			display: none;
		}
		
		.advanced-tab {
			flex: 1;
			min-width: 100px;
			padding: var(--size-4-1) var(--size-4-2);
			background: var(--background-secondary);
			border: none;
			cursor: pointer;
			transition: all 0.2s ease;
			font-size: var(--font-ui-medium);
			color: var(--text-normal);
			white-space: nowrap;
		}
		
		.advanced-tab:hover {
			background: var(--interactive-hover);
		}
		
		.advanced-tab.active {
			background: var(--background-primary);
			border-bottom: 2px solid var(--interactive-accent);
			color: var(--text-accent);
		}
		
		.advanced-content {
			padding: var(--size-4-3);
		}
		
		.settings-help-text {
			font-size: var(--font-ui-small);
			color: var(--text-muted);
			margin-top: var(--size-2-2);
			line-height: var(--line-height-normal);
		}
		
		/* Markdown Content Styling */
		.message-content h1, .message-content h2, .message-content h3 {
			color: var(--text-normal);
			margin: var(--size-4-2) 0 var(--size-2-3) 0;
			font-weight: var(--font-weight-bold);
		}
		
		.message-content h1 { font-size: var(--font-ui-large); }
		.message-content h2 { font-size: var(--font-ui-medium); }
		.message-content h3 { font-size: var(--font-ui-medium); }
		
		.message-content p {
			margin: var(--size-2-3) 0;
			line-height: var(--line-height-normal);
		}
		
		.message-content ul, .message-content ol {
			margin: var(--size-2-3) 0;
			padding-left: var(--size-4-4);
		}
		
		.message-content li {
			margin: var(--size-2-1) 0;
			line-height: var(--line-height-normal);
		}
		
		.message-content code {
			background: var(--background-modifier-border);
			padding: var(--size-2-1) var(--size-2-2);
			border-radius: var(--radius-s);
			font-family: var(--font-monospace);
			font-size: var(--font-ui-small);
			color: var(--text-normal);
		}
		
		.message-content pre {
			background: var(--background-modifier-border);
			padding: var(--size-4-2);
			border-radius: var(--radius-m);
			overflow-x: auto;
			margin: var(--size-4-2) 0;
		}
		
		.message-content .external-link {
			color: var(--text-accent);
			text-decoration: underline;
			text-decoration-color: var(--text-accent);
		}
		
		.message-content .external-link:hover {
			color: var(--text-accent-hover);
		}
		
		.message-content .citation-link {
			color: var(--text-accent);
			text-decoration: none;
			font-weight: var(--font-weight-medium);
			cursor: pointer;
		}
		
		.message-content .citation-link:hover {
			background: var(--background-modifier-hover);
			border-radius: var(--radius-s);
			padding: 0 var(--size-2-1);
		}
		
		/* Responsive Design - Mobile adjustments */
		@media (max-width: 768px) {
			.title-container {
				flex-direction: column;
				align-items: stretch;
				gap: var(--size-2-2);
			}
			
			.provider-container {
				justify-content: center;
				flex-direction: column;
				align-items: stretch;
			}
			
			.model-container {
				margin-left: 0;
				margin-top: var(--size-2-2);
			}
			
			.provider-dropdown,
			.model-dropdown {
				width: 100%;
			}
			
			.message.user {
				margin-left: 5%;
			}
			
			.message.assistant {
				margin-right: 5%;
			}
			
			.message.system {
				margin: var(--size-2-2) 10%;
			}
			
			.research-mode-btn-small {
				min-width: calc(100% - var(--size-2-1)); /* Full width on very small screens */
			}
			
			.button-group {
				flex-direction: column;
			}
			
			.send-button, .save-button {
				flex: none;
			}
		}
		
		/* Animation for clearing chat */
		.clearing {
			opacity: 0;
			transform: translateY(-10px);
			transition: all 0.2s ease;
		}
		
		/* Focus visible for accessibility */
		.research-mode-btn-small:focus-visible,
		.new-chat-button:focus-visible,
		.copy-button:focus-visible,
		.send-button:focus-visible,
		.save-button:focus-visible {
			outline: 2px solid var(--interactive-accent);
			outline-offset: 2px;
		}
		
		/* Custom Prompts Section Styling */
		.custom-prompts-section {
			margin: var(--size-4-3) 0;
			padding: var(--size-4-3);
			background: var(--background-secondary);
			border-radius: var(--radius-m);
			border: 1px solid var(--background-modifier-border);
		}
		
		.custom-prompts-section h4 {
			margin: 0 0 var(--size-4-2) 0;
			color: var(--text-normal);
			font-weight: var(--font-weight-bold);
		}
		
		.prompt-controls {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: var(--size-2-2);
			padding: var(--size-2-2) 0;
			border-top: 1px solid var(--background-modifier-border);
		}
		
		.prompt-char-count {
			font-size: var(--font-ui-smaller);
			color: var(--text-muted);
		}
		
		.prompt-preview-btn {
			padding: var(--size-2-1) var(--size-2-3);
			background: var(--interactive-normal);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			color: var(--text-normal);
			font-size: var(--font-ui-small);
			cursor: pointer;
			transition: all 0.2s ease;
		}
		
		.prompt-preview-btn:hover {
			background: var(--interactive-hover);
		}
		
		.prompt-preview-section {
			margin-top: var(--size-4-3);
			padding-top: var(--size-4-2);
			border-top: 1px solid var(--background-modifier-border);
		}
		
		.prompt-preview-section h5 {
			margin: 0 0 var(--size-2-3) 0;
			color: var(--text-normal);
		}
		
		.prompt-preview-section button {
			margin-right: var(--size-2-3);
			margin-bottom: var(--size-2-2);
		}
		
		.prompt-buttons {
			display: flex;
			flex-wrap: wrap;
			gap: var(--size-2-2);
		}
		
		.prompt-export-btn,
		.prompt-import-btn {
			padding: var(--size-2-1) var(--size-2-3);
			background: var(--interactive-normal);
			border: 1px solid var(--background-modifier-border);
			border-radius: var(--radius-s);
			color: var(--text-normal);
			font-size: var(--font-ui-small);
			cursor: pointer;
			transition: all 0.2s ease;
		}
		
		.prompt-export-btn:hover,
		.prompt-import-btn:hover {
			background: var(--interactive-hover);
		}
		
		.validation-results {
			margin-top: var(--size-2-3);
			padding: var(--size-2-3);
			background: var(--background-primary);
			border-radius: var(--radius-s);
			border: 1px solid var(--background-modifier-border);
		}
		
		.validation-item {
			margin: var(--size-2-1) 0;
			font-size: var(--font-ui-small);
			font-family: var(--font-monospace);
		}
		
		.validation-summary {
			margin-top: var(--size-2-3);
			padding: var(--size-2-2);
			background: var(--background-modifier-form-field);
			border-radius: var(--radius-s);
			font-size: var(--font-ui-medium);
		}
		
		.validation-tips {
			margin-top: var(--size-2-3);
			padding: var(--size-2-3);
			background: var(--background-secondary);
			border-radius: var(--radius-s);
			border-left: 3px solid var(--interactive-accent);
		}
		
		.validation-tips h6 {
			margin: 0 0 var(--size-2-2) 0;
			color: var(--text-normal);
			font-size: var(--font-ui-small);
		}
		
		.validation-tips ul {
			margin: 0;
			padding-left: var(--size-4-2);
		}
		
		.validation-tips li {
			margin: var(--size-2-1) 0;
			font-size: var(--font-ui-small);
			line-height: var(--line-height-normal);
		}
		
		.validation-tips code {
			background: var(--background-modifier-border);
			padding: var(--size-2-1);
			border-radius: var(--radius-s);
			font-family: var(--font-monospace);
		}
		
		.validation-success {
			margin-top: var(--size-2-3);
			font-weight: var(--font-weight-medium);
		}
		
		.prompt-preview-content {
			line-height: var(--line-height-normal);
		}
		
		.prompt-info {
			margin-top: var(--size-2-3);
			font-size: var(--font-ui-small);
		}
		
		.prompt-warning {
			font-weight: var(--font-weight-medium);
		}
		
		/* Template selector styling */
		.custom-prompts-section .setting-item:first-of-type {
			background: var(--background-modifier-form-field);
			padding: var(--size-2-3);
			border-radius: var(--radius-s);
			margin-bottom: var(--size-4-2);
		}
		
		/* Textarea styling for prompts */
		.custom-prompts-section textarea {
			font-family: var(--font-monospace) !important;
			font-size: var(--font-ui-small) !important;
			line-height: 1.4 !important;
			background: var(--background-primary) !important;
		}
		
		/* Responsive design for custom prompts */
		@media (max-width: 768px) {
			.prompt-controls {
				flex-direction: column;
				align-items: stretch;
				gap: var(--size-2-2);
			}
			
			.prompt-preview-btn {
				width: 100%;
				text-align: center;
			}
			
			.prompt-preview-section button {
				width: 100%;
				margin-right: 0;
			}
		}
		`;
		
		// Inject the CSS
		const style = document.createElement('style');
		style.textContent = cssText;
		document.head.appendChild(style);
	}
}

// Chat View Class with Enhanced Features
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
		return "AI Web Search Chat";
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

		// NEW: Model selection container
		const modelContainer = header.createEl('div', { cls: 'model-container' });
		modelContainer.createEl('span', { 
			text: 'Model: ',
			cls: 'model-label'
		});
		
		const modelDropdown = modelContainer.createEl('select', { cls: 'model-dropdown' });
		
		// Initialize model dropdown based on current provider
		this.updateModelDropdown(modelDropdown, this.plugin.settings.provider);

		// Provider change handler
		providerDropdown.addEventListener('change', async (e) => {
			const newProvider = (e.target as HTMLSelectElement).value as 'gemini' | 'perplexity' | 'tavily' | 'exa';
			this.plugin.settings.provider = newProvider;
			
			// Update model dropdown for new provider
			this.updateModelDropdown(modelDropdown, newProvider);
			
			// Handle special cases (YouTube mode)
			if (this.currentResearchMode?.id === 'youtube' && newProvider !== 'gemini') {
				new Notice('⚠️ YouTube mode requires Gemini provider');
				providerDropdown.value = 'gemini';
				this.plugin.settings.provider = 'gemini';
				this.updateModelDropdown(modelDropdown, 'gemini');
			}
			
			await this.plugin.saveSettings();
		});
		
		// Model change handler
		modelDropdown.addEventListener('change', async (e) => {
			const selectedModel = (e.target as HTMLSelectElement).value;
			await this.updateModelForCurrentMode(selectedModel);
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
		
		// Auto-resize textarea
		const autoResize = () => {
			textarea.style.height = 'auto';
			textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
		};
		
		textarea.addEventListener('input', autoResize);
		textarea.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.handleSend(textarea.value, false);
			}
		});
		
		// Initial resize
		autoResize();
	}

	async handleSend(message: string, insertToNote: boolean, saveToFolder: boolean = false) {
		if (!message.trim()) return;

		// Disable input while processing
		const textarea = this.inputContainer.querySelector('.gemini-chat-input') as HTMLTextAreaElement;
		const sendButton = this.inputContainer.querySelector('.send-button') as HTMLButtonElement;
		const saveButton = this.inputContainer.querySelector('.save-button') as HTMLButtonElement;
		
		const originalValue = textarea.value;
		textarea.value = '';
		textarea.disabled = true;
		sendButton.disabled = true;
		saveButton.disabled = true;

		// Add user message
		this.addMessage('user', message);

		// Check if we should use search mode or chat mode
		const provider = this.plugin.settings.provider;
		const isSearchMode = this.plugin.settings.providerSearchModes?.[provider] ?? true;
		
		let thinkingMessage = 'Thinking...';
		if (isSearchMode) {
			thinkingMessage = `Searching the web with ${provider}...`;
		} else {
			thinkingMessage = `Chatting with ${provider}...`;
		}
		
		const thinkingId = this.addMessage('assistant', thinkingMessage, true);

		// Handle special YouTube mode validation
		if (this.currentResearchMode?.requiresUrl && !this.isValidYouTubeUrl(message) && !this.currentVideoContext) {
			const errorMessage = '❌ YouTube mode requires a valid YouTube URL. Please paste a YouTube video URL first.';
			this.updateMessage(thinkingId, errorMessage);
			return;
		}

		try {
			let response: string;
			
			if (isSearchMode) {
				// Use web search
				response = await this.plugin.performWebSearch(message);
			} else {
				// Use chat mode with context
				if (provider === 'gemini') {
					response = await this.plugin.performGeminiChat(message, this.getChatHistory());
				} else if (provider === 'perplexity') {
					response = await this.plugin.performPerplexityChat(message, this.getChatHistory());
				} else {
					// Fallback to search for Tavily/Exa
					response = await this.plugin.performWebSearch(message);
				}
			}
			
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
			const errorMessage = `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
			this.updateMessage(thinkingId, errorMessage);
			
			// Restore input on error
			textarea.value = originalValue;
		} finally {
			// Re-enable input
			textarea.disabled = false;
			sendButton.disabled = false;
			saveButton.disabled = false;
			textarea.focus();
		}
	}

	// Get chat history for context in chat mode
	getChatHistory(): Array<{role: string, content: string}> {
		if (!this.plugin.settings.contextMemoryEnabled) {
			return [];
		}

		const messages: Array<{role: string, content: string}> = [];
		const messageElements = this.messageContainer.querySelectorAll('.chat-message');
		
		messageElements.forEach(element => {
			const role = element.getAttribute('data-role');
			const content = element.querySelector('.message-content')?.textContent || '';
			
			// Filter out system messages and thinking/loading messages
			if (role && content && role !== 'system' && 
				!content.includes('Searching the web...') && 
				!content.includes('Thinking...') &&
				!content.includes('Analyzing YouTube video...')) {
				messages.push({
					role: role === 'user' ? 'user' : 'assistant',
					content: content
				});
			}
		});
		
		// Apply context memory strategy
		switch (this.plugin.settings.contextMemoryStrategy) {
			case 'recent':
				return messages.slice(-this.plugin.settings.maxContextMessages);
			
			case 'token-limit':
				// Rough token estimation: ~4 chars per token
				const tokenLimit = this.plugin.settings.maxContextMessages * 100; // Convert to approximate token limit
				let currentTokens = 0;
				const limitedMessages = [];
				
				for (let i = messages.length - 1; i >= 0; i--) {
					const messageTokens = Math.ceil(messages[i].content.length / 4);
					if (currentTokens + messageTokens > tokenLimit) break;
					
					currentTokens += messageTokens;
					limitedMessages.unshift(messages[i]);
				}
				
				return limitedMessages;
			
			case 'summary':
				// Implement summarization logic: keep first and last messages, summarize middle
				if (messages.length <= this.plugin.settings.maxContextMessages) {
					return messages;
				}
				
				const firstMessage = messages[0];
				const lastMessages = messages.slice(-Math.floor(this.plugin.settings.maxContextMessages / 2));
				const middleMessages = messages.slice(1, -(Math.floor(this.plugin.settings.maxContextMessages / 2)));
				
				// Create summary of middle messages
				const summaryContent = middleMessages.map(msg => 
					`${msg.role}: ${msg.content.substring(0, 100)}...`
				).join('\n');
				
				const summaryMessage = {
					role: 'system',
					content: `[Context Summary] Previous conversation included:\n${summaryContent}`
				};
				
				return [firstMessage, summaryMessage, ...lastMessages];
			
			default:
				return messages.slice(-this.plugin.settings.maxContextMessages);
		}
	}

	setResearchMode(mode: {id: string, label: string, description: string, model: string, perplexityModel: string, exaSearchType: 'auto' | 'neural' | 'keyword' | 'fast', exaCategory: string, providerLock?: string, requiresUrl?: boolean}) {
		this.currentResearchMode = mode;
		
		// Update model dropdown when research mode changes
		const modelDropdown = this.containerEl.querySelector('.model-dropdown') as HTMLSelectElement;
		if (modelDropdown) {
			this.updateModelDropdown(modelDropdown, this.plugin.settings.provider);
		}
		
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
				
				// Update model dropdown after provider change
				if (modelDropdown) {
					this.updateModelDropdown(modelDropdown, 'gemini');
				}
				
				new Notice('🎬 Switched to Gemini provider for YouTube video analysis');
			}
			
			// Set model to gemini-2.5-pro (best for video analysis)
			this.plugin.settings.geminiModel = 'gemini-2.5-pro';
			this.plugin.saveSettings();
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

	// NEW: Update model dropdown based on provider and research mode
	updateModelDropdown(dropdown: HTMLSelectElement, provider: string) {
		dropdown.empty();
		
		const modelOptions = this.getAvailableModels(provider, this.currentResearchMode?.id);
		
		modelOptions.forEach(model => {
			const option = dropdown.createEl('option', { 
				value: model.id, 
				text: model.displayName 
			});
			
			// Set current selected model
			if (this.isCurrentModel(model.id, provider)) {
				option.selected = true;
			}
		});
	}

	// NEW: Get available models for provider + research mode
	getAvailableModels(provider: string, researchMode?: string) {
		const models: Array<{id: string, displayName: string, compatible: string[]}> = [];
		
		switch (provider) {
			case 'gemini':
				models.push(
					{ id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro (Best Quality)', compatible: ['comprehensive', 'deep', 'reasoning', 'youtube'] },
					{ id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash (Balanced)', compatible: ['quick', 'comprehensive', 'deep'] },
					{ id: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash Lite (Fastest)', compatible: ['quick'] }
				);
				break;
				
		case 'perplexity':
			models.push(
				{ id: 'sonar-reasoning-pro', displayName: 'Sonar Reasoning Pro (Advanced)', compatible: ['reasoning', 'deep'] },
				{ id: 'sonar-pro', displayName: 'Sonar Pro (Advanced Search)', compatible: ['comprehensive', 'deep'] },
				{ id: 'sonar', displayName: 'Sonar (Standard)', compatible: ['quick', 'comprehensive'] },
				{ id: 'sonar-deep-research', displayName: 'Sonar Deep Research (Exhaustive)', compatible: ['deep'] },
				{ id: 'sonar-reasoning', displayName: 'Sonar Reasoning (Fast)', compatible: ['reasoning'] }
			);
			break;			case 'tavily':
				// Tavily doesn't have model selection, just search depth
				models.push({ id: 'tavily-search', displayName: 'Tavily Search', compatible: ['quick', 'comprehensive', 'deep'] });
				break;
				
			case 'exa':
				// Exa uses search types instead of models
				models.push({ id: 'exa-neural', displayName: 'Neural Search', compatible: ['comprehensive', 'deep', 'reasoning'] });
				break;
		}
		
		// Filter by research mode compatibility
		if (researchMode) {
			return models.filter(model => model.compatible.includes(researchMode));
		}
		
		return models;
	}

	// NEW: Check if model is currently selected
	isCurrentModel(modelId: string, provider: string): boolean {
		const mode = this.currentResearchMode?.id;
		if (!mode) return false;
		
		const modeConfig = this.plugin.settings.researchModeConfigs[mode as keyof GeminiWebSearchSettings['researchModeConfigs']];
		
		switch (provider) {
			case 'gemini':
				return modeConfig.geminiModel === modelId;
			case 'perplexity':
				return (modeConfig as any).perplexityModel === modelId;
			default:
				return false;
		}
	}

	// NEW: Update model for current research mode
	async updateModelForCurrentMode(modelId: string) {
		const provider = this.plugin.settings.provider;
		const mode = this.currentResearchMode?.id;
		
		if (!mode) return;
		
		// Validate model compatibility
		const availableModels = this.getAvailableModels(provider, mode);
		const selectedModel = availableModels.find(m => m.id === modelId);
		
		if (!selectedModel) {
			new Notice(`⚠️ Model ${modelId} not compatible with ${mode} mode`);
			return;
		}
		
		// Update research mode config
		const modeKey = mode as keyof GeminiWebSearchSettings['researchModeConfigs'];
		switch (provider) {
			case 'gemini':
				this.plugin.settings.researchModeConfigs[modeKey].geminiModel = modelId as any;
				break;
			case 'perplexity':
				(this.plugin.settings.researchModeConfigs[modeKey] as any).perplexityModel = modelId;
				break;
		}
		
		await this.plugin.saveSettings();
		new Notice(`✅ Updated ${mode} mode to use ${selectedModel.displayName}`);
	}

	addMessage(role: 'user' | 'assistant' | 'system', content: string, isThinking: boolean = false): string {
		const messageId = Date.now().toString();
		const messageDiv = this.messageContainer.createEl('div', { 
			cls: `message ${role}`,
			attr: { 'data-id': messageId, 'data-role': role }
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
			
			// Add progress bar for thinking messages
			const progressContainer = contentDiv.createEl('div', { cls: 'progress-container' });
			const progressBar = progressContainer.createEl('div', { cls: 'progress-bar' });
			const progressFill = progressBar.createEl('div', { cls: 'progress-bar-fill' });
			
			// Create thinking text container
			const thinkingText = contentDiv.createEl('div', { cls: 'thinking-text' });
			thinkingText.textContent = content;
			
			// Animate progress bar
			let progress = 0;
			const progressInterval = setInterval(() => {
				progress += Math.random() * 15;
				if (progress >= 90) {
					progress = 90; // Never reach 100% until actual completion
					clearInterval(progressInterval);
				}
				progressFill.style.width = `${progress}%`;
			}, 200);
			
			// Store interval ID for cleanup
			messageDiv.setAttribute('data-progress-interval', progressInterval.toString());
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
			// Clear any progress interval
			const intervalId = messageEl.getAttribute('data-progress-interval');
			if (intervalId) {
				clearInterval(parseInt(intervalId));
			}
			
			const contentEl = messageEl.querySelector('.message-content') as HTMLElement;
			if (contentEl) {
				contentEl.removeClass('thinking');
				contentEl.addClass('selectable-text');
				
				// Complete progress bar if it exists
				const progressFill = contentEl.querySelector('.progress-bar-fill') as HTMLElement;
				if (progressFill) {
					progressFill.style.width = '100%';
					setTimeout(() => {
						// Clear progress container and render new content
						const progressContainer = contentEl.querySelector('.progress-container');
						if (progressContainer) {
							progressContainer.remove();
						}
						const thinkingText = contentEl.querySelector('.thinking-text');
						if (thinkingText) {
							thinkingText.remove();
						}
						
						// Render markdown for AI responses
						this.renderMarkdownContent(contentEl, newContent);
						
						// Auto-scroll to bottom
						this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
					}, 300);
				} else {
					// Render markdown for AI responses
					this.renderMarkdownContent(contentEl, newContent);
					
					// Auto-scroll to bottom
					this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
				}
				
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
		html = html.replace(/\[(\d+)\]/g, '<a href="#citation-$1" class="citation-link" onclick="this.closest(\'\.message-content\').querySelector(\'h4:contains(Sources), strong:contains(Sources)\')?.scrollIntoView({behavior: \'smooth\', block: \'center\'})">[$1]</a>');
		
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

	// YouTube URL validation helper
	isValidYouTubeUrl(url: string): boolean {
		const youtubeRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
		return youtubeRegex.test(url.trim());
	}

	extractYouTubeVideoId(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return match ? match[1] : null;
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

	async onClose() {
		// Clean up
	}
}

// Simple Search Modal Implementation
class SearchModal {
	app: App;
	plugin: GeminiWebSearchPlugin;

	constructor(app: App, plugin: GeminiWebSearchPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	open() {
		new Notice('Search modal coming soon...');
	}
}

// Settings Tab Implementation
class GeminiSettingTab extends PluginSettingTab {
	plugin: GeminiWebSearchPlugin;

	constructor(app: App, plugin: GeminiWebSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'AI Web Search Settings' });

		// Provider selection
		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('Choose your preferred AI provider')
			.addDropdown(dropdown => dropdown
				.addOption('gemini', 'Google Gemini')
				.addOption('perplexity', 'Perplexity AI')
				.addOption('tavily', 'Tavily')
				.addOption('exa', 'Exa')
				.setValue(this.plugin.settings.provider)
				.onChange(async (value: 'gemini' | 'perplexity' | 'tavily' | 'exa') => {
					this.plugin.settings.provider = value;
					await this.plugin.saveSettings();
				}));

		// API Keys
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Enter your Google AI Studio API key')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Perplexity API Key')
			.setDesc('Enter your Perplexity API key')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.perplexityApiKey)
				.onChange(async (value) => {
					this.plugin.settings.perplexityApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Tavily API Key')
			.setDesc('Enter your Tavily API key')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.tavilyApiKey)
				.onChange(async (value) => {
					this.plugin.settings.tavilyApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Exa API Key')
			.setDesc('Enter your Exa API key')
			.addText(text => text
				.setPlaceholder('Enter API key')
				.setValue(this.plugin.settings.exaApiKey)
				.onChange(async (value) => {
					this.plugin.settings.exaApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Insert mode
		new Setting(containerEl)
			.setName('Insert Mode')
			.setDesc('How to insert search results')
			.addDropdown(dropdown => dropdown
				.addOption('replace', 'Replace Selection')
				.addOption('append', 'Append to Document')
				.setValue(this.plugin.settings.insertMode)
				.onChange(async (value: 'replace' | 'append') => {
					this.plugin.settings.insertMode = value;
					await this.plugin.saveSettings();
				}));

		// Max results
		new Setting(containerEl)
			.setName('Max Results')
			.setDesc('Maximum number of search results')
			.addSlider(slider => slider
				.setLimits(1, 20, 1)
				.setValue(this.plugin.settings.maxResults)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxResults = value;
					await this.plugin.saveSettings();
				}));

		// Include images
		new Setting(containerEl)
			.setName('Include Images')
			.setDesc('Include images in search results when supported')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeImages)
				.onChange(async (value) => {
					this.plugin.settings.includeImages = value;
					await this.plugin.saveSettings();
				}));

		// Custom Prompts Section - Progressive Disclosure
		containerEl.createEl('h3', { text: 'Custom Prompts' });
		
		// Enable Custom Prompts Toggle
		new Setting(containerEl)
			.setName('Enable Custom Prompts')
			.setDesc('Use your own custom prompts instead of built-in optimized prompts')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCustomPrompts)
				.onChange(async (value) => {
					this.plugin.settings.enableCustomPrompts = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide custom prompt settings
				}));

		// Show custom prompt settings if enabled
		if (this.plugin.settings.enableCustomPrompts) {
			this.addCustomPromptsSettings(containerEl);
		}

		// Advanced Settings Toggle
		new Setting(containerEl)
			.setName('Show Advanced Settings')
			.setDesc('Show provider-specific advanced configuration options')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.uiPreferences.showAdvancedSettings)
				.onChange(async (value) => {
					this.plugin.settings.uiPreferences.showAdvancedSettings = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh the settings page
				}));

		// Show advanced settings if enabled
		if (this.plugin.settings.uiPreferences.showAdvancedSettings) {
			const advancedContainer = containerEl.createDiv('advanced-settings-container');
			advancedContainer.createEl('h3', { text: 'Advanced Provider Settings' });
			
			const tabContainer = advancedContainer.createDiv('advanced-tabs-container');
			const content = advancedContainer.createDiv('advanced-content');
			
			// Create tabs for each provider
			const tabs = [
				{ id: 'gemini', label: 'Gemini', method: () => this.addGeminiAdvancedSettings(content) },
				{ id: 'perplexity', label: 'Perplexity', method: () => this.addPerplexityAdvancedSettings(content) },
				{ id: 'tavily', label: 'Tavily', method: () => this.addTavilyAdvancedSettings(content) },
				{ id: 'exa', label: 'Exa', method: () => this.addExaAdvancedSettings(content) }
			];
			
			tabs.forEach((tab, index) => {
				const tabButton = tabContainer.createEl('button', {
					text: tab.label,
					cls: index === 0 ? 'advanced-tab active' : 'advanced-tab'
				});
				
				tabButton.onclick = () => {
					// Remove active class from all tabs
					tabContainer.querySelectorAll('.advanced-tab').forEach(t => t.removeClass('active'));
					// Add active class to clicked tab
					tabButton.addClass('active');
					// Clear content and show selected tab
					content.empty();
					tab.method();
				};
			});
			
			// Show first tab by default
			tabs[0].method();
		}
	}

	addGeminiAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Gemini Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Configure advanced Gemini model parameters for fine-tuned responses. These settings affect all research modes.',
			cls: 'settings-help-text'
		});

		// Model Selection for Gemini
		new Setting(containerEl)
			.setName('Gemini Model')
			.setDesc('Choose the Gemini model variant (affects cost and capabilities)')
			.addDropdown(dropdown => dropdown
				.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Best Quality)')
				.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Balanced)')
				.addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite (Fastest)')
				.setValue(this.plugin.settings.geminiModel || 'gemini-2.5-flash')
				.onChange(async (value: string) => {
					this.plugin.settings.geminiModel = value;
					// Update all research mode configs
					const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
					modes.forEach(mode => {
						if (this.plugin.settings.researchModeConfigs[mode]) {
							this.plugin.settings.researchModeConfigs[mode].geminiModel = value as any;
						}
					});
					await this.plugin.saveSettings();
				}));

		// Temperature Slider
		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls randomness: 0.0 = focused, 2.0 = creative (Default: 0.7)')
			.addSlider(slider => slider
				.setLimits(0, 200, 5) // 0-2.0 with 0.05 steps
				.setValue((this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.temperature || 0.7) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					const temperature = value / 100;
					// Update all research mode configs
					const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
					modes.forEach(mode => {
						if (this.plugin.settings.researchModeConfigs[mode]?.geminiParams) {
							this.plugin.settings.researchModeConfigs[mode].geminiParams.temperature = temperature;
						}
					});
					await this.plugin.saveSettings();
				}));

		// Top P Slider  
		new Setting(containerEl)
			.setName('Top P (Nucleus Sampling)')
			.setDesc('Cumulative probability cutoff: 0.1 = conservative, 1.0 = diverse (Default: 0.8)')
			.addSlider(slider => slider
				.setLimits(10, 100, 5) // 0.1-1.0 with 0.05 steps
				.setValue((this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.topP || 0.8) * 100)
				.setDynamicTooltip()
				.onChange(async (value) => {
					const topP = value / 100;
					const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
					modes.forEach(mode => {
						if (this.plugin.settings.researchModeConfigs[mode]?.geminiParams) {
							this.plugin.settings.researchModeConfigs[mode].geminiParams.topP = topP;
						}
					});
					await this.plugin.saveSettings();
				}));

		// Top K Slider
		new Setting(containerEl)
			.setName('Top K')
			.setDesc('Limits vocabulary to top K tokens: 1 = restrictive, 100 = diverse (Default: 40)')
			.addSlider(slider => slider
				.setLimits(1, 100, 1)
				.setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.topK || 40)
				.setDynamicTooltip()
				.onChange(async (value) => {
					const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
					modes.forEach(mode => {
						if (this.plugin.settings.researchModeConfigs[mode]?.geminiParams) {
							this.plugin.settings.researchModeConfigs[mode].geminiParams.topK = value;
						}
					});
					await this.plugin.saveSettings();
				}));

		// Max Output Tokens
		new Setting(containerEl)
			.setName('Max Output Tokens')
			.setDesc('Maximum response length: 256 = short, 8192 = very long (Default: 2048)')
			.addSlider(slider => slider
				.setLimits(256, 8192, 256)
				.setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.maxOutputTokens || 2048)
				.setDynamicTooltip()
				.onChange(async (value) => {
					const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
					modes.forEach(mode => {
						if (this.plugin.settings.researchModeConfigs[mode]?.geminiParams) {
							this.plugin.settings.researchModeConfigs[mode].geminiParams.maxOutputTokens = value;
						}
					});
					await this.plugin.saveSettings();
				}));

		// Safety Settings
		containerEl.createEl('h6', { text: 'Content Safety Settings' });
		containerEl.createEl('p', { 
			text: 'Configure content filtering levels for different harm categories.',
			cls: 'settings-help-text'
		});

		const safetyCategories = [
			{ key: 'harassment', name: 'Harassment', desc: 'Malicious comments targeting identity/protected attributes' },
			{ key: 'hateSpeech', name: 'Hate Speech', desc: 'Content that promotes hatred toward groups' },
			{ key: 'sexuallyExplicit', name: 'Sexually Explicit', desc: 'Contains sexual or erotic content' },
			{ key: 'dangerousContent', name: 'Dangerous Content', desc: 'Promotes harmful or illegal activities' }
		];

		safetyCategories.forEach(category => {
			new Setting(containerEl)
				.setName(category.name)
				.setDesc(category.desc)
				.addDropdown(dropdown => dropdown
					.addOption('BLOCK_NONE', 'None - Allow all content')
					.addOption('BLOCK_ONLY_HIGH', 'High - Block only high-confidence harmful content')
					.addOption('BLOCK_MEDIUM_AND_ABOVE', 'Medium+ - Block medium and high harmful content (Default)')
					.addOption('BLOCK_LOW_AND_ABOVE', 'Low+ - Block low, medium, and high harmful content')
					.setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiSafety[category.key as keyof typeof this.plugin.settings.researchModeConfigs.comprehensive.geminiSafety] || 'BLOCK_MEDIUM_AND_ABOVE')
					.onChange(async (value: any) => {
						const modes = ['quick', 'comprehensive', 'deep', 'reasoning', 'youtube'] as const;
						modes.forEach(mode => {
							if (this.plugin.settings.researchModeConfigs[mode]?.geminiSafety) {
								(this.plugin.settings.researchModeConfigs[mode].geminiSafety as any)[category.key] = value;
							}
						});
						await this.plugin.saveSettings();
					}));
		});
	}

	addPerplexityAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Perplexity Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Control Perplexity search depth and response characteristics.',
			cls: 'settings-help-text'
		});

		// Model selection
		new Setting(containerEl)
			.setName('Perplexity Model')
			.setDesc('Choose Perplexity AI model')
			.addDropdown(dropdown => {
				dropdown
					.addOption('sonar-reasoning-pro', 'Sonar Reasoning Pro (Advanced)')
					.addOption('sonar-pro', 'Sonar Pro (Advanced Search)')
					.addOption('sonar', 'Sonar (Standard)')
					.addOption('sonar-deep-research', 'Sonar Deep Research (Exhaustive)')
					.addOption('sonar-reasoning', 'Sonar Reasoning (Fast)')
					.setValue(this.plugin.settings.perplexityModel || 'sonar-pro')
					.onChange(async (value) => {
						this.plugin.settings.perplexityModel = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							if ((this.plugin.settings.researchModeConfigs[mode] as any).perplexityModel) {
								(this.plugin.settings.researchModeConfigs[mode] as any).perplexityModel = value;
							}
						});
						await this.plugin.saveSettings();
					});
			});

		// Temperature setting
		const tempContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const tempInfo = tempContainer.createEl('div', { cls: 'setting-item-info' });
		tempInfo.createEl('div', { cls: 'setting-item-name', text: 'Temperature' });
		const tempDesc = tempInfo.createEl('div', { cls: 'setting-item-description' });
		const currentTemp = (this.plugin.settings as any).perplexityTemperature || 0.2;
		tempDesc.textContent = `Creativity level (0.0-2.0). Current: ${currentTemp}`;
		
		const tempControl = tempContainer.createEl('div', { cls: 'setting-item-control' });
		const tempSlider = tempControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '0',
				max: '2.0',
				step: '0.1',
				value: currentTemp.toString()
			}
		});
		
		tempSlider.addEventListener('input', async (e) => {
			const value = parseFloat((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityTemperature = value;
			tempDesc.textContent = `Creativity level (0.0-2.0). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityTemperature = value;
			});
			await this.plugin.saveSettings();
		});

		// Max Tokens setting
		const maxTokensContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const maxTokensInfo = maxTokensContainer.createEl('div', { cls: 'setting-item-info' });
		maxTokensInfo.createEl('div', { cls: 'setting-item-name', text: 'Max Tokens' });
		const maxTokensDesc = maxTokensInfo.createEl('div', { cls: 'setting-item-description' });
		const currentMaxTokens = (this.plugin.settings as any).perplexityMaxTokens || 1024;
		maxTokensDesc.textContent = `Maximum response length (256-4096). Current: ${currentMaxTokens}`;
		
		const maxTokensControl = maxTokensContainer.createEl('div', { cls: 'setting-item-control' });
		const maxTokensSlider = maxTokensControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '256',
				max: '4096',
				step: '64',
				value: currentMaxTokens.toString()
			}
		});
		
		maxTokensSlider.addEventListener('input', async (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityMaxTokens = value;
			maxTokensDesc.textContent = `Maximum response length (256-4096). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityMaxTokens = value;
			});
			await this.plugin.saveSettings();
		});

		// Top P setting
		const topPContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const topPInfo = topPContainer.createEl('div', { cls: 'setting-item-info' });
		topPInfo.createEl('div', { cls: 'setting-item-name', text: 'Top P' });
		const topPDesc = topPInfo.createEl('div', { cls: 'setting-item-description' });
		const currentTopP = (this.plugin.settings as any).perplexityTopP || 1.0;
		topPDesc.textContent = `Nucleus sampling (0.1-1.0). Current: ${currentTopP}`;
		
		const topPControl = topPContainer.createEl('div', { cls: 'setting-item-control' });
		const topPSlider = topPControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '0.1',
				max: '1.0',
				step: '0.05',
				value: currentTopP.toString()
			}
		});
		
		topPSlider.addEventListener('input', async (e) => {
			const value = parseFloat((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityTopP = value;
			topPDesc.textContent = `Nucleus sampling (0.1-1.0). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityTopP = value;
			});
			await this.plugin.saveSettings();
		});

		// Top K setting  
		const topKContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const topKInfo = topKContainer.createEl('div', { cls: 'setting-item-info' });
		topKInfo.createEl('div', { cls: 'setting-item-name', text: 'Top K' });
		const topKDesc = topKInfo.createEl('div', { cls: 'setting-item-description' });
		const currentTopK = (this.plugin.settings as any).perplexityTopK || 0;
		topKDesc.textContent = `Vocabulary limitation (0-100). Current: ${currentTopK}`;
		
		const topKControl = topKContainer.createEl('div', { cls: 'setting-item-control' });
		const topKSlider = topKControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '0',
				max: '100',
				step: '5',
				value: currentTopK.toString()
			}
		});
		
		topKSlider.addEventListener('input', async (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityTopK = value;
			topKDesc.textContent = `Vocabulary limitation (0-100, 0=disabled). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityTopK = value;
			});
			await this.plugin.saveSettings();
		});

		// Frequency Penalty setting
		const freqPenaltyContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const freqPenaltyInfo = freqPenaltyContainer.createEl('div', { cls: 'setting-item-info' });
		freqPenaltyInfo.createEl('div', { cls: 'setting-item-name', text: 'Frequency Penalty' });
		const freqPenaltyDesc = freqPenaltyInfo.createEl('div', { cls: 'setting-item-description' });
		const currentFreqPenalty = (this.plugin.settings as any).perplexityFrequencyPenalty || 0;
		freqPenaltyDesc.textContent = `Reduce repetition (-2.0 to 2.0). Current: ${currentFreqPenalty}`;
		
		const freqPenaltyControl = freqPenaltyContainer.createEl('div', { cls: 'setting-item-control' });
		const freqPenaltySlider = freqPenaltyControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '-2.0',
				max: '2.0',
				step: '0.1',
				value: currentFreqPenalty.toString()
			}
		});
		
		freqPenaltySlider.addEventListener('input', async (e) => {
			const value = parseFloat((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityFrequencyPenalty = value;
			freqPenaltyDesc.textContent = `Reduce repetition (-2.0 to 2.0). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityFrequencyPenalty = value;
			});
			await this.plugin.saveSettings();
		});

		// Presence Penalty setting
		const presencePenaltyContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const presencePenaltyInfo = presencePenaltyContainer.createEl('div', { cls: 'setting-item-info' });
		presencePenaltyInfo.createEl('div', { cls: 'setting-item-name', text: 'Presence Penalty' });
		const presencePenaltyDesc = presencePenaltyInfo.createEl('div', { cls: 'setting-item-description' });
		const currentPresencePenalty = (this.plugin.settings as any).perplexityPresencePenalty || 0;
		presencePenaltyDesc.textContent = `Encourage new topics (-2.0 to 2.0). Current: ${currentPresencePenalty}`;
		
		const presencePenaltyControl = presencePenaltyContainer.createEl('div', { cls: 'setting-item-control' });
		const presencePenaltySlider = presencePenaltyControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '-2.0',
				max: '2.0',
				step: '0.1',
				value: currentPresencePenalty.toString()
			}
		});
		
		presencePenaltySlider.addEventListener('input', async (e) => {
			const value = parseFloat((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).perplexityPresencePenalty = value;
			presencePenaltyDesc.textContent = `Encourage new topics (-2.0 to 2.0). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).perplexityPresencePenalty = value;
			});
			await this.plugin.saveSettings();
		});

		// Return citations toggle
		new Setting(containerEl)
			.setName('Return Citations')
			.setDesc('Include source citations in responses')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).perplexityReturnCitations ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).perplexityReturnCitations = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).perplexityReturnCitations = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Return images toggle
		new Setting(containerEl)
			.setName('Return Images')
			.setDesc('Include images in search results when available')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).perplexityReturnImages ?? false)
					.onChange(async (value) => {
						(this.plugin.settings as any).perplexityReturnImages = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).perplexityReturnImages = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Return related questions toggle
		new Setting(containerEl)
			.setName('Return Related Questions')
			.setDesc('Include suggested follow-up questions')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).perplexityReturnRelated ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).perplexityReturnRelated = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).perplexityReturnRelated = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Search domain time setting
		new Setting(containerEl)
			.setName('Search Domain Time')
			.setDesc('Time range for search results')
			.addDropdown(dropdown => {
				dropdown
					.addOption('', 'No time limit')
					.addOption('hour', 'Past hour')
					.addOption('day', 'Past day')
					.addOption('week', 'Past week')
					.addOption('month', 'Past month')
					.addOption('year', 'Past year')
					.setValue((this.plugin.settings as any).perplexitySearchDomainFilter || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).perplexitySearchDomainFilter = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).perplexitySearchDomainFilter = value;
						});
						await this.plugin.saveSettings();
					});
			});
	}

	addTavilyAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Tavily Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Configure Tavily search depth and result filtering options.',
			cls: 'settings-help-text'
		});

		// Search depth setting
		new Setting(containerEl)
			.setName('Search Depth')
			.setDesc('Depth of search results to retrieve')
			.addDropdown(dropdown => {
				dropdown
					.addOption('basic', 'Basic - Fast results')
					.addOption('advanced', 'Advanced - Comprehensive results')
					.setValue((this.plugin.settings as any).tavilySearchDepth || 'basic')
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilySearchDepth = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilySearchDepth = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Max results setting
		const maxResultsContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const maxResultsInfo = maxResultsContainer.createEl('div', { cls: 'setting-item-info' });
		maxResultsInfo.createEl('div', { cls: 'setting-item-name', text: 'Max Results' });
		const maxResultsDesc = maxResultsInfo.createEl('div', { cls: 'setting-item-description' });
		const currentMaxResults = (this.plugin.settings as any).tavilyMaxResults || 5;
		maxResultsDesc.textContent = `Maximum number of results (1-20). Current: ${currentMaxResults}`;
		
		const maxResultsControl = maxResultsContainer.createEl('div', { cls: 'setting-item-control' });
		const maxResultsSlider = maxResultsControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '1',
				max: '20',
				step: '1',
				value: currentMaxResults.toString()
			}
		});
		
		maxResultsSlider.addEventListener('input', async (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).tavilyMaxResults = value;
			maxResultsDesc.textContent = `Maximum number of results (1-20). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).tavilyMaxResults = value;
			});
			await this.plugin.saveSettings();
		});

		// Include domains setting
		new Setting(containerEl)
			.setName('Include Domains')
			.setDesc('Comma-separated list of domains to include (e.g., wikipedia.org, reddit.com)')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter domains to include...')
					.setValue((this.plugin.settings as any).tavilyIncludeDomains || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyIncludeDomains = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyIncludeDomains = value;
						});
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
			});

		// Exclude domains setting
		new Setting(containerEl)
			.setName('Exclude Domains')
			.setDesc('Comma-separated list of domains to exclude (e.g., ads.com, spam.com)')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter domains to exclude...')
					.setValue((this.plugin.settings as any).tavilyExcludeDomains || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyExcludeDomains = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyExcludeDomains = value;
						});
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
			});

		// Include answer toggle
		new Setting(containerEl)
			.setName('Include Answer')
			.setDesc('Include a direct answer in addition to search results')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).tavilyIncludeAnswer ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyIncludeAnswer = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyIncludeAnswer = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Include raw content toggle
		new Setting(containerEl)
			.setName('Include Raw Content')
			.setDesc('Include the raw HTML content of search results')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).tavilyIncludeRawContent ?? false)
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyIncludeRawContent = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyIncludeRawContent = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Include images toggle
		new Setting(containerEl)
			.setName('Include Images')
			.setDesc('Include images in search results when available')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).tavilyIncludeImages ?? false)
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyIncludeImages = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyIncludeImages = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Topic setting
		new Setting(containerEl)
			.setName('Topic')
			.setDesc('Topic category for search context (general, news, etc.)')
			.addDropdown(dropdown => {
				dropdown
					.addOption('general', 'General')
					.addOption('news', 'News')
					.addOption('science', 'Science')
					.addOption('technology', 'Technology')
					.addOption('business', 'Business')
					.addOption('health', 'Health')
					.addOption('entertainment', 'Entertainment')
					.addOption('sports', 'Sports')
					.setValue((this.plugin.settings as any).tavilyTopic || 'general')
					.onChange(async (value) => {
						(this.plugin.settings as any).tavilyTopic = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).tavilyTopic = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Days setting for recent content
		const daysContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const daysInfo = daysContainer.createEl('div', { cls: 'setting-item-info' });
		daysInfo.createEl('div', { cls: 'setting-item-name', text: 'Recent Content Days' });
		const daysDesc = daysInfo.createEl('div', { cls: 'setting-item-description' });
		const currentDays = (this.plugin.settings as any).tavilyDays || 0;
		daysDesc.textContent = `Limit to content from last N days (0=no limit). Current: ${currentDays}`;
		
		const daysControl = daysContainer.createEl('div', { cls: 'setting-item-control' });
		const daysSlider = daysControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '0',
				max: '365',
				step: '1',
				value: currentDays.toString()
			}
		});
		
		daysSlider.addEventListener('input', async (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).tavilyDays = value;
			daysDesc.textContent = `Limit to content from last N days (0=no limit). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).tavilyDays = value;
			});
			await this.plugin.saveSettings();
		});
	}

	addExaAdvancedSettings(containerEl: HTMLElement) {
		containerEl.createEl('h5', { text: 'Exa Neural Search Advanced Parameters' });
		containerEl.createEl('p', { 
			text: 'Exa offers the most customization options for semantic search and content filtering.',
			cls: 'settings-help-text'
		});

		// Search type setting
		new Setting(containerEl)
			.setName('Search Type')
			.setDesc('Type of search to perform')
			.addDropdown(dropdown => {
				dropdown
					.addOption('neural', 'Neural - Semantic understanding')
					.addOption('keyword', 'Keyword - Traditional search')
					.addOption('auto', 'Auto - Best of both')
					.setValue((this.plugin.settings as any).exaSearchType || 'neural')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaSearchType = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaSearchType = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Use autoprompt toggle
		new Setting(containerEl)
			.setName('Use Autoprompt')
			.setDesc('Automatically enhance queries for better results')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).exaUseAutoprompt ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).exaUseAutoprompt = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaUseAutoprompt = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Category setting
		new Setting(containerEl)
			.setName('Category')
			.setDesc('Content category to focus search on')
			.addDropdown(dropdown => {
				dropdown
					.addOption('', 'Any category')
					.addOption('company', 'Company')
					.addOption('research paper', 'Research Paper')
					.addOption('news', 'News')
					.addOption('github', 'GitHub')
					.addOption('tweet', 'Tweet')
					.addOption('movie', 'Movie')
					.addOption('song', 'Song')
					.addOption('personal site', 'Personal Site')
					.addOption('pdf', 'PDF Document')
					.setValue((this.plugin.settings as any).exaCategory || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaCategory = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaCategory = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Number of results setting
		const numResultsContainer = containerEl.createEl('div', { cls: 'setting-item' });
		const numResultsInfo = numResultsContainer.createEl('div', { cls: 'setting-item-info' });
		numResultsInfo.createEl('div', { cls: 'setting-item-name', text: 'Number of Results' });
		const numResultsDesc = numResultsInfo.createEl('div', { cls: 'setting-item-description' });
		const currentNumResults = (this.plugin.settings as any).exaNumResults || 10;
		numResultsDesc.textContent = `Number of results to return (1-20). Current: ${currentNumResults}`;
		
		const numResultsControl = numResultsContainer.createEl('div', { cls: 'setting-item-control' });
		const numResultsSlider = numResultsControl.createEl('input', {
			type: 'range',
			cls: 'slider',
			attr: {
				min: '1',
				max: '20',
				step: '1',
				value: currentNumResults.toString()
			}
		});
		
		numResultsSlider.addEventListener('input', async (e) => {
			const value = parseInt((e.target as HTMLInputElement).value);
			(this.plugin.settings as any).exaNumResults = value;
			numResultsDesc.textContent = `Number of results to return (1-20). Current: ${value}`;
			// Update all research mode configs
			(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
				(this.plugin.settings.researchModeConfigs[mode] as any).exaNumResults = value;
			});
			await this.plugin.saveSettings();
		});

		// Include domains setting
		new Setting(containerEl)
			.setName('Include Domains')
			.setDesc('Comma-separated list of domains to include (e.g., wikipedia.org, arxiv.org)')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter domains to include...')
					.setValue((this.plugin.settings as any).exaIncludeDomains || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaIncludeDomains = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaIncludeDomains = value;
						});
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
			});

		// Exclude domains setting
		new Setting(containerEl)
			.setName('Exclude Domains')
			.setDesc('Comma-separated list of domains to exclude (e.g., pinterest.com, quora.com)')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter domains to exclude...')
					.setValue((this.plugin.settings as any).exaExcludeDomains || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaExcludeDomains = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaExcludeDomains = value;
						});
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 2;
			});

		// Start crawl date setting
		new Setting(containerEl)
			.setName('Start Crawl Date')
			.setDesc('Only include results crawled after this date (YYYY-MM-DD format)')
			.addText(text => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue((this.plugin.settings as any).exaStartCrawlDate || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaStartCrawlDate = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaStartCrawlDate = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// End crawl date setting
		new Setting(containerEl)
			.setName('End Crawl Date')
			.setDesc('Only include results crawled before this date (YYYY-MM-DD format)')
			.addText(text => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue((this.plugin.settings as any).exaEndCrawlDate || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaEndCrawlDate = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaEndCrawlDate = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Start published date setting
		new Setting(containerEl)
			.setName('Start Published Date')
			.setDesc('Only include results published after this date (YYYY-MM-DD format)')
			.addText(text => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue((this.plugin.settings as any).exaStartPublishedDate || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaStartPublishedDate = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaStartPublishedDate = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// End published date setting
		new Setting(containerEl)
			.setName('End Published Date')
			.setDesc('Only include results published before this date (YYYY-MM-DD format)')
			.addText(text => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue((this.plugin.settings as any).exaEndPublishedDate || '')
					.onChange(async (value) => {
						(this.plugin.settings as any).exaEndPublishedDate = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaEndPublishedDate = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Include domains toggle
		new Setting(containerEl)
			.setName('Include Text')
			.setDesc('Include the text content of search results')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).exaIncludeText ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).exaIncludeText = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaIncludeText = value;
						});
						await this.plugin.saveSettings();
					});
			});

		// Include highlights toggle
		new Setting(containerEl)
			.setName('Include Highlights')
			.setDesc('Include highlighted relevant excerpts from results')
			.addToggle(toggle => {
				toggle
					.setValue((this.plugin.settings as any).exaIncludeHighlights ?? true)
					.onChange(async (value) => {
						(this.plugin.settings as any).exaIncludeHighlights = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).exaIncludeHighlights = value;
						});
						await this.plugin.saveSettings();
					});
			});
	}

	addCustomPromptsSettings(containerEl: HTMLElement) {
		const customPromptsContainer = containerEl.createDiv('custom-prompts-section');
		customPromptsContainer.createEl('h4', { text: 'Custom Prompt Templates' });
		
		// Help text
		const helpText = customPromptsContainer.createEl('p', { cls: 'settings-help-text' });
		helpText.innerHTML = `
			🎯 <strong>Progressive Disclosure Design:</strong><br>
			• <strong>Beginners:</strong> Use built-in optimized prompts (recommended)<br>
			• <strong>Intermediate:</strong> Choose preset templates for specific use cases<br>
			• <strong>Advanced:</strong> Create fully custom prompts with {query} placeholders<br><br>
			💡 All prompts support Obsidian-compatible markdown formatting and citations.
		`;
		
		// Template selector
		new Setting(customPromptsContainer)
			.setName('Prompt Template')
			.setDesc('Choose a preset template or create custom prompts')
			.addDropdown(dropdown => {
				dropdown
					.addOption('built-in', '🏠 Built-in Optimized (Recommended)')
					.addOption('academic', '🎓 Academic Research Template')
					.addOption('business', '💼 Business Analysis Template')
					.addOption('creative', '🎨 Creative Writing Template')
					.addOption('technical', '⚙️ Technical Documentation Template')
					.addOption('custom', '🛠️ Custom (Manual Configuration)')
					.setValue('built-in')
					.onChange(async (value) => {
						if (value !== 'custom' && value !== 'built-in') {
							const confirmed = confirm(`Load ${value} template? This will overwrite any existing custom prompts.`);
							if (confirmed) {
								await this.loadPromptTemplate(value);
								this.display(); // Refresh to show updated prompts
							}
						}
					});
			});

		// Individual prompt editors
		this.addPromptEditor(customPromptsContainer, 'Quick Mode', 'quickPrompt', 
			'Fast, concise responses (250-350 words, 2-3 key points)');
		this.addPromptEditor(customPromptsContainer, 'Comprehensive Mode', 'comprehensivePrompt', 
			'Balanced analysis (600-800 words, structured approach)');
		this.addPromptEditor(customPromptsContainer, 'Deep Mode', 'deepPrompt', 
			'In-depth research (1000-1500 words, comprehensive analysis)');
		this.addPromptEditor(customPromptsContainer, 'Reasoning Mode', 'reasoningPrompt', 
			'Logical analysis with evidence evaluation and bias detection');
		this.addPromptEditor(customPromptsContainer, 'YouTube Mode', 'youtubePrompt', 
			'Video content analysis with timestamps and citations');

		// Preview and validation section
		const previewContainer = customPromptsContainer.createDiv('prompt-preview-section');
		previewContainer.createEl('h5', { text: 'Prompt Validation & Management' });
		
		const buttonContainer = previewContainer.createEl('div', { cls: 'prompt-buttons' });
		
		const validationButton = buttonContainer.createEl('button', {
			text: '🔍 Validate All Prompts',
			cls: 'mod-cta'
		});
		
		validationButton.addEventListener('click', () => {
			this.validateAllPrompts(previewContainer);
		});

		// Reset to defaults button
		const resetButton = buttonContainer.createEl('button', {
			text: '🔄 Reset to Defaults',
			cls: 'mod-warning'
		});
		
		resetButton.addEventListener('click', async () => {
			const confirmed = confirm('Reset all custom prompts to optimized default values? This cannot be undone.');
			if (confirmed) {
				await this.resetPromptsToDefaults();
				this.display(); // Refresh settings
			}
		});

		// Export/Import buttons for advanced users
		const exportButton = buttonContainer.createEl('button', {
			text: '📤 Export Prompts',
			cls: 'prompt-export-btn'
		});
		
		exportButton.addEventListener('click', () => {
			this.exportPrompts();
		});

		const importButton = buttonContainer.createEl('button', {
			text: '📥 Import Prompts',
			cls: 'prompt-import-btn'
		});
		
		importButton.addEventListener('click', () => {
			this.importPrompts();
		});
	}

	addPromptEditor(container: HTMLElement, name: string, settingKey: keyof GeminiWebSearchSettings, description: string) {
		const setting = new Setting(container)
			.setName(name + ' Prompt')
			.setDesc(`${description}. Use {query} as placeholder for user input.`)
			.addTextArea(text => {
				text
					.setPlaceholder('Enter your custom prompt...')
					.setValue(this.plugin.settings[settingKey] as string)
					.onChange(async (value) => {
						// Validate {query} placeholder exists
						if (!value.includes('{query}')) {
							new Notice('⚠️ Warning: Prompt should include {query} placeholder for user input');
						}
						
						// Validate prompt length
						if (value.length > 5000) {
							new Notice('⚠️ Warning: Prompt is very long and may cause API errors');
						}
						
						(this.plugin.settings[settingKey] as any) = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 8;
				text.inputEl.style.fontFamily = 'var(--font-monospace)';
				text.inputEl.style.fontSize = 'var(--font-ui-small)';
			});
		
		// Add character count and preview button
		const controlContainer = container.createEl('div', { cls: 'prompt-controls' });
		
		const charCount = controlContainer.createEl('span', { 
			cls: 'prompt-char-count',
			text: `${(this.plugin.settings[settingKey] as string || '').length} characters`
		});
		
		const previewButton = controlContainer.createEl('button', {
			text: '👁️ Preview',
			cls: 'prompt-preview-btn'
		});
		
		previewButton.addEventListener('click', () => {
			this.previewPrompt(settingKey, name);
		});
		
		// Update character count on input
		const textarea = setting.settingEl.querySelector('textarea');
		if (textarea) {
			textarea.addEventListener('input', () => {
				charCount.textContent = `${textarea.value.length} characters`;
			});
		}
	}

	async loadPromptTemplate(templateName: string) {
		// Skip loading if built-in is selected
		if (templateName === 'built-in') {
			return;
		}
		
		const templates = {
			'academic': {
				quick: `### 🎓 Academic Quick Analysis

**Research Question:** "{query}"

## Key Academic Findings
- **Primary Finding**: [Peer-reviewed evidence] [^1]
- **Supporting Research**: [Recent studies] [^2]  
- **Methodological Notes**: [Research approach] [^3]

## Academic Context
**Field Significance**: [Why this matters academically] [^4]

## References
[^1]: Author et al., "Title," Journal, Year. DOI/URL
[^2]: Second Author, "Study," Publication, Year. Link
[^3]: Methodology source with validation
[^4]: Context and significance source

**Standards**: 250-300 words, minimum 4 academic citations, peer-reviewed focus`,

				comprehensive: `### 📚 Academic Research Framework

**Research Topic:** "{query}"

## Literature Review Summary
**Current State**: [Overview of existing research] [^1][^2]
**Research Gaps**: [Identified limitations in literature] [^3]

## Theoretical Framework
**Primary Theory**: [Main theoretical approach] [^4]
**Supporting Frameworks**: [Additional theoretical context] [^5][^6]

## Empirical Evidence
**Quantitative Studies**: [Statistical findings with effect sizes] [^7][^8]
**Qualitative Research**: [Thematic analysis and insights] [^9][^10]

## Critical Analysis
**Methodological Strengths**: [Research quality assessment] [^11]
**Limitations**: [Acknowledged constraints] [^12]
**Future Research**: [Recommended directions] [^13]

## Academic Integration
**Suggested Citations**: [[Key Study 1]], [[Theoretical Framework]]
**Tags**: #academic-research #literature-review #evidence-based

## References
[Complete academic bibliography with DOI/URLs]

**Standards**: 600-800 words, 13+ peer-reviewed citations, systematic review approach`,

				deep: `### 🔬 Comprehensive Academic Investigation

**Research Question:** "{query}"

## Systematic Literature Analysis
**Historical Development**: [Evolution of research in this area] [^1][^2]
**Current Paradigms**: [Dominant theoretical approaches] [^3][^4]
**Emerging Perspectives**: [New developments in the field] [^5][^6]

## Methodological Review
**Quantitative Approaches**: [Statistical methods and findings] [^7][^8][^9]
**Qualitative Methods**: [Interpretive research and insights] [^10][^11][^12]
**Mixed Methods**: [Integrated research designs] [^13][^14]

## Critical Synthesis
**Evidence Quality**: [Assessment of research rigor] [^15][^16]
**Contradictory Findings**: [Conflicting evidence analysis] [^17][^18]
**Meta-Analysis Results**: [Systematic review findings] [^19][^20]

## Implications and Applications
**Theoretical Contributions**: [Advancement of knowledge] [^21]
**Practical Applications**: [Real-world implementation] [^22]
**Policy Implications**: [Regulatory and institutional impact] [^23]

## Future Research Agenda
**Priority Questions**: [Critical gaps requiring investigation]
**Methodological Improvements**: [Enhanced research approaches]
**Interdisciplinary Opportunities**: [Cross-field collaboration]

**Standards**: 1000-1500 words, 23+ peer-reviewed citations, comprehensive academic analysis`,

				reasoning: `### 🧠 Academic Critical Reasoning

**Analysis Topic:** "{query}"

## Premise Evaluation
**Primary Claims**: [Evidence-based assertions] [^1][^2]
**Supporting Evidence**: [Quality of supporting research] [^3][^4]
**Methodological Validity**: [Research design assessment] [^5]

## Logical Framework
**Theoretical Foundation**: [Underlying logical structure] [^6]
**Causal Relationships**: [Evidence for causation vs correlation] [^7][^8]
**Alternative Explanations**: [Competing hypotheses] [^9][^10]

## Evidence Hierarchy
**Tier 1**: Systematic reviews and meta-analyses [^11][^12]
**Tier 2**: Randomized controlled trials [^13][^14]
**Tier 3**: Observational studies [^15][^16]

## Bias Assessment
**Selection Bias**: [Sampling methodology evaluation] [^17]
**Confirmation Bias**: [Research design objectivity] [^18]
**Publication Bias**: [Missing or suppressed findings] [^19]

## Confidence Assessment
**High Confidence**: [Well-established findings] [^20]
**Moderate Confidence**: [Provisional conclusions] [^21]
**Low Confidence**: [Preliminary or disputed findings] [^22]

**Standards**: 800-1000 words, 22+ citations, systematic logical analysis`,

				youtube: `### 🎬 Academic Video Content Analysis

**Video Resource:** {query}

## Content Classification
**Academic Value**: [Educational merit assessment] [^1]
**Source Credibility**: [Speaker credentials and institutional affiliation] [^2]
**Content Accuracy**: [Fact-checking against academic sources] [^3]

## Knowledge Extraction
**Key Concepts**: [Main academic ideas presented] [^4]
**Evidence Presented**: [Research cited or referenced] [^5]
**Methodological Discussion**: [Research approaches explained] [^6]

## Critical Evaluation
**Accuracy Assessment**: [Verification against peer-reviewed sources] [^7]
**Bias Detection**: [Potential conflicts of interest] [^8]
**Currency**: [Relevance of information to current research] [^9]

## Academic Integration
**Citation Format**: [Proper academic citation of video content] [^10]
**Supporting Literature**: [Related academic sources] [^11][^12]
**Research Applications**: [How content supports academic work] [^13]

## Verification Resources
**Primary Sources**: [Original research referenced] [^14]
**Peer Review**: [Academic validation of claims] [^15]

**Standards**: Academic rigor, proper citation, fact-checking focus`
			},
			
			'business': {
				quick: `### 💼 Business Quick Insight

**Business Question:** "{query}"

## Key Business Metrics
- **Market Impact**: [Financial or strategic significance] [^1]
- **Competitive Position**: [Market standing analysis] [^2]
- **Implementation Cost**: [Resource requirements] [^3]

## Executive Summary
**Bottom Line**: [Direct business impact] [^4]
**Timeline**: [Implementation or impact timeframe] [^5]

## Sources
[^1]: Market data source
[^2]: Competitive analysis source
[^3]: Cost analysis source
[^4]: Financial impact source
[^5]: Timeline validation source

**Focus**: ROI, market impact, actionable insights`,

				comprehensive: `### 📊 Business Analysis Framework

**Business Topic:** "{query}"

## Market Analysis
**Market Size**: [Total addressable market data] [^1][^2]
**Growth Trends**: [Historical and projected growth] [^3][^4]
**Competitive Landscape**: [Key players and market share] [^5][^6]

## Financial Impact
**Revenue Implications**: [Direct financial effects] [^7][^8]
**Cost Analysis**: [Implementation and operational costs] [^9]
**ROI Projections**: [Expected return on investment] [^10]

## Strategic Considerations
**Risks**: [Potential challenges and mitigation] [^11]
**Opportunities**: [Growth and expansion potential] [^12]
**Implementation Plan**: [Actionable next steps] [^13]

## Business Integration
**KPIs**: [[Key Performance Indicators]], [[Financial Metrics]]
**Tags**: #business-analysis #market-research #strategy

**Standards**: 500-700 words, focus on ROI and implementation`,

				deep: `### 🎯 Strategic Business Deep Dive

**Strategic Question:** "{query}"

## Comprehensive Market Intelligence
**Industry Analysis**: [Porter's Five Forces assessment] [^1][^2][^3]
**Value Chain Analysis**: [Operational efficiency opportunities] [^4][^5]
**SWOT Assessment**: [Strengths, weaknesses, opportunities, threats] [^6][^7]

## Financial Modeling
**Revenue Streams**: [Multiple income source analysis] [^8][^9]
**Cost Structure**: [Fixed vs variable cost breakdown] [^10]
**Profit Margins**: [Industry benchmarking] [^11]
**Cash Flow Projections**: [Multi-year financial forecasting] [^12]

## Risk Assessment Framework
**Market Risks**: [External threat evaluation] [^13]
**Operational Risks**: [Internal process vulnerabilities] [^14]
**Financial Risks**: [Capital and liquidity concerns] [^15]
**Regulatory Risks**: [Compliance and legal considerations] [^16]

## Implementation Strategy
**Phased Approach**: [Timeline and milestone planning] [^17]
**Resource Allocation**: [Human and capital requirements] [^18]
**Success Metrics**: [Measurable outcome definitions] [^19]

**Standards**: 900-1200 words, comprehensive business strategy focus`,

				reasoning: `### 🧮 Business Logic & Decision Framework

**Decision Analysis:** "{query}"

## Business Hypothesis Testing
**Core Assumptions**: [Underlying business beliefs] [^1][^2]
**Market Validation**: [Evidence supporting assumptions] [^3][^4]
**Data Quality**: [Reliability of business intelligence] [^5]

## Financial Logic Chain
**Revenue Logic**: [How money is generated] [^6][^7]
**Cost Logic**: [Expense structure rationale] [^8]
**Profit Logic**: [Path to profitability] [^9]

## Risk-Reward Analysis
**Probability Assessment**: [Likelihood of success/failure] [^10]
**Impact Magnitude**: [Scale of potential outcomes] [^11]
**Decision Trees**: [Multiple scenario planning] [^12]

## Strategic Reasoning
**Competitive Advantage**: [Sustainable differentiation] [^13]
**Market Timing**: [Entry and execution timing] [^14]
**Resource Optimization**: [Efficiency maximization] [^15]

**Standards**: Data-driven decision making, logical business case`,

				youtube: `### 📹 Business Video Intelligence

**Business Content:** {query}

## Content Authority Assessment
**Speaker Credentials**: [Business experience and track record] [^1]
**Company/Platform**: [Organizational credibility] [^2]
**Market Position**: [Industry standing and reputation] [^3]

## Business Intelligence Extraction
**Strategic Insights**: [High-level business strategy] [^4]
**Tactical Information**: [Operational implementation] [^5]
**Market Data**: [Financial metrics and trends] [^6]
**Case Studies**: [Real-world business examples] [^7]

## Implementation Value
**Actionability**: [Practical business application] [^8]
**ROI Potential**: [Expected business value] [^9]
**Resource Requirements**: [Implementation cost/effort] [^10]

## Business Validation
**Market Verification**: [Independent business source confirmation] [^11]
**Financial Accuracy**: [Revenue/cost data validation] [^12]
**Strategic Soundness**: [Business logic assessment] [^13]

**Standards**: Business-focused analysis, ROI orientation, implementation ready`
			},

			'creative': {
				quick: `### ✨ Creative Quick Spark

**Creative Prompt:** "{query}"

## Immediate Inspiration
- **Core Concept**: [Central creative idea] [^1]
- **Unique Angle**: [Fresh perspective or twist] [^2]
- **Emotional Hook**: [Feeling or connection point] [^3]

## Creative Direction
**Style/Tone**: [Artistic or narrative approach] [^4]
**Target Audience**: [Who resonates with this] [^5]

## Next Steps
**Development Path**: [How to expand this idea] [^6]

**Focus**: Inspiration, originality, emotional impact`,

				comprehensive: `### 🎨 Creative Development Framework

**Creative Project:** "{query}"

## Conceptual Foundation
**Central Theme**: [Core message or idea] [^1][^2]
**Creative Vision**: [Artistic direction and style] [^3][^4]
**Target Audience**: [Demographics and psychographics] [^5]

## Creative Elements
**Narrative Structure**: [Story or message flow] [^6][^7]
**Visual/Audio Elements**: [Sensory components] [^8]
**Emotional Journey**: [Audience experience arc] [^9]

## Inspiration Sources
**Cultural References**: [Relevant cultural touchstones] [^10]
**Artistic Influences**: [Creative works and movements] [^11]
**Contemporary Trends**: [Current creative directions] [^12]

## Creative Integration
**Project Links**: [[Creative Brief]], [[Style Guide]]
**Tags**: #creative-development #inspiration #artistic-vision

**Standards**: 500-700 words, focus on originality and emotional impact`,

				deep: `### 🌈 Creative Deep Exploration

**Creative Vision:** "{query}"

## Artistic Archaeological Dig
**Historical Context**: [Cultural and artistic heritage] [^1][^2]
**Contemporary Landscape**: [Current creative environment] [^3][^4]
**Future Possibilities**: [Emerging creative directions] [^5]

## Multi-Sensory Creative Matrix
**Visual Language**: [Color, form, composition elements] [^6][^7]
**Auditory Landscape**: [Sound, rhythm, musical elements] [^8]
**Tactile Dimensions**: [Texture, material, physical experience] [^9]
**Narrative Architecture**: [Story structure and emotional flow] [^10]

## Cross-Cultural Creative Synthesis
**Global Perspectives**: [International creative approaches] [^11][^12]
**Cultural Fusion**: [Blending traditional and modern] [^13]
**Universal Themes**: [Human connection points] [^14]

## Creative Innovation Framework
**Experimental Techniques**: [Cutting-edge creative methods] [^15]
**Technology Integration**: [Digital and traditional fusion] [^16]
**Collaborative Possibilities**: [Multi-disciplinary approaches] [^17]

**Standards**: 800-1200 words, emphasis on artistic innovation and cultural depth`,

				reasoning: `### 🎭 Creative Logic & Artistic Reasoning

**Creative Analysis:** "{query}"

## Artistic Hypothesis Formation
**Creative Premise**: [Central artistic assumption] [^1]
**Aesthetic Logic**: [Why this approach works] [^2]
**Audience Psychology**: [Emotional and cognitive impact] [^3]

## Creative Evidence Assessment
**Historical Precedents**: [Successful similar approaches] [^4][^5]
**Market Response**: [Audience reception data] [^6]
**Critical Analysis**: [Expert creative evaluation] [^7]

## Artistic Decision Framework
**Style Choices**: [Rational for aesthetic decisions] [^8]
**Medium Selection**: [Why this format/platform] [^9]
**Timing Considerations**: [Cultural moment alignment] [^10]

## Creative Risk-Reward Analysis
**Innovation Value**: [Originality vs accessibility] [^11]
**Market Acceptance**: [Commercial viability] [^12]
**Artistic Integrity**: [Vision vs compromise] [^13]

**Standards**: Logical creative analysis, evidence-based artistic decisions`,

				youtube: `### 🎬 Creative Video Analysis

**Creative Content:** {query}

## Creative Authority
**Creator Background**: [Artistic credentials and experience] [^1]
**Creative Platform**: [Channel focus and audience] [^2]
**Production Quality**: [Technical and artistic execution] [^3]

## Creative Intelligence Extraction
**Artistic Techniques**: [Methods and approaches demonstrated] [^4]
**Creative Process**: [Behind-the-scenes methodology] [^5]
**Innovation Elements**: [Unique or cutting-edge aspects] [^6]
**Inspiration Sources**: [References and influences mentioned] [^7]

## Creative Application Value
**Skill Development**: [Learning opportunities] [^8]
**Inspiration Potential**: [Creative spark generation] [^9]
**Practical Techniques**: [Actionable creative methods] [^10]

## Creative Validation
**Artistic Community**: [Peer recognition and response] [^11]
**Innovation Assessment**: [Originality and impact] [^12]
**Educational Value**: [Learning and development merit] [^13]

**Standards**: Creative focus, artistic development, inspiration-driven analysis`
			},

			'technical': {
				quick: `### ⚡ Technical Quick Reference

**Technical Query:** "{query}"

## Core Technical Points
- **Key Technology**: [Primary tech/method involved] [^1]
- **Implementation**: [How it's technically achieved] [^2]
- **Constraints**: [Technical limitations or requirements] [^3]

## Technical Context
**Use Cases**: [When and why to use this] [^4]
**Alternatives**: [Other technical approaches] [^5]

## Implementation Notes
**Quick Start**: [Immediate next steps] [^6]

**Focus**: Technical accuracy, implementation details, practical application`,

				comprehensive: `### 🔧 Technical Documentation Framework

**Technical Topic:** "{query}"

## Architecture Overview
**System Design**: [High-level technical architecture] [^1][^2]
**Components**: [Key technical modules and interfaces] [^3][^4]
**Data Flow**: [Information processing pipeline] [^5]

## Implementation Details
**Technologies**: [Specific tools, languages, frameworks] [^6][^7]
**Configuration**: [Setup and deployment requirements] [^8]
**Performance**: [Speed, scalability, resource usage] [^9]

## Integration Considerations
**Dependencies**: [External systems and libraries] [^10]
**Compatibility**: [Version and platform requirements] [^11]
**Security**: [Authentication, authorization, data protection] [^12]

## Technical Integration
**Documentation**: [[API Reference]], [[Configuration Guide]]
**Tags**: #technical-documentation #implementation #system-design

**Standards**: 500-700 words, focus on implementation and technical accuracy`,

				deep: `### 🏗️ Technical Deep Architecture

**Technical System:** "{query}"

## Comprehensive System Analysis
**Architecture Patterns**: [Design patterns and principles] [^1][^2]
**Scalability Design**: [Performance and growth considerations] [^3][^4]
**Security Framework**: [Comprehensive security model] [^5][^6]

## Implementation Deep Dive
**Core Algorithms**: [Mathematical and logical foundations] [^7][^8]
**Data Structures**: [Storage and organization methods] [^9]
**Performance Optimization**: [Efficiency improvements] [^10]
**Error Handling**: [Fault tolerance and recovery] [^11]

## Technology Stack Analysis
**Frontend Technologies**: [User interface implementation] [^12]
**Backend Systems**: [Server-side architecture] [^13]
**Database Design**: [Data persistence strategy] [^14]
**Infrastructure**: [Deployment and hosting] [^15]

## Advanced Considerations
**Microservices**: [Service decomposition strategy] [^16]
**DevOps Integration**: [CI/CD and deployment automation] [^17]
**Monitoring**: [Observability and logging] [^18]
**Testing Strategy**: [Quality assurance approach] [^19]

**Standards**: 900-1200 words, comprehensive technical analysis`,

				reasoning: `### 🧠 Technical Logic & System Reasoning

**Technical Problem:** "{query}"

## Technical Hypothesis Framework
**Problem Definition**: [Clear technical challenge statement] [^1]
**Solution Assumptions**: [Technical approach rationale] [^2]
**Constraint Analysis**: [Technical limitations and requirements] [^3]

## Algorithm and Logic Evaluation
**Computational Complexity**: [Time and space efficiency] [^4]
**Correctness Proof**: [Mathematical verification] [^5]
**Edge Case Analysis**: [Boundary condition handling] [^6]

## Technology Decision Matrix
**Technology Selection**: [Tool/framework choice rationale] [^7]
**Trade-off Analysis**: [Performance vs complexity] [^8]
**Maintenance Considerations**: [Long-term technical debt] [^9]

## System Validation
**Testing Strategy**: [Verification and validation approach] [^10]
**Performance Benchmarks**: [Measurable technical criteria] [^11]
**Security Assessment**: [Vulnerability analysis] [^12]

**Standards**: Logical technical analysis, evidence-based engineering decisions`,

				youtube: `### 🛠️ Technical Video Analysis

**Technical Content:** {query}

## Technical Authority Assessment
**Expert Credentials**: [Technical background and experience] [^1]
**Technical Platform**: [Channel focus and specialization] [^2]
**Content Accuracy**: [Technical correctness verification] [^3]

## Technical Knowledge Extraction
**Implementation Details**: [Code, configurations, procedures] [^4]
**Best Practices**: [Industry-standard approaches] [^5]
**Technical Insights**: [Expert tips and optimizations] [^6]
**Tool Demonstrations**: [Software and technology usage] [^7]

## Implementation Value
**Practical Application**: [Direct implementation potential] [^8]
**Skill Development**: [Technical learning opportunities] [^9]
**Problem Solving**: [Solution to technical challenges] [^10]

## Technical Validation
**Code Quality**: [Programming standards and practices] [^11]
**Industry Standards**: [Compliance with technical norms] [^12]
**Community Verification**: [Peer review and validation] [^13]

**Standards**: Technical accuracy, implementation focus, engineering best practices`
			}
		};

		const template = templates[templateName as keyof typeof templates];
		if (template) {
			this.plugin.settings.quickPrompt = template.quick;
			this.plugin.settings.comprehensivePrompt = template.comprehensive;
			this.plugin.settings.deepPrompt = template.deep;
			this.plugin.settings.reasoningPrompt = template.reasoning;
			this.plugin.settings.youtubePrompt = template.youtube;
			await this.plugin.saveSettings();
			new Notice(`✅ Loaded ${templateName} prompt template successfully`);
		}
	}

	previewPrompt(settingKey: keyof GeminiWebSearchSettings, name: string) {
		const prompt = this.plugin.settings[settingKey] as string;
		const previewText = prompt.replace('{query}', 'example search query');
		
		const modal = new Modal(this.app);
		modal.titleEl.textContent = `Preview: ${name} Prompt`;
		
		const content = modal.contentEl;
		content.createEl('h3', { text: 'Prompt Preview' });
		content.createEl('p', { text: 'This is how your prompt will appear with a sample query:' });
		
		const previewContainer = content.createEl('div', { 
			cls: 'prompt-preview-content'
		});
		previewContainer.style.cssText = `
			background: var(--background-secondary);
			padding: var(--size-4-2);
			border-radius: var(--radius-s);
			font-family: var(--font-monospace);
			font-size: var(--font-ui-small);
			white-space: pre-wrap;
			max-height: 400px;
			overflow-y: auto;
			border: 1px solid var(--background-modifier-border);
		`;
		previewContainer.textContent = previewText;
		
		// Character count and validation info
		const infoContainer = content.createEl('div', { cls: 'prompt-info' });
		infoContainer.createEl('p', { text: `Character count: ${prompt.length}` });
		
		if (!prompt.includes('{query}')) {
			const warning = infoContainer.createEl('p', { 
				text: '⚠️ Warning: Prompt does not contain {query} placeholder',
				cls: 'prompt-warning'
			});
			warning.style.color = 'var(--text-error)';
		}
		
		if (prompt.length > 5000) {
			const warning = infoContainer.createEl('p', { 
				text: '⚠️ Warning: Prompt is very long and may cause API errors',
				cls: 'prompt-warning'
			});
			warning.style.color = 'var(--text-error)';
		}
		
		modal.open();
	}

	validateAllPrompts(container: HTMLElement) {
		const results = container.createEl('div', { cls: 'validation-results' });
		results.empty();
		
		const prompts = [
			{ key: 'quickPrompt', name: 'Quick Mode', maxLength: 2000 },
			{ key: 'comprehensivePrompt', name: 'Comprehensive Mode', maxLength: 4000 },
			{ key: 'deepPrompt', name: 'Deep Mode', maxLength: 6000 },
			{ key: 'reasoningPrompt', name: 'Reasoning Mode', maxLength: 5000 },
			{ key: 'youtubePrompt', name: 'YouTube Mode', maxLength: 4000 }
		];
		
		let allValid = true;
		let validCount = 0;
		
		prompts.forEach(prompt => {
			const value = this.plugin.settings[prompt.key as keyof GeminiWebSearchSettings] as string;
			const resultEl = results.createEl('div', { cls: 'validation-item' });
			
			if (!value || value.trim().length === 0) {
				resultEl.innerHTML = `❌ ${prompt.name}: Empty prompt`;
				resultEl.style.color = 'var(--text-error)';
				allValid = false;
			} else if (!value.includes('{query}')) {
				resultEl.innerHTML = `⚠️ ${prompt.name}: Missing {query} placeholder`;
				resultEl.style.color = 'var(--text-warning)';
				allValid = false;
			} else if (value.length > prompt.maxLength) {
				resultEl.innerHTML = `⚠️ ${prompt.name}: Too long (${value.length}/${prompt.maxLength} chars)`;
				resultEl.style.color = 'var(--text-warning)';
			} else if (value.length > 5000) {
				resultEl.innerHTML = `⚠️ ${prompt.name}: Very long (${value.length} chars) - may cause API errors`;
				resultEl.style.color = 'var(--text-warning)';
			} else {
				resultEl.innerHTML = `✅ ${prompt.name}: Valid (${value.length} chars)`;
				resultEl.style.color = 'var(--text-success)';
				validCount++;
			}
		});
		
		// Overall validation summary
		const summaryEl = results.createEl('div', { cls: 'validation-summary' });
		if (allValid && validCount === prompts.length) {
			summaryEl.innerHTML = '🎉 All prompts are valid and ready to use!';
			summaryEl.style.color = 'var(--text-success)';
			summaryEl.style.fontWeight = 'var(--font-weight-bold)';
		} else {
			summaryEl.innerHTML = `📊 Validation Summary: ${validCount}/${prompts.length} prompts are fully valid`;
			summaryEl.style.color = 'var(--text-muted)';
		}
		
		// Add validation tips
		const tipsEl = results.createEl('div', { cls: 'validation-tips' });
		tipsEl.innerHTML = `
			<h6>💡 Prompt Optimization Tips:</h6>
			<ul>
				<li>Always include <code>{query}</code> placeholder for user input</li>
				<li>Keep prompts under recommended length limits for optimal API performance</li>
				<li>Use clear structure with headers and bullet points</li>
				<li>Include citation placeholders [^1], [^2] for source references</li>
				<li>Test prompts with preview function before using</li>
			</ul>
		`;
	}

	async resetPromptsToDefaults() {
		// Load default prompts from DEFAULT_SETTINGS
		this.plugin.settings.quickPrompt = DEFAULT_SETTINGS.quickPrompt;
		this.plugin.settings.comprehensivePrompt = DEFAULT_SETTINGS.comprehensivePrompt;
		this.plugin.settings.deepPrompt = DEFAULT_SETTINGS.deepPrompt;
		this.plugin.settings.reasoningPrompt = DEFAULT_SETTINGS.reasoningPrompt;
		this.plugin.settings.youtubePrompt = DEFAULT_SETTINGS.youtubePrompt;
		
		await this.plugin.saveSettings();
		new Notice('✅ All prompts reset to default values');
	}

	exportPrompts() {
		const prompts = {
			quickPrompt: this.plugin.settings.quickPrompt,
			comprehensivePrompt: this.plugin.settings.comprehensivePrompt,
			deepPrompt: this.plugin.settings.deepPrompt,
			reasoningPrompt: this.plugin.settings.reasoningPrompt,
			youtubePrompt: this.plugin.settings.youtubePrompt,
			exportDate: new Date().toISOString(),
			pluginVersion: this.plugin.manifest.version
		};

		const dataStr = JSON.stringify(prompts, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		
		const link = document.createElement('a');
		link.href = URL.createObjectURL(dataBlob);
		link.download = `ai-web-search-custom-prompts-${new Date().toISOString().split('T')[0]}.json`;
		link.click();
		
		new Notice('📤 Custom prompts exported successfully');
	}

	importPrompts() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				
				// Validate imported data
				const requiredFields = ['quickPrompt', 'comprehensivePrompt', 'deepPrompt', 'reasoningPrompt', 'youtubePrompt'];
				const missingFields = requiredFields.filter(field => !data[field]);
				
				if (missingFields.length > 0) {
					new Notice(`❌ Invalid prompt file: Missing fields ${missingFields.join(', ')}`);
					return;
				}
				
				// Validate each prompt has {query} placeholder
				const invalidPrompts = requiredFields.filter(field => !data[field].includes('{query}'));
				if (invalidPrompts.length > 0) {
					const proceed = confirm(`⚠️ Some prompts are missing {query} placeholder: ${invalidPrompts.join(', ')}. Import anyway?`);
					if (!proceed) return;
				}
				
				// Import prompts
				this.plugin.settings.quickPrompt = data.quickPrompt;
				this.plugin.settings.comprehensivePrompt = data.comprehensivePrompt;
				this.plugin.settings.deepPrompt = data.deepPrompt;
				this.plugin.settings.reasoningPrompt = data.reasoningPrompt;
				this.plugin.settings.youtubePrompt = data.youtubePrompt;
				
				await this.plugin.saveSettings();
				this.display(); // Refresh settings
				
				new Notice('📥 Custom prompts imported successfully');
			} catch (error) {
				new Notice('❌ Failed to import prompts: Invalid file format');
				console.error('Import error:', error);
			}
		};
		
		input.click();
	}
}

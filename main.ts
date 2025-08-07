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

			// Prepare Perplexity API request
			const requestBody: Record<string, any> = {
				model: model,
				messages: [
					{
						role: 'user',
						content: query
					}
				],
				temperature: perplexityParams.temperature,
				max_tokens: perplexityParams.max_tokens,
				top_p: perplexityParams.top_p,
				top_k: perplexityParams.top_k,
				frequency_penalty: perplexityParams.frequency_penalty,
				presence_penalty: perplexityParams.presence_penalty,
				stream: false, // We'll handle non-streaming for simplicity
				
				// Perplexity-specific search parameters
				search_domain_filter: perplexityParams.search_domain_filter.length > 0 ? perplexityParams.search_domain_filter : undefined,
				search_recency_filter: perplexityParams.search_recency_filter,
				return_related_questions: perplexityParams.return_related_questions,
				return_citations: perplexityParams.return_citations,
				return_images: perplexityParams.return_images
			};

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
				throw new Error(`Perplexity API error: ${response.status} - ${response.text}`);
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
		
		// Add thinking message with better feedback
		let thinkingMessage = 'Thinking...';
		if (isSearchMode) {
			thinkingMessage = `Searching the web with ${provider}...`;
		} else {
			thinkingMessage = `Chatting with ${provider}...`;
		}
		
		const thinkingId = this.addMessage('assistant', thinkingMessage, true);

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
				// For now, fallback to recent strategy
				// TODO: Implement summarization logic
				return messages.slice(-this.plugin.settings.maxContextMessages);
			
			default:
				return messages.slice(-this.plugin.settings.maxContextMessages);
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
				.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Best quality, slower)')
				.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Balanced)')
				.addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite (Fastest, lowest cost)')
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
			.setName('Model')
			.setDesc('Choose Perplexity AI model')
			.addDropdown(dropdown => {
				dropdown
					.addOption('llama-3.1-sonar-small-128k-online', 'Llama 3.1 Sonar Small (128k)')
					.addOption('llama-3.1-sonar-large-128k-online', 'Llama 3.1 Sonar Large (128k)')
					.addOption('llama-3.1-sonar-huge-128k-online', 'Llama 3.1 Sonar Huge (128k)')
					.addOption('llama-3.1-70b-instruct', 'Llama 3.1 70B Instruct')
					.addOption('llama-3.1-8b-instruct', 'Llama 3.1 8B Instruct')
					.setValue(this.plugin.settings.perplexityModel || 'llama-3.1-sonar-small-128k-online')
					.onChange(async (value) => {
						this.plugin.settings.perplexityModel = value;
						// Update all research mode configs
						(Object.keys(this.plugin.settings.researchModeConfigs) as Array<keyof typeof this.plugin.settings.researchModeConfigs>).forEach(mode => {
							(this.plugin.settings.researchModeConfigs[mode] as any).perplexityModel = value;
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
}

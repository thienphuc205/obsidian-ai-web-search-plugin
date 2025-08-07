var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  GeminiChatView: () => GeminiChatView,
  default: () => GeminiWebSearchPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var PluginLogger = class {
  constructor() {
    this.debugMode = true;
  }
  static getInstance() {
    if (!PluginLogger.instance) {
      PluginLogger.instance = new PluginLogger();
    }
    return PluginLogger.instance;
  }
  debug(message, data) {
    if (this.debugMode) {
      console.log(`[AI Web Search Debug] ${message}`, data || "");
    }
  }
  info(message, data) {
    console.log(`[AI Web Search Info] ${message}`, data || "");
  }
  warn(message, data) {
    console.warn(`[AI Web Search Warning] ${message}`, data || "");
  }
  error(message, error) {
    console.error(`[AI Web Search Error] ${message}`, error || "");
  }
};
var PerformanceMonitor = class {
  constructor() {
    this.metrics = /* @__PURE__ */ new Map();
  }
  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  startTimer(operationId) {
    this.metrics.set(operationId, Date.now());
  }
  endTimer(operationId) {
    const startTime = this.metrics.get(operationId);
    if (!startTime)
      return 0;
    const duration = Date.now() - startTime;
    this.metrics.delete(operationId);
    const logger = PluginLogger.getInstance();
    logger.debug(`Performance: ${operationId} took ${duration}ms`);
    return duration;
  }
  logMetrics(operation, duration, metadata) {
    const logger = PluginLogger.getInstance();
    logger.info(`Performance Metric: ${operation}`, {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
};
var InputValidator = class {
  static validateApiKey(key) {
    return typeof key === "string" && key.length > 0 && key.trim().length > 0;
  }
  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  static validateYouTubeUrl(url) {
    if (!this.validateUrl(url))
      return false;
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    return youtubeRegex.test(url);
  }
  static validateQuery(query) {
    return typeof query === "string" && query.trim().length > 0 && query.length <= 1e4;
  }
  static validateResearchMode(mode) {
    const validModes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
    return validModes.includes(mode);
  }
  static validateProvider(provider) {
    const validProviders = ["gemini", "perplexity", "tavily", "exa"];
    return validProviders.includes(provider);
  }
  static sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, "");
  }
};
var DEFAULT_SETTINGS = {
  provider: "gemini",
  geminiApiKey: "",
  perplexityApiKey: "",
  tavilyApiKey: "",
  exaApiKey: "",
  insertMode: "replace",
  maxResults: 5,
  includeImages: false,
  // Chat saving settings
  chatFolderName: "AI Web Search Chats",
  chatNoteTemplate: "timestamp-query",
  chatSaveEnabled: true,
  // Global provider-level settings for advanced UI
  geminiModel: "gemini-2.5-flash",
  geminiTemperature: 0.7,
  geminiTopP: 0.8,
  geminiTopK: 40,
  geminiMaxOutputTokens: 2e3,
  geminiHarassmentFilter: "BLOCK_MEDIUM_AND_ABOVE",
  geminiHateSpeechFilter: "BLOCK_MEDIUM_AND_ABOVE",
  geminiSexuallyExplicitFilter: "BLOCK_MEDIUM_AND_ABOVE",
  geminiDangerousContentFilter: "BLOCK_MEDIUM_AND_ABOVE",
  perplexityModel: "sonar-pro",
  perplexityTemperature: 0.5,
  perplexityMaxTokens: 1500,
  perplexityTopP: 0.8,
  perplexityTopK: 30,
  perplexityFrequencyPenalty: 0,
  perplexityPresencePenalty: 0,
  perplexityReturnCitations: true,
  perplexityReturnImages: false,
  perplexityReturnRelated: false,
  perplexitySearchDomainFilter: "",
  tavilySearchDepth: "basic",
  tavilyMaxResults: 5,
  tavilyIncludeDomains: "",
  tavilyExcludeDomains: "",
  tavilyIncludeAnswer: true,
  tavilyIncludeRawContent: false,
  tavilyIncludeImages: false,
  tavilyTopic: "",
  tavilyDays: 7,
  exaSearchType: "auto",
  exaUseAutoprompt: false,
  exaCategory: "",
  exaNumResults: 10,
  exaIncludeDomains: "",
  exaExcludeDomains: "",
  exaStartCrawlDate: "",
  exaEndCrawlDate: "",
  exaStartPublishedDate: "",
  exaEndPublishedDate: "",
  exaIncludeText: true,
  exaIncludeHighlights: true,
  // Enhanced Research Mode Configurations
  researchModeConfigs: {
    quick: {
      geminiModel: "gemini-2.5-flash-lite",
      perplexityModel: "sonar",
      geminiParams: {
        temperature: 0.5,
        topP: 0.7,
        topK: 20,
        maxOutputTokens: 1e3,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
        seed: null
      },
      geminiSafety: {
        harassment: "BLOCK_MEDIUM_AND_ABOVE",
        hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
        sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
        dangerousContent: "BLOCK_MEDIUM_AND_ABOVE"
      },
      perplexityParams: {
        temperature: 0.4,
        max_tokens: 800,
        top_p: 0.7,
        stream: false,
        search_domain_filter: [],
        search_recency_filter: "day",
        return_related_questions: false,
        return_citations: true,
        return_images: false
      }
    },
    comprehensive: {
      geminiModel: "gemini-2.5-flash",
      perplexityModel: "sonar-pro",
      geminiParams: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2e3,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
        seed: null
      },
      geminiSafety: {
        harassment: "BLOCK_MEDIUM_AND_ABOVE",
        hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
        sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
        dangerousContent: "BLOCK_MEDIUM_AND_ABOVE"
      },
      perplexityParams: {
        temperature: 0.6,
        max_tokens: 2e3,
        top_p: 0.8,
        stream: false,
        search_domain_filter: [],
        search_recency_filter: "week",
        return_related_questions: true,
        return_citations: true,
        return_images: true
      }
    },
    deep: {
      geminiModel: "gemini-2.5-pro",
      perplexityModel: "sonar-deep-research",
      geminiParams: {
        temperature: 0.8,
        topP: 0.9,
        topK: 60,
        maxOutputTokens: 4e3,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
        seed: null
      },
      geminiSafety: {
        harassment: "BLOCK_MEDIUM_AND_ABOVE",
        hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
        sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
        dangerousContent: "BLOCK_MEDIUM_AND_ABOVE"
      },
      perplexityParams: {
        temperature: 0.7,
        max_tokens: 4e3,
        top_p: 0.9,
        stream: false,
        search_domain_filter: [],
        search_recency_filter: "month",
        return_related_questions: true,
        return_citations: true,
        return_images: true
      }
    },
    reasoning: {
      geminiModel: "gemini-2.5-pro",
      perplexityModel: "sonar-reasoning",
      geminiParams: {
        temperature: 0.3,
        topP: 0.6,
        topK: 20,
        maxOutputTokens: 3e3,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
        seed: null
      },
      geminiSafety: {
        harassment: "BLOCK_MEDIUM_AND_ABOVE",
        hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
        sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
        dangerousContent: "BLOCK_MEDIUM_AND_ABOVE"
      },
      perplexityParams: {
        temperature: 0.2,
        max_tokens: 3e3,
        top_p: 0.6,
        stream: false,
        search_domain_filter: [],
        search_recency_filter: "month",
        return_related_questions: false,
        return_citations: true,
        return_images: false
      }
    },
    youtube: {
      geminiModel: "gemini-2.5-pro",
      geminiParams: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
        seed: null
      },
      geminiSafety: {
        harassment: "BLOCK_MEDIUM_AND_ABOVE",
        hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
        sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
        dangerousContent: "BLOCK_MEDIUM_AND_ABOVE"
      }
    }
  },
  // Tavily Search Parameters (optimized defaults)
  tavilyParams: {
    query: "",
    search_depth: "basic",
    include_answer: true,
    include_images: false,
    include_raw_content: false,
    max_results: 5,
    include_domains: [],
    exclude_domains: [],
    auto_parameters: {
      topic: "general",
      search_depth: "basic"
    },
    days: null,
    api_format: "json"
  },
  // Exa Search Parameters (optimized defaults from API docs)
  exaParams: {
    query: "",
    type: "auto",
    category: "",
    numResults: 10,
    includeDomains: [],
    excludeDomains: [],
    startCrawlDate: "",
    endCrawlDate: "",
    startPublishedDate: "",
    endPublishedDate: "",
    includeText: [],
    excludeText: [],
    getText: true,
    getHighlights: true,
    getSummary: true,
    userLocation: "US"
  },
  // Custom prompts with professional frameworks optimized for Obsidian
  enableCustomPrompts: false,
  quickPrompt: `### \u26A1 Quick Research Framework for Obsidian

You are an expert researcher providing rapid, actionable insights optimized for Obsidian knowledge management.

**Query:** "{query}"

## \u{1F3AF} Key Findings
- **Finding 1**: [Concise insight with evidence] [^1]
- **Finding 2**: [Supporting data or trend] [^2]
- **Finding 3**: [Practical application] [^3]

## \u{1F4DA} Essential Context
**Background**: Brief context explaining why this matters [^4]

**Current Status**: What's happening now in this space [^5]

## \u{1F517} Knowledge Connections
*For your Obsidian vault:*
- Consider linking to: [[Research Methods]], [[Data Analysis]], [[{query}]]
- Related concepts: #quick-research #data #analysis
- External resource: [Primary Source](https://example.com) - Why this matters

## \u{1F4D6} References
[^1]: Author, "Title," *Publication*, Date. Available: URL
[^2]: Organization, "Report Title," Date. Link: URL
[^3]: Expert Name, "Analysis," *Journal*, Date. URL: URL
[^4]: Institution, "Background Study," Date. Source: URL
[^5]: Recent Study, "Current Trends," Date. Available: URL

**Standards**: 250-350 words, 5+ authoritative sources, Obsidian-optimized formatting`,
  comprehensivePrompt: '### \u{1F50D} Comprehensive Research Analysis for Obsidian Knowledge Management\n\nYou are a senior researcher conducting systematic analysis with full documentation for professional knowledge management.\n\n**Research Topic:** "{query}"\n\n## \u{1F4CB} Executive Summary\n[2-3 sentence overview highlighting key themes, significance, and main conclusions] [^1][^2]\n\n## \uFFFD Detailed Analysis\n\n### Core Concepts & Definitions\n- **Primary Concept**: Definition, significance, and applications [^3]\n- **Secondary Concept**: Supporting framework and methodology [^4]\n- **Key Metrics**: Quantitative measures and benchmarks [^5]\n\n### Current Landscape Analysis\n**Market/Field Overview**: Present state, major players, trends [^6][^7]\n\n**Recent Developments**: Latest changes, innovations, disruptions [^8][^9]\n\n**Challenges & Opportunities**: Current obstacles and emerging possibilities [^10]\n\n### Multi-Perspective Examination\n#### Academic Perspective\nResearch findings, peer-reviewed insights, theoretical frameworks [^11][^12]\n\n#### Industry Application\nReal-world implementations, case studies, best practices [^13][^14]\n\n#### Critical Analysis\nLimitations, controversies, knowledge gaps, bias considerations [^15][^16]\n\n## \u{1F310} External Resources & Further Reading\n- [Primary Research Database](https://example.com) - Comprehensive academic sources\n- [Industry Analysis Portal](https://example.com) - Current market data and trends\n- [Expert Commentary Hub](https://example.com) - Professional insights and opinions\n- [Technical Documentation](https://example.com) - Implementation guides and standards\n\n## \u{1F517} Obsidian Vault Integration\n**Suggested Note Creation:**\n- [[{query} - Overview]] - Main topic summary\n- [[{query} - Analysis]] - Detailed findings\n- [[{query} - Sources]] - Reference compilation\n- [[Research Methodology]] - Link to analysis methods\n\n**Recommended Tags:** #comprehensive-research #analysis #{topic-specific} #academic #industry\n\n**Cross-References:** [[Research Framework]], [[Data Sources]], [[Analysis Methods]]\n\n## \u{1F4DA} Complete Source Documentation\n[^1]: Lead Author et al., "Primary Study Title," *Journal Name*, Vol. X(Y), pp. Pages, Year. DOI: doi Available: URL\n[^2]: Organization Name, "Report Title," *Publication Series*, Date. Retrieved from: URL\n[^3]: Expert Author, "Definitional Framework," *Academic Press*, Year, pp. Pages. ISBN: isbn\n[^4]: Research Team, "Supporting Analysis," *Conference Proceedings*, Location, Date. Link: URL\n[^5]: Data Institution, "Metrics Report," *Statistical Series*, Year. Dataset: URL\n[^6]: Market Analyst, "Industry Overview," *Business Journal*, Date. Available: URL\n[^7]: Think Tank, "Sector Analysis," *Policy Report*, Year. Source: URL\n[^8]: News Source, "Recent Development," *Publication*, Date. Article: URL\n[^9]: Innovation Hub, "Trend Analysis," *Tech Report*, Date. Link: URL\n[^10]: Strategy Firm, "Opportunity Assessment," *Consulting Report*, Year. URL: URL\n[^11]: Academic Institution, "Research Findings," *University Press*, Year. Study: URL\n[^12]: Scholar Name, "Theoretical Framework," *Academic Journal*, Vol(Issue), Year. DOI: URL\n[^13]: Company/Org, "Case Study," *Implementation Report*, Date. Reference: URL\n[^14]: Industry Expert, "Best Practices Guide," *Professional Publication*, Year. Guide: URL\n[^15]: Critical Analyst, "Limitation Study," *Review Journal*, Vol(Issue), Year. Analysis: URL\n[^16]: Independent Researcher, "Bias Assessment," *Methodology Journal*, Date. Paper: URL\n\n**Quality Standards:** 600-800 words, 16+ high-quality citations, full Obsidian integration, professional-grade analysis',
  deepPrompt: '### \u{1F3AF} Deep Research Investigation for Advanced Knowledge Systems\n\nYou are a leading domain expert conducting comprehensive multi-dimensional analysis for research-grade documentation.\n\n**Research Question:** "{query}"\n\n## \u{1F3AF} Research Framework\n**Scope**: Comprehensive interdisciplinary investigation\n**Methodology**: Systematic evidence synthesis across multiple domains\n**Output Standard**: Research-grade documentation with complete source verification\n\n## \u{1F4DA} Foundational Analysis\n\n### Historical Development & Context\n**Evolution Timeline**: Key developments, paradigm shifts, milestone events [^1][^2][^3]\n\n**Foundational Theories**: Core theoretical frameworks and their originators [^4][^5]\n\n**Paradigm Changes**: Major shifts in understanding or approach [^6][^7]\n\n### Theoretical Framework Deep Dive\n#### Primary Theoretical Approach\n- **Core Principles**: Fundamental assumptions and logical structure [^8][^9]\n- **Key Contributors**: Major theorists and their specific contributions [^10][^11]\n- **Applications**: Real-world implementations and use cases [^12][^13]\n\n#### Alternative Theoretical Perspectives\n- **Competing Framework A**: Different approach, strengths, limitations [^14][^15]\n- **Competing Framework B**: Third perspective, synthesis opportunities [^16][^17]\n- **Integration Analysis**: How different theories complement or conflict [^18][^19]\n\n## \u{1F52C} Multi-Dimensional Evidence Analysis\n\n### Dimension 1: Empirical Research Evidence\n**Methodology Review**: Research designs, sample sizes, statistical power [^20][^21]\n- Finding A: [Specific result with confidence intervals/effect sizes] [^22]\n- Finding B: [Replication studies and meta-analysis results] [^23]\n- Finding C: [Longitudinal data and trend analysis] [^24]\n\n### Dimension 2: Professional Practice Integration\n**Implementation Studies**: Real-world effectiveness, scalability, constraints [^25][^26]\n- Case Study A: [Successful implementation with metrics] [^27]\n- Case Study B: [Failed implementation with lessons learned] [^28]\n- Best Practice Synthesis: [Evidence-based recommendations] [^29][^30]\n\n### Dimension 3: Cross-Disciplinary Connections\n**Field Integration Analysis**: How this topic connects across disciplines [^31][^32]\n- **Connection to [[Field A]]**: Shared concepts, methodologies, applications [^33]\n- **Connection to [[Field B]]**: Collaborative opportunities, knowledge transfer [^34]\n- **Emerging Interdisciplinary Approaches**: New synthesis areas [^35][^36]\n\n### Dimension 4: Future Trajectory Analysis\n**Trend Identification**: Statistical analysis of development patterns [^37][^38]\n- **Short-term (1-2 years)**: Predictable developments, ongoing projects [^39]\n- **Medium-term (3-5 years)**: Probable innovations, market evolution [^40]\n- **Long-term (5+ years)**: Potential paradigm shifts, disruptive possibilities [^41]\n\n## \u2696\uFE0F Critical Evaluation & Synthesis\n\n### Strengths & Robust Evidence\n**High-Confidence Findings**: Well-supported conclusions with strong evidence [^42][^43]\n\n**Methodological Strengths**: Rigorous research designs, large samples [^44][^45]\n\n### Limitations & Knowledge Gaps\n**Identified Weaknesses**: Methodological limitations, sample constraints [^46][^47]\n\n**Research Gaps**: Areas needing investigation, unanswered questions [^48][^49]\n\n### Controversy & Debate Analysis\n**Major Debates**: Unresolved questions, competing evidence [^50][^51]\n\n**Bias Assessment**: Potential conflicts of interest, funding influences [^52][^53]\n\n## \u{1F310} Comprehensive Resource Ecosystem\n\n### Primary Research Sources\n- [Leading Research Institution Database](https://example.com) - Peer-reviewed studies and data\n- [Government Research Portal](https://example.com) - Official statistics and policy research\n- [International Organization Hub](https://example.com) - Global standards and comparative studies\n\n### Secondary Analysis Sources\n- [Expert Analysis Platform](https://example.com) - Professional commentary and interpretation\n- [Industry Intelligence Service](https://example.com) - Market analysis and trend reporting\n- [Academic Review Consortium](https://example.com) - Systematic reviews and meta-analyses\n\n### Specialized Databases & Tools\n- [Specialized Database A](https://example.com) - Domain-specific research repository\n- [Analytical Tool B](https://example.com) - Data analysis and visualization platform\n- [Professional Network C](https://example.com) - Expert community and collaboration space\n\n## \u{1F517} Advanced Knowledge Graph Integration\n\n### Core Note Architecture\n**Primary Notes to Create:**\n- [[{query} - Deep Analysis]] - Main research compilation\n- [[{query} - Theoretical Framework]] - Conceptual foundations\n- [[{query} - Evidence Base]] - Empirical findings summary\n- [[{query} - Methodology Review]] - Research methods analysis\n- [[{query} - Future Research]] - Gaps and opportunities\n- [[{query} - Implementation Guide]] - Practical applications\n\n### Cross-Reference Network\n**Foundational Connections:**\n- [[Research Methodology]] - Link to methods discussion\n- [[Statistical Analysis]] - Connect to analytical approaches\n- [[Literature Review]] - Reference review techniques\n- [[Critical Thinking]] - Link to evaluation frameworks\n\n**Domain-Specific Links:**\n- [[{topic} Theory]] - Theoretical foundations\n- [[{topic} Applications]] - Practical implementations\n- [[{topic} Research]] - Ongoing investigations\n\n### Tagging Strategy\n**Primary Tags:** #deep-research #evidence-based #multi-dimensional #academic\n**Domain Tags:** #{field-specific} #{methodology-type} #{application-area}\n**Status Tags:** #comprehensive #verified #research-grade\n\n## \u{1F4CA} Research Synthesis & Conclusions\n\n### Primary Conclusions\n**High-Confidence Conclusions**: Well-supported findings with quantified certainty [^54][^55]\n\n**Moderate-Confidence Insights**: Probable conclusions with noted limitations [^56][^57]\n\n**Preliminary Findings**: Early indicators requiring further investigation [^58][^59]\n\n### Strategic Implications\n**For Researchers**: Priority areas for future investigation [^60]\n\n**For Practitioners**: Evidence-based implementation recommendations [^61]\n\n**For Policymakers**: Regulatory and policy considerations [^62]\n\n### Research Roadmap\n**Immediate Priorities**: Critical gaps requiring urgent investigation\n**Medium-term Goals**: Systematic research program development\n**Long-term Vision**: Transformative research possibilities\n\n---\n### Complete Academic Bibliography\n[Complete 62 reference citations with DOI and URLs where available]\n[^1] through [^62]: [Standard academic citation format with Author, Title, Journal/Publisher, Year, DOI/URL]\n\n**Research Standards:** 1200-1500 words, 62+ peer-reviewed citations, complete methodological documentation, research-grade analysis suitable for academic publication',
  reasoningPrompt: `### \u{1F9E0} Advanced Logical Reasoning & Critical Analysis Framework

You are a master logician and critical thinking expert conducting systematic reasoning analysis optimized for Obsidian knowledge systems.

**Reasoning Challenge:** "{query}"

## \u{1F3AF} Logical Framework Definition
**Primary Objective**: Deconstruct arguments, evaluate evidence quality, identify logical fallacies, and synthesize sound conclusions

**Reasoning Standards**: Formal logic principles, evidence hierarchy, bias mitigation, uncertainty quantification

**Output Goal**: Rigorous logical analysis suitable for decision-making and knowledge building

## \u{1F4DA} Premise Deconstruction & Evidence Hierarchy

### Core Premise Identification
**Premise 1**: [Explicit statement]
- *Source Quality*: [Peer-reviewed/Expert opinion/Anecdotal] [^1]
- *Evidence Strength*: [Strong/Moderate/Weak with justification]
- *Logical Role*: [Foundation/Supporting/Contingent]

**Premise 2**: [Supporting statement]
- *Source Quality*: [Academic/Professional/Popular media] [^2]
- *Evidence Strength*: [Quantified confidence level]
- *Logical Role*: [How this supports the argument] [^3]

**Premise 3**: [Additional evidence]
- *Source Quality*: [Primary/Secondary/Tertiary source] [^4]
- *Evidence Strength*: [Statistical significance if applicable]
- *Logical Role*: [Necessary/Sufficient/Contributing condition] [^5]

### Evidence Quality Assessment Matrix
#### Tier 1: High-Quality Evidence
- **Systematic Reviews & Meta-Analyses**: [Citations with effect sizes] [^6][^7]
- **Randomized Controlled Studies**: [Sample sizes, controls, replication] [^8][^9]
- **Peer-Reviewed Research**: [Journal impact factors, citation counts] [^10][^11]

#### Tier 2: Moderate-Quality Evidence
- **Expert Consensus**: [Professional qualifications, agreement level] [^12][^13]
- **Observational Studies**: [Methodology, confounding controls] [^14][^15]
- **Government/Institutional Reports**: [Methodology transparency] [^16][^17]

#### Tier 3: Supporting Evidence
- **Expert Opinion**: [Individual expertise, potential bias] [^18][^19]
- **Case Studies**: [Generalizability limitations] [^20][^21]
- **Preliminary Research**: [Sample limitations, replication needs] [^22][^23]

## \u{1F50D} Cognitive Bias Detection & Mitigation

### Identified Potential Biases
#### Confirmation Bias Assessment
**Evidence**: Tendency to favor information supporting existing beliefs [^24]
- *Detection Methods*: Look for contradictory evidence actively sought [^25]
- *Mitigation Strategy*: Steel-man opposing arguments [^26]
- *Quality Check*: Proportion of disconfirming evidence considered [^27]

#### Anchoring Bias Analysis
**Evidence**: Over-reliance on first information encountered [^28]
- *Detection*: Trace reasoning from initial assumptions [^29]
- *Mitigation*: Consider alternative starting points [^30]
- *Validation*: Test conclusions from different entry points [^31]

#### Availability Heuristic Check
**Evidence**: Overestimate probability of easily recalled events [^32]
- *Detection*: Analyze if vivid examples dominate reasoning [^33]
- *Mitigation*: Seek base rate statistics [^34]
- *Correction*: Weight evidence by actual frequency data [^35]

#### Selection & Sampling Bias
**Evidence**: Non-representative data leading to skewed conclusions [^36]
- *Detection*: Examine data collection methodology [^37]
- *Mitigation*: Seek diverse data sources [^38]
- *Validation*: Cross-reference with population statistics [^39]

### Bias Mitigation Protocols
**Protocol 1**: Systematic Devil's Advocate Analysis [^40]
**Protocol 2**: Red Team Critical Review [^41]
**Protocol 3**: Blind Spot Identification Matrix [^42]

## \u26D3\uFE0F Logical Structure Analysis & Inference Mapping

### Argument Mapping & Logical Flow
#### Primary Logical Chain
**Step 1**: [Premise A] + [Premise B] \u2192 [Intermediate Conclusion X] [^43]
- *Logic Type*: [Deductive/Inductive/Abductive]
- *Validity Check*: [Valid/Invalid with explanation]
- *Soundness Assessment*: [Sound/Unsound with reasoning]

**Step 2**: [Intermediate Conclusion X] + [Premise C] \u2192 [Secondary Conclusion Y] [^44]
- *Logical Operator*: [AND/OR/IF-THEN relationship]
- *Strength Assessment*: [Strong/Moderate/Weak inference]
- *Alternative Explanations*: [List competing interpretations] [^45]

**Step 3**: [Secondary Conclusion Y] + [Additional Evidence] \u2192 [Final Conclusion Z] [^46]
- *Confidence Level*: [Quantified certainty with bounds]
- *Assumptions Required*: [Explicit unstated assumptions]
- *Logical Dependencies*: [What must be true for conclusion to hold] [^47]

#### Alternative Logical Pathways
**Pathway A**: Different evidence combination leading to same conclusion [^48]
**Pathway B**: Same evidence leading to different conclusions [^49]
**Pathway C**: Null hypothesis testing and falsification attempts [^50]

### Formal Logic Application
#### Syllogistic Analysis
- **Major Premise**: [Universal statement] [^51]
- **Minor Premise**: [Specific application] [^52]
- **Conclusion**: [Logical necessity] [^53]
- **Validity Test**: [Form analysis independent of content]

#### Propositional Logic Structure
- **If P then Q**: [Conditional statement analysis] [^54]
- **P or Q**: [Disjunctive reasoning examination] [^55]
- **P and Q**: [Conjunctive logic verification] [^56]
- **Not P**: [Negation and contradiction testing] [^57]

## \u{1F4CA} Uncertainty Quantification & Probability Assessment

### Statistical Confidence Analysis
**Confidence Intervals**: [Range estimates with statistical basis] [^58]
- *Primary Finding*: [Point estimate \xB1 margin of error] [^59]
- *Secondary Finding*: [Probability bounds with assumptions] [^60]
- *Tertiary Finding*: [Conditional probabilities] [^61]

### Sensitivity Analysis Protocol
**Assumption Variation Testing**: How conclusions change with different assumptions [^62]
- *Robust Findings*: [Conclusions stable across assumption changes] [^63]
- *Sensitive Findings*: [Results dependent on specific assumptions] [^64]
- *Critical Dependencies*: [Assumptions that dramatically affect conclusions] [^65]

### Scenario Analysis Framework
**Best Case Scenario**: [Optimistic but realistic assessment] [^66]
**Most Likely Scenario**: [Central tendency with highest probability] [^67]
**Worst Case Scenario**: [Pessimistic but plausible assessment] [^68]
**Black Swan Considerations**: [Low probability, high impact possibilities] [^69]

## \u2696\uFE0F Limitation Acknowledgment & Knowledge Boundaries

### Methodological Constraints
**Data Limitations**: [Sample sizes, time ranges, scope boundaries] [^70]
**Measurement Limitations**: [Precision, accuracy, reliability issues] [^71]
**Analytical Limitations**: [Model assumptions, statistical power] [^72]

### Scope & Generalizability Boundaries
**Population Limits**: [Demographics, geographic, temporal boundaries] [^73]
**Context Constraints**: [Environmental, cultural, institutional factors] [^74]
**Domain Boundaries**: [Where findings apply vs. don't apply] [^75]

### Acknowledged Uncertainties
**Known Unknowns**: [Identified gaps in knowledge/data] [^76]
**Model Limitations**: [Simplifications and assumptions required] [^77]
**Future Contingencies**: [How changing conditions affect conclusions] [^78]

## \u{1F517} Obsidian Knowledge Integration & Decision Framework

### Core Knowledge Architecture
**Central Analysis Note**: [[{query} - Logical Analysis]] - Complete reasoning documentation
**Evidence Base Note**: [[{query} - Evidence Evaluation]] - Source quality assessment
**Bias Assessment Note**: [[{query} - Cognitive Bias Check]] - Bias detection and mitigation
**Logic Structure Note**: [[{query} - Argument Map]] - Formal logical analysis
**Uncertainty Note**: [[{query} - Confidence Assessment]] - Probability and limitations

### Cross-Reference Network
**Methodological Links**:
- [[Critical Thinking Methods]] - Link to reasoning frameworks
- [[Logical Fallacies]] - Connect to error identification
- [[Evidence Evaluation]] - Reference quality assessment
- [[Bias Mitigation]] - Link to objectivity tools
- [[Decision Theory]] - Connect to choice frameworks

**Domain-Specific Connections**:
- [[{topic} Controversies]] - Related debates and disputes
- [[{topic} Evidence Base]] - Field-specific research
- [[{topic} Expert Opinion]] - Professional consensus

### Tagging Strategy
**Method Tags**: #logical-analysis #critical-thinking #evidence-based #bias-checked
**Quality Tags**: #high-confidence #moderate-confidence #preliminary #needs-verification
**Process Tags**: #systematic #peer-reviewed #multi-perspective #uncertainty-quantified

## \u{1F3AF} Synthesis & Actionable Conclusions

### Primary Conclusions (High Confidence)
**Conclusion 1**: [Statement with confidence level 90-95%] [^79]
- *Supporting Evidence*: [Tier 1 sources, replication, expert consensus]
- *Logical Basis*: [Deductive reasoning, validated premises]
- *Practical Implication*: [What this means for decisions/actions]

**Conclusion 2**: [Statement with confidence level 85-90%] [^80]
- *Supporting Evidence*: [Multiple independent confirmations]
- *Logical Basis*: [Strong inductive reasoning]
- *Uncertainty Range*: [Bounds on confidence]

### Secondary Conclusions (Moderate Confidence)
**Provisional Finding**: [Statement with confidence level 70-85%] [^81]
- *Evidence Gaps*: [What additional evidence would increase confidence]
- *Alternative Explanations*: [Competing hypotheses not yet ruled out]
- *Contingencies*: [Conditions under which this may not hold]

### Research & Decision Recommendations
**Immediate Actions**: Evidence-based steps with high confidence [^82]
**Conditional Actions**: Steps dependent on additional verification [^83]
**Future Investigation**: Priority areas for reducing uncertainty [^84]

### Meta-Analysis of Reasoning Process
**Reasoning Quality Assessment**: [Self-evaluation of logical rigor]
**Bias Mitigation Success**: [How well cognitive biases were addressed]
**Uncertainty Management**: [Appropriateness of confidence claims]

---
### Complete Logical Evidence Bibliography
[Complete 84 reference citations with appropriate academic formatting]
[^1] through [^84]: [Standard academic citation format with Author, Title, Journal/Publisher, Year, DOI/URL]

**Reasoning Standards:** 1000-1300 words, 84+ citations supporting complete logical documentation, systematic bias detection, uncertainty quantification, full Obsidian integration, professional-grade logical analysis suitable for critical decision-making`,
  youtubePrompt: `### \u{1F3AC} Comprehensive YouTube Video Analysis for Professional Knowledge Management

You are a media analysis expert creating research-grade video documentation optimized for Obsidian's knowledge management capabilities.

**Video URL:** {url}

## \u{1F4FA} Video Intelligence Profile

### Essential Metadata
**Title**: [Extract and verify video title] [^1]
**Creator/Channel**: [Channel name, subscriber count, verification status] [^2]
**Publication Date**: [Upload date, recency relevance] [^3]
**Duration**: [Total length, content density analysis] [^4]
**View Metrics**: [View count, engagement rate, trending status] [^5]
**Content Category**: [Educational/Entertainment/News/Tutorial/Review] [^6]

### Content Classification & Quality Assessment
**Content Type**: [Lecture/Discussion/Demonstration/Interview/Documentary] [^7]
**Target Audience**: [Academic/Professional/General public/Specialized] [^8]
**Production Quality**: [Professional/Semi-professional/Amateur with quality indicators] [^9]
**Educational Value**: [High/Medium/Low with justification] [^10]

## \u{1F3AF} Executive Summary & Strategic Overview
**Core Purpose**: [2-3 sentence description of video's main objective and unique value] [^11]

**Key Value Proposition**: [What makes this video worth watching/referencing] [^12]

**Relevance Score**: [High/Medium/Low with context for your research/work] [^13]

## \u{1F4DA} Structured Content Analysis

### Primary Topic Architecture
#### Topic 1: [Main Subject Area]
**Time Range**: [Start-End timestamps] [^14]
- **Core Concepts**: [Key ideas presented with timestamp references] [^15]
- **Supporting Evidence**: [Data, examples, case studies mentioned] [^16]
- **Expert Claims**: [Specific assertions with speaker credentials] [^17]
- **Practical Applications**: [How this applies to real-world scenarios] [^18]

#### Topic 2: [Secondary Focus Area]
**Time Range**: [Start-End timestamps] [^19]
- **Theoretical Framework**: [Conceptual models or theories discussed] [^20]
- **Methodological Approaches**: [Techniques, processes, or systems explained] [^21]
- **Comparative Analysis**: [How this compares to alternatives] [^22]
- **Implementation Considerations**: [Practical constraints and requirements] [^23]

#### Topic 3: [Additional Content Area]
**Time Range**: [Start-End timestamps] [^24]
- **Emerging Trends**: [Future developments or innovations mentioned] [^25]
- **Industry Insights**: [Market perspective or professional viewpoints] [^26]
- **Technical Details**: [Specific procedures, formulas, or specifications] [^27]
- **Success Metrics**: [How effectiveness or progress is measured] [^28]

### Critical Information Extraction
#### Quantitative Data Points
- **Statistic 1**: [Specific number/percentage with context] [^29] *(Timestamp: [MM:SS])*
- **Statistic 2**: [Performance metric or research finding] [^30] *(Timestamp: [MM:SS])*
- **Statistic 3**: [Market data or comparative figures] [^31] *(Timestamp: [MM:SS])*

#### Qualitative Insights
- **Expert Opinion 1**: [Professional judgment or recommendation] [^32] *(Timestamp: [MM:SS])*
- **Case Study**: [Real-world example or success story] [^33] *(Timestamp: [MM:SS])*
- **Best Practice**: [Recommended approach or methodology] [^34] *(Timestamp: [MM:SS])*

### Notable Quotations & Key Statements
> **"[Significant Quote 1]"** - [Speaker Name/Role] [^35] *(Timestamp: [MM:SS])*
> *Context: [Why this quote is important for your knowledge base]*

> **"[Significant Quote 2]"** - [Speaker Name/Role] [^36] *(Timestamp: [MM:SS])*
> *Application: [How this applies to practical work/research]*

> **"[Significant Quote 3]"** - [Speaker Name/Role] [^37] *(Timestamp: [MM:SS])*
> *Implication: [What this means for the field/industry]*

## \u{1F50D} Critical Evaluation & Source Verification

### Speaker Credibility Assessment
**Primary Speaker**: [Name, title, institutional affiliation] [^38]
- **Expertise Level**: [Recognized expert/Practitioner/Thought leader] [^39]
- **Relevant Credentials**: [Degrees, certifications, experience] [^40]
- **Publication Record**: [Books, papers, previous media appearances] [^41]
- **Potential Conflicts**: [Financial interests, organizational bias] [^42]

**Additional Contributors**: [Other speakers or experts featured] [^43]

### Content Verification & Fact-Checking
#### Claims Requiring Verification
- **Claim 1**: [Specific assertion made] [^44]
  - *Verification Status*: [Confirmed/Disputed/Unverified]
  - *Supporting Source*: [Independent verification if available] [^45]
- **Claim 2**: [Statistical or factual statement] [^46]
  - *Source Quality*: [Primary/Secondary/Tertiary data source]
  - *Methodology*: [How data was collected/analyzed] [^47]

#### Bias & Limitation Analysis
**Potential Biases Detected**: [Commercial/Ideological/Selection biases] [^48]
**Methodological Limitations**: [Sample size/Time period/Scope constraints] [^49]
**Perspective Gaps**: [Missing viewpoints or alternative approaches] [^50]

### Educational & Research Value Assessment
**Strengths**:
- [What the video does exceptionally well] [^51]
- [Unique insights or perspectives provided] [^52]
- [Quality of explanation or demonstration] [^53]

**Limitations**:
- [Areas where content could be stronger] [^54]
- [Missing context or important considerations] [^55]
- [Potential oversimplifications] [^56]

## \u{1F310} Extended Research & Verification Resources

### Primary Source Verification
- [Original Research Paper](https://example.com) - Core study referenced in video [^57]
- [Official Documentation](https://example.com) - Authoritative source for claims [^58]
- [Government/Institutional Data](https://example.com) - Statistical verification [^59]

### Expert Perspective & Commentary
- [Expert Analysis Article](https://example.com) - Independent expert view on topic [^60]
- [Professional Industry Report](https://example.com) - Industry context and trends [^61]
- [Academic Review](https://example.com) - Scholarly perspective on subject [^62]

### Additional Learning Resources
- [Comprehensive Course/Tutorial](https://example.com) - Deeper learning on the topic [^63]
- [Technical Documentation](https://example.com) - Implementation guides and details [^64]
- [Community Discussion](https://example.com) - Ongoing conversation and updates [^65]

### Contradictory or Alternative Viewpoints
- [Alternative Perspective](https://example.com) - Different approach or opinion [^66]
- [Critical Analysis](https://example.com) - Challenges or limitations discussed [^67]
- [Debate/Discussion](https://example.com) - Multiple viewpoints presented [^68]

## \u{1F517} Obsidian Knowledge Integration Strategy

### Core Note Architecture for Your Vault
**Primary Analysis Note**: [[{video-topic} - Video Analysis]] - This comprehensive analysis
**Topic Deep Dive**: [[{video-topic} - Core Concepts]] - Extract key concepts for separate development
**Speaker Profile**: [[{speaker-name} - Expert Profile]] - Track this expert's contributions
**Methodology Notes**: [[{method/technique} - Implementation]] - Practical application guidance
**Research Trail**: [[{video-topic} - Source Verification]] - Fact-checking and validation

### Strategic Cross-Referencing
**Conceptual Links**:
- [[Video Analysis Methodology]] - Link to your analysis framework
- [[Expert Opinion Tracking]] - Connect to expert knowledge system
- [[Research Verification]] - Link to fact-checking protocols
- [[Learning Resources]] - Connect to educational content organization

**Topic-Specific Connections**:
- [[{main-topic}]] - Primary subject area
- [[{secondary-topic}]] - Related concepts and ideas
- [[{industry/field}]] - Broader context and applications
- [[{methodology/technique}]] - Specific approaches discussed

**Temporal & Project Links**:
- [[Current Research Projects]] - How this relates to ongoing work
- [[Future Learning Goals]] - What to explore next
- [[Industry Trend Tracking]] - How this fits broader patterns

### Advanced Tagging Strategy
**Content Tags**: #video-analysis #expert-opinion #educational-content #research-source
**Quality Tags**: #high-credibility #verified-claims #comprehensive #well-sourced
**Topic Tags**: #{main-topic} #{industry} #{methodology} #{application-area}
**Status Tags**: #fully-analyzed #partially-verified #requires-follow-up #implementation-ready
**Utility Tags**: #reference-material #teaching-resource #practical-guide #theoretical-framework

### Implementation Roadmap
**Immediate Actions** (Next 24-48 hours):
1. Create linked notes for key concepts identified
2. Verify 2-3 most important claims through independent sources
3. Add to relevant project notes or research areas

**Short-term Development** (Next week):
1. Explore 3-5 additional resources from reference list
2. Connect with related content in your vault
3. Create implementation plan if applicable

**Long-term Integration** (Next month):
1. Track speaker for additional content
2. Monitor topic for new developments
3. Assess impact on related research or projects

## \u{1F4CA} Video Analysis Metrics & Quality Assessment

### Content Quality Scorecard
- **Information Density**: [High/Medium/Low] - Amount of useful information per minute
- **Source Attribution**: [Excellent/Good/Poor] - How well claims are sourced
- **Practical Applicability**: [High/Medium/Low] - Real-world utility of content
- **Educational Structure**: [Excellent/Good/Poor] - Logical flow and clarity
- **Update Frequency**: [Current/Recent/Outdated] - Relevance of information

### Recommendation Score
**Overall Rating**: [Essential/Recommended/Optional/Skip] [^69]
**Best Use Case**: [Research reference/Learning resource/Background info/Entertainment]
**Target Audience Match**: [Perfect fit/Good match/Partial relevance/Poor fit]
**Follow-up Priority**: [High/Medium/Low] - Should you seek more from this source?

---
### Complete Video Documentation Bibliography
[Complete 69 reference citations with timestamps and external verification]
[^1] through [^69]: [Standard academic citation format with Video metadata, timestamps, and external source verification]

**Analysis Standards:** 800-1000 words comprehensive documentation, 69+ citations including timestamps and external verification, complete Obsidian integration with linking strategy, research-grade video analysis suitable for professional knowledge management and academic reference.`,
  // Provider search/chat mode settings
  providerSearchModes: {
    gemini: true,
    perplexity: true,
    tavily: true,
    exa: true
  },
  // Context Memory System
  contextMemoryEnabled: true,
  maxContextMessages: 10,
  contextMemoryStrategy: "recent",
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
        maxOutputTokens: 4e3
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
    compactMode: false
  },
  // Research mode model settings for backward compatibility
  researchModeModels: {
    quick: "gemini-2.5-flash-lite",
    comprehensive: "gemini-2.5-flash",
    deep: "gemini-2.5-pro",
    reasoning: "gemini-2.5-pro",
    youtube: "gemini-2.5-pro"
  }
};
var CHAT_VIEW_TYPE = "gemini-chat-view";
var GeminiWebSearchPlugin = class extends import_obsidian.Plugin {
  getCurrentResearchMode() {
    var _a, _b;
    try {
      const chatView = (_b = (_a = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)) == null ? void 0 : _a[0]) == null ? void 0 : _b.view;
      const researchMode = chatView == null ? void 0 : chatView.currentResearchMode;
      if (researchMode && InputValidator.validateResearchMode(researchMode.id)) {
        return researchMode.id;
      }
      return "comprehensive";
    } catch (error) {
      PluginLogger.getInstance().warn("Failed to get current research mode, using default", error);
      return "comprehensive";
    }
  }
  async onload() {
    const logger = PluginLogger.getInstance();
    const monitor = PerformanceMonitor.getInstance();
    const loadTimer = "plugin-load";
    try {
      logger.info("Plugin loading started");
      monitor.startTimer(loadTimer);
      await this.loadSettings();
      this.injectEnhancedCSS();
      this.registerView(
        CHAT_VIEW_TYPE,
        (leaf) => new GeminiChatView(leaf, this)
      );
      this.addRibbonIcon("message-circle", "Open AI Web Search Chat", () => {
        this.activateView();
      });
      this.addCommand({
        id: "gemini-web-search-selection",
        name: "Search Web for Selected Text",
        editorCallback: async (editor, view) => {
          const selection = editor.getSelection();
          if (selection) {
            await this.searchWeb(selection, "replace");
          } else {
            new import_obsidian.Notice("Please select some text first");
          }
        }
      });
      this.addCommand({
        id: "gemini-web-search-append",
        name: "Search Web for Selected Text (Append)",
        editorCallback: async (editor, view) => {
          const selection = editor.getSelection();
          if (selection) {
            await this.searchWeb(selection, "append");
          } else {
            new import_obsidian.Notice("Please select some text first");
          }
        }
      });
      this.addCommand({
        id: "open-ai-chat",
        name: "Open AI Web Search Chat",
        callback: () => {
          this.activateView();
        }
      });
      this.addCommand({
        id: "gemini-web-search-prompt",
        name: "AI Web Search: Custom query",
        editorCallback: (editor, ctx) => {
          this.promptForCustomSearch(editor);
        }
      });
      this.addCommand({
        id: "gemini-new-chat",
        name: "AI Web Search: Start New Chat",
        callback: () => {
          this.activateView().then(() => {
            var _a;
            const chatView = (_a = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]) == null ? void 0 : _a.view;
            if (chatView) {
              chatView.clearChat();
            }
          });
        }
      });
      this.addCommand({
        id: "test-perplexity-api",
        name: "AI Web Search: Test Perplexity API",
        callback: async () => {
          await this.testPerplexityAPI();
        }
      });
      this.addRibbonIcon("search", "AI Web Search", () => {
        this.showSearchModal();
      });
      this.addSettingTab(new GeminiSettingTab(this.app, this));
      const duration = monitor.endTimer(loadTimer);
      logger.info(`Plugin loaded successfully in ${duration}ms`);
    } catch (error) {
      logger.error("Plugin loading failed", error);
      new import_obsidian.Notice(`AI Web Search Plugin failed to load: ${error}`);
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
    let leaf = null;
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
  async performWebSearch(query) {
    const logger = PluginLogger.getInstance();
    const monitor = PerformanceMonitor.getInstance();
    const operationId = `web-search-${this.settings.provider}-${Date.now()}`;
    try {
      monitor.startTimer(operationId);
      logger.debug("Starting web search", {
        provider: this.settings.provider,
        query: InputValidator.sanitizeInput(query).substring(0, 100) + "..."
      });
      if (!InputValidator.validateQuery(query)) {
        throw new Error("Invalid search query provided");
      }
      if (!InputValidator.validateProvider(this.settings.provider)) {
        throw new Error(`Invalid provider: ${this.settings.provider}`);
      }
      let result;
      switch (this.settings.provider) {
        case "gemini":
          result = await this.searchWithGemini(query);
          break;
        case "perplexity":
          result = await this.searchWithPerplexity(query);
          break;
        case "tavily":
          result = await this.searchWithTavily(query);
          break;
        case "exa":
          result = await this.searchWithExa(query);
          break;
        default:
          throw new Error(`Invalid provider: ${this.settings.provider}`);
      }
      const duration = monitor.endTimer(operationId);
      monitor.logMetrics("web-search", duration, {
        provider: this.settings.provider,
        queryLength: query.length,
        resultLength: result.length
      });
      return result;
    } catch (error) {
      monitor.endTimer(operationId);
      logger.error("Web search failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `Search failed for: "${query}"

Error: ${errorMessage}

Please check your API configuration and try again.`;
    }
  }
  // Chat mode for Gemini - uses conversation context
  async performGeminiChat(query, chatHistory) {
    var _a, _b, _c, _d;
    if (!this.settings.geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }
    const logger = PluginLogger.getInstance();
    logger.debug("Starting Gemini chat", { query, historyLength: chatHistory.length });
    const contents = [];
    chatHistory.forEach((msg) => {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    });
    contents.push({
      role: "user",
      parts: [{ text: query }]
    });
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.settings.geminiApiKey
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.8,
            topK: 40
          }
        })
      });
      const data = response.json;
      if (data.candidates && ((_d = (_c = (_b = (_a = data.candidates[0]) == null ? void 0 : _a.content) == null ? void 0 : _b.parts) == null ? void 0 : _c[0]) == null ? void 0 : _d.text)) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("No valid response from Gemini API");
      }
    } catch (error) {
      logger.error("Gemini chat failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini chat failed: ${errorMessage}`);
    }
  }
  // Chat mode for Perplexity - uses conversation context
  async performPerplexityChat(query, chatHistory) {
    var _a, _b;
    if (!this.settings.perplexityApiKey) {
      throw new Error("Perplexity API key not configured");
    }
    const logger = PluginLogger.getInstance();
    logger.debug("Starting Perplexity chat", { query, historyLength: chatHistory.length });
    const messages = [];
    chatHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    messages.push({
      role: "user",
      content: query
    });
    const requestBody = {
      model: this.settings.perplexityModel,
      messages,
      temperature: this.settings.perplexityTemperature,
      max_tokens: this.settings.perplexityMaxTokens,
      top_p: this.settings.perplexityTopP,
      top_k: this.settings.perplexityTopK,
      frequency_penalty: this.settings.perplexityFrequencyPenalty,
      presence_penalty: this.settings.perplexityPresencePenalty
    };
    try {
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.perplexity.ai/chat/completions",
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.settings.perplexityApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const data = response.json;
      if (data.choices && ((_b = (_a = data.choices[0]) == null ? void 0 : _a.message) == null ? void 0 : _b.content)) {
        return data.choices[0].message.content;
      } else {
        throw new Error("No valid response from Perplexity API");
      }
    } catch (error) {
      logger.error("Perplexity chat failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Perplexity chat failed: ${errorMessage}`);
    }
  }
  async searchWithGemini(query) {
    var _a, _b, _c;
    const logger = PluginLogger.getInstance();
    const monitor = PerformanceMonitor.getInstance();
    const operationId = `gemini-search-${Date.now()}`;
    try {
      monitor.startTimer(operationId);
      logger.debug("Starting Gemini search", { queryLength: query.length });
      if (!InputValidator.validateApiKey(this.settings.geminiApiKey)) {
        throw new Error("Gemini API key not configured or invalid");
      }
      const chatView = (_a = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]) == null ? void 0 : _a.view;
      const researchMode = chatView == null ? void 0 : chatView.currentResearchMode;
      let geminiParams = this.settings.researchModeConfigs.comprehensive.geminiParams;
      if (researchMode && InputValidator.validateResearchMode(researchMode.id)) {
        switch (researchMode.id) {
          case "quick":
            geminiParams = this.settings.researchModeConfigs.quick.geminiParams;
            break;
          case "comprehensive":
            geminiParams = this.settings.researchModeConfigs.comprehensive.geminiParams;
            break;
          case "deep":
            geminiParams = this.settings.researchModeConfigs.deep.geminiParams;
            break;
          case "reasoning":
            geminiParams = this.settings.researchModeConfigs.reasoning.geminiParams;
            break;
          case "youtube":
            geminiParams = this.settings.researchModeConfigs.youtube.geminiParams;
            break;
        }
      }
      let enhancedPrompt = query;
      if (this.settings.enableCustomPrompts && researchMode) {
        switch (researchMode.id) {
          case "quick":
            enhancedPrompt = this.settings.quickPrompt.replace("{query}", query);
            break;
          case "comprehensive":
            enhancedPrompt = this.settings.comprehensivePrompt.replace("{query}", query);
            break;
          case "deep":
            enhancedPrompt = this.settings.deepPrompt.replace("{query}", query);
            break;
          case "reasoning":
            enhancedPrompt = this.settings.reasoningPrompt.replace("{query}", query);
            break;
          case "youtube":
            enhancedPrompt = `Analyze this YouTube video and provide a comprehensive summary and insights: ${query}`;
            break;
          default:
            enhancedPrompt = this.settings.comprehensivePrompt.replace("{query}", query);
        }
      } else if (researchMode) {
        switch (researchMode.id) {
          case "quick":
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
          case "comprehensive":
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
          case "deep":
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
          case "reasoning":
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
          case "youtube":
            enhancedPrompt = `### YouTube Video Analysis for Obsidian Knowledge Management

**Video URL:** ${query}

You are a media analysis expert creating comprehensive video documentation for academic and professional knowledge management.

## \u{1F4FA} Video Documentation Framework

### Basic Information
**Title**: [Extract video title]  
**Creator/Channel**: [Channel name and credentials]  
**Duration**: [Video length]  
**Upload Date**: [Publication date]  
**URL**: [Video URL] [^1]

### Content Analysis Structure

## \u{1F3AF} Executive Summary
Brief overview of video's main purpose and key value (2-3 sentences)

## \u{1F4DA} Content Breakdown

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

## \u{1F50D} Critical Evaluation

### Credibility Assessment
- **Speaker Credentials**: [Qualifications and expertise] [^10]
- **Source Quality**: [Evidence quality and citations used] [^11]
- **Bias Considerations**: [Potential limitations or perspectives] [^12]

### Educational Value
- **Target Audience**: [Who benefits most from this content]
- **Learning Outcomes**: [What viewers should understand]
- **Practical Applications**: [How to apply the information]

## \u{1F310} Related Resources
For additional context and verification:
- [Primary Source/Research](https://example.com) - Original research mentioned
- [Expert Analysis](https://example.com) - Related expert commentary  
- [Institutional Resource](https://example.com) - Official documentation

## \u{1F517} Knowledge Vault Integration
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
      let requestBody;
      if ((researchMode == null ? void 0 : researchMode.id) === "youtube" && (chatView == null ? void 0 : chatView.getVideoContext())) {
        const videoContext = chatView.getVideoContext();
        if (!videoContext)
          return "Error: No video context available";
        const videoUrl = videoContext.url;
        const isUrlQuery = chatView.isValidYouTubeUrl(query);
        const analysisPrompt = isUrlQuery ? enhancedPrompt : `Based on the YouTube video at ${videoUrl}, please answer this question: "${query}"

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
      const response = await (0, import_obsidian.requestUrl)({
        url: apiUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      const responseData = response.json;
      const candidate = (_b = responseData.candidates) == null ? void 0 : _b[0];
      if (!candidate) {
        throw new Error("No response from Gemini");
      }
      let result = candidate.content.parts[0].text;
      if ((_c = candidate.groundingMetadata) == null ? void 0 : _c.groundingChunks) {
        result += "\n\n--- \n**Sources:**\n";
        const sources = /* @__PURE__ */ new Set();
        candidate.groundingMetadata.groundingChunks.forEach((chunk) => {
          var _a2;
          if ((_a2 = chunk.web) == null ? void 0 : _a2.uri) {
            sources.add(`- [${chunk.web.title || chunk.web.uri}](${chunk.web.uri})`);
          }
        });
        result += Array.from(sources).join("\n");
      }
      const duration = monitor.endTimer(operationId);
      monitor.logMetrics("gemini-search", duration, {
        queryLength: query.length,
        resultLength: result.length,
        researchMode: researchMode == null ? void 0 : researchMode.id
      });
      return result;
    } catch (error) {
      monitor.endTimer(operationId);
      logger.error("Gemini search failed", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini search failed: ${errorMessage}`);
    }
  }
  async searchWeb(query, insertMode) {
    try {
      let result;
      switch (this.settings.provider) {
        case "gemini":
          result = await this.searchWithGemini(query);
          break;
        case "perplexity":
          result = await this.searchWithPerplexity(query);
          break;
        case "tavily":
          result = await this.searchWithTavily(query);
          break;
        case "exa":
          result = await this.searchWithExa(query);
          break;
        default:
          throw new Error(`Unknown provider: ${this.settings.provider}`);
      }
      this.insertResult(result, insertMode);
    } catch (error) {
      new import_obsidian.Notice(`Search failed: ${error.message}`);
    }
  }
  async searchWithPerplexity(query) {
    var _a, _b;
    if (!this.settings.perplexityApiKey) {
      throw new Error("Perplexity API key not configured");
    }
    if (!this.settings.perplexityApiKey.startsWith("pplx-")) {
      throw new Error('Invalid Perplexity API key format. Must start with "pplx-"');
    }
    const logger = PluginLogger.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const operationId = `perplexity-search-${Date.now()}`;
    try {
      performanceMonitor.startTimer(operationId);
      logger.debug("Starting Perplexity search", { query });
      const currentMode = this.getCurrentResearchMode();
      let perplexityParams;
      let model;
      if (currentMode === "youtube") {
        perplexityParams = this.settings.researchModeConfigs.comprehensive.perplexityParams;
        model = this.settings.researchModeConfigs.comprehensive.perplexityModel;
      } else {
        perplexityParams = this.settings.researchModeConfigs[currentMode].perplexityParams;
        model = this.settings.researchModeConfigs[currentMode].perplexityModel;
      }
      const modelMigration = {
        "llama-3.1-sonar-small-128k-online": "sonar",
        "llama-3.1-sonar-large-128k-online": "sonar-pro",
        "llama-3.1-sonar-huge-128k-online": "sonar-pro",
        "llama-3.1-70b-instruct": "sonar-reasoning",
        "llama-3.1-8b-instruct": "sonar"
      };
      if (modelMigration[model]) {
        logger.info(`Migrating old model ${model} to ${modelMigration[model]}`);
        model = modelMigration[model];
        if (currentMode === "youtube") {
          this.settings.researchModeConfigs.comprehensive.perplexityModel = model;
        } else {
          this.settings.researchModeConfigs[currentMode].perplexityModel = model;
        }
        await this.saveSettings();
      }
      const validModels = ["sonar", "sonar-pro", "sonar-reasoning", "sonar-reasoning-pro", "sonar-deep-research"];
      if (!validModels.includes(model)) {
        logger.warn(`Invalid model ${model}, falling back to sonar`);
        model = "sonar";
      }
      const requestBody = {
        model,
        messages: [
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: perplexityParams.max_tokens || 1e3,
        temperature: perplexityParams.temperature || 0.7,
        return_citations: true,
        return_related_questions: false,
        return_images: false
      };
      logger.debug("Perplexity API request details", {
        model,
        currentMode,
        params: requestBody,
        apiKeyPrefix: this.settings.perplexityApiKey.substring(0, 8) + "..."
      });
      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === void 0) {
          delete requestBody[key];
        }
      });
      logger.debug("Perplexity API request", { model, params: requestBody });
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.perplexity.ai/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.settings.perplexityApiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      const duration = performanceMonitor.endTimer(operationId);
      performanceMonitor.logMetrics("Perplexity Search", duration, {
        queryLength: query.length,
        model,
        maxTokens: perplexityParams.max_tokens
      });
      if (response.status !== 200) {
        logger.error("Perplexity API error", {
          status: response.status,
          statusText: response.text,
          headers: response.headers,
          requestBody
        });
        throw new Error(`Perplexity search failed: Request failed, status ${response.status}. Response: ${response.text}`);
      }
      const result = response.json;
      logger.debug("Perplexity search results received", {
        choices: ((_a = result.choices) == null ? void 0 : _a.length) || 0,
        model: result.model
      });
      let formattedResult = `# Perplexity Search Results

**Query:** ${query}

`;
      formattedResult += `**Model:** ${result.model || model}

`;
      if (result.choices && result.choices.length > 0) {
        const choice = result.choices[0];
        if (choice.message && choice.message.content) {
          formattedResult += `## AI Response

${choice.message.content}

`;
        }
        if (choice.citations && choice.citations.length > 0) {
          formattedResult += `## Sources

`;
          choice.citations.forEach((citation, index) => {
            formattedResult += `${index + 1}. [${citation.title || citation.url}](${citation.url})
`;
          });
          formattedResult += `
`;
        }
        if (choice.related_questions && choice.related_questions.length > 0) {
          formattedResult += `## Related Questions

`;
          choice.related_questions.forEach((question) => {
            formattedResult += `- ${question}
`;
          });
          formattedResult += `
`;
        }
      }
      if (result.usage) {
        formattedResult += `## Usage Statistics

`;
        formattedResult += `- **Prompt Tokens:** ${result.usage.prompt_tokens || "N/A"}
`;
        formattedResult += `- **Completion Tokens:** ${result.usage.completion_tokens || "N/A"}
`;
        formattedResult += `- **Total Tokens:** ${result.usage.total_tokens || "N/A"}

`;
      }
      formattedResult += `
---
*Search performed using Perplexity API (${model}) on ${new Date().toISOString()}*
`;
      logger.info("Perplexity search completed successfully", {
        duration,
        model: result.model,
        tokensUsed: ((_b = result.usage) == null ? void 0 : _b.total_tokens) || 0
      });
      return formattedResult;
    } catch (error) {
      const duration = performanceMonitor.endTimer(operationId);
      logger.error("Perplexity search failed", error);
      performanceMonitor.logMetrics("Perplexity Search (Failed)", duration, {
        error: error.message,
        queryLength: query.length
      });
      throw new Error(`Perplexity search failed: ${error.message}`);
    }
  }
  async searchWithTavily(query) {
    var _a, _b, _c, _d, _e;
    if (!this.settings.tavilyApiKey) {
      throw new Error("Tavily API key not configured");
    }
    const logger = PluginLogger.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const operationId = `tavily-search-${Date.now()}`;
    try {
      performanceMonitor.startTimer(operationId);
      logger.debug("Starting Tavily search", { query });
      const chatView = (_a = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]) == null ? void 0 : _a.view;
      const currentMode = ((_b = chatView == null ? void 0 : chatView.currentResearchMode) == null ? void 0 : _b.id) || "comprehensive";
      const modeKey = currentMode;
      const maxResults = ((_c = this.settings.researchModeConfigs[modeKey]) == null ? void 0 : _c.tavilyMaxResults) || this.settings.tavilyMaxResults || 5;
      const requestBody = {
        api_key: this.settings.tavilyApiKey,
        query,
        search_depth: this.settings.tavilySearchDepth,
        include_answer: this.settings.tavilyIncludeAnswer,
        include_images: this.settings.tavilyIncludeImages,
        include_raw_content: this.settings.tavilyIncludeRawContent,
        max_results: maxResults,
        include_domains: this.settings.tavilyIncludeDomains ? this.settings.tavilyIncludeDomains.split(",").map((d) => d.trim()) : void 0,
        exclude_domains: this.settings.tavilyExcludeDomains ? this.settings.tavilyExcludeDomains.split(",").map((d) => d.trim()) : void 0,
        topic: this.settings.tavilyTopic,
        days: this.settings.tavilyDays
      };
      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === void 0) {
          delete requestBody[key];
        }
      });
      logger.debug("Tavily API request body", requestBody);
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.tavily.com/search",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const duration = performanceMonitor.endTimer(operationId);
      performanceMonitor.logMetrics("Tavily Search", duration, {
        queryLength: query.length,
        maxResults,
        searchDepth: this.settings.tavilySearchDepth,
        researchMode: currentMode
      });
      if (response.status !== 200) {
        throw new Error(`Tavily API error: ${response.status} - ${response.text}`);
      }
      const searchResults = response.json;
      logger.debug("Tavily search results received", {
        resultsCount: ((_d = searchResults.results) == null ? void 0 : _d.length) || 0,
        hasAnswer: !!searchResults.answer
      });
      let formattedResult = `# Tavily Search Results

**Query:** ${query}

`;
      if (searchResults.answer) {
        formattedResult += `## AI Summary

${searchResults.answer}

`;
      }
      if (searchResults.results && searchResults.results.length > 0) {
        formattedResult += `## Search Results

`;
        searchResults.results.forEach((result, index) => {
          formattedResult += `### ${index + 1}. ${result.title}

`;
          if (result.url) {
            formattedResult += `**URL:** [${result.url}](${result.url})

`;
          }
          if (result.content) {
            formattedResult += `**Content:** ${result.content}

`;
          }
          if (result.score) {
            formattedResult += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%

`;
          }
          formattedResult += `---

`;
        });
      }
      if (this.settings.tavilyIncludeImages && searchResults.images && searchResults.images.length > 0) {
        formattedResult += `## Related Images

`;
        searchResults.images.forEach((image, index) => {
          if (image.url) {
            formattedResult += `![Image ${index + 1}](${image.url})

`;
          }
        });
      }
      formattedResult += `
---
*Search performed using Tavily API on ${new Date().toISOString()}*
`;
      logger.info("Tavily search completed successfully", {
        resultsCount: ((_e = searchResults.results) == null ? void 0 : _e.length) || 0,
        duration
      });
      return formattedResult;
    } catch (error) {
      const duration = performanceMonitor.endTimer(operationId);
      logger.error("Tavily search failed", error);
      performanceMonitor.logMetrics("Tavily Search (Failed)", duration, {
        error: error.message,
        queryLength: query.length
      });
      throw new Error(`Tavily search failed: ${error.message}`);
    }
  }
  async searchWithExa(query) {
    var _a, _b, _c, _d, _e, _f;
    if (!this.settings.exaApiKey) {
      throw new Error("Exa API key not configured");
    }
    const logger = PluginLogger.getInstance();
    const performanceMonitor = PerformanceMonitor.getInstance();
    const operationId = `exa-search-${Date.now()}`;
    try {
      performanceMonitor.startTimer(operationId);
      logger.debug("Starting Exa search", { query });
      const chatView = (_a = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]) == null ? void 0 : _a.view;
      const currentMode = ((_b = chatView == null ? void 0 : chatView.currentResearchMode) == null ? void 0 : _b.id) || "comprehensive";
      const modeKey = currentMode;
      const maxResults = ((_c = this.settings.researchModeConfigs[modeKey]) == null ? void 0 : _c.tavilyMaxResults) || this.settings.tavilyMaxResults || 5;
      const exaNumResults = Math.min(maxResults, this.settings.exaNumResults || 10);
      const requestBody = {
        query,
        type: this.settings.exaSearchType,
        numResults: exaNumResults,
        includeDomains: this.settings.exaIncludeDomains ? this.settings.exaIncludeDomains.split(",").map((d) => d.trim()) : void 0,
        excludeDomains: this.settings.exaExcludeDomains ? this.settings.exaExcludeDomains.split(",").map((d) => d.trim()) : void 0,
        startCrawlDate: this.settings.exaStartCrawlDate || void 0,
        endCrawlDate: this.settings.exaEndCrawlDate || void 0,
        startPublishedDate: this.settings.exaStartPublishedDate || void 0,
        endPublishedDate: this.settings.exaEndPublishedDate || void 0,
        category: this.settings.exaCategory || void 0,
        useAutoprompt: this.settings.exaUseAutoprompt,
        // Content options
        contents: {
          text: this.settings.exaIncludeText,
          highlights: this.settings.exaIncludeHighlights
        }
      };
      Object.keys(requestBody).forEach((key) => {
        if (requestBody[key] === void 0) {
          delete requestBody[key];
        }
      });
      if (requestBody.contents) {
        Object.keys(requestBody.contents).forEach((key) => {
          if (requestBody.contents[key] === void 0) {
            delete requestBody.contents[key];
          }
        });
        if (Object.keys(requestBody.contents).length === 0) {
          delete requestBody.contents;
        }
      }
      logger.debug("Exa API request body", requestBody);
      const response = await (0, import_obsidian.requestUrl)({
        url: "https://api.exa.ai/search",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.settings.exaApiKey
        },
        body: JSON.stringify(requestBody)
      });
      const duration = performanceMonitor.endTimer(operationId);
      performanceMonitor.logMetrics("Exa Search", duration, {
        queryLength: query.length,
        numResults: exaNumResults,
        searchType: this.settings.exaSearchType,
        researchMode: currentMode
      });
      if (response.status !== 200) {
        throw new Error(`Exa API error: ${response.status} - ${response.text}`);
      }
      const searchResults = response.json;
      logger.debug("Exa search results received", {
        resultsCount: ((_d = searchResults.results) == null ? void 0 : _d.length) || 0,
        searchType: searchResults.resolvedSearchType
      });
      let formattedResult = `# Exa Search Results

**Query:** ${query}

`;
      if (searchResults.resolvedSearchType) {
        formattedResult += `**Search Type:** ${searchResults.resolvedSearchType}

`;
      }
      if (searchResults.context) {
        formattedResult += `## AI Context Summary

${searchResults.context}

`;
      }
      if (searchResults.results && searchResults.results.length > 0) {
        formattedResult += `## Search Results

`;
        searchResults.results.forEach((result, index) => {
          formattedResult += `### ${index + 1}. ${result.title}

`;
          if (result.url) {
            formattedResult += `**URL:** [${result.url}](${result.url})

`;
          }
          if (result.author) {
            formattedResult += `**Author:** ${result.author}

`;
          }
          if (result.publishedDate) {
            const publishedDate = new Date(result.publishedDate).toLocaleDateString();
            formattedResult += `**Published:** ${publishedDate}

`;
          }
          if (result.score) {
            formattedResult += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%

`;
          }
          if (result.text) {
            formattedResult += `**Content:**
${result.text}

`;
          }
          if (result.highlights && result.highlights.length > 0) {
            formattedResult += `**Key Highlights:**
`;
            result.highlights.forEach((highlight) => {
              formattedResult += `- ${highlight}
`;
            });
            formattedResult += `
`;
          }
          if (result.summary) {
            formattedResult += `**Summary:** ${result.summary}

`;
          }
          if (result.subpages && result.subpages.length > 0) {
            formattedResult += `**Related Pages:**
`;
            result.subpages.slice(0, 3).forEach((subpage) => {
              formattedResult += `- [${subpage.title}](${subpage.url})
`;
            });
            formattedResult += `
`;
          }
          formattedResult += `---

`;
        });
      }
      if (searchResults.costDollars) {
        formattedResult += `## Search Cost

`;
        formattedResult += `**Total Cost:** $${searchResults.costDollars.total}

`;
      }
      formattedResult += `
---
*Search performed using Exa API on ${new Date().toISOString()}*
`;
      logger.info("Exa search completed successfully", {
        resultsCount: ((_e = searchResults.results) == null ? void 0 : _e.length) || 0,
        duration,
        cost: ((_f = searchResults.costDollars) == null ? void 0 : _f.total) || 0
      });
      return formattedResult;
    } catch (error) {
      const duration = performanceMonitor.endTimer(operationId);
      logger.error("Exa search failed", error);
      performanceMonitor.logMetrics("Exa Search (Failed)", duration, {
        error: error.message,
        queryLength: query.length
      });
      throw new Error(`Exa search failed: ${error.message}`);
    }
  }
  insertResult(result, mode) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!activeView) {
      new import_obsidian.Notice("No active markdown view");
      return;
    }
    const editor = activeView.editor;
    if (mode === "replace") {
      editor.replaceSelection(result);
    } else {
      const cursor = editor.getCursor();
      editor.replaceRange("\n\n" + result, cursor);
    }
  }
  // Method to prompt for custom search
  promptForCustomSearch(editor) {
    const query = prompt("Enter your search query:");
    if (query) {
      this.searchWeb(query, "append");
    }
  }
  // Method to test Perplexity API
  async testPerplexityAPI() {
    try {
      const result = await this.searchWithPerplexity("test query");
      new import_obsidian.Notice("Perplexity API test successful");
      console.log("Perplexity test result:", result);
    } catch (error) {
      new import_obsidian.Notice(`Perplexity API test failed: ${error.message}`);
      console.error("Perplexity test error:", error);
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
		`;
    const style = document.createElement("style");
    style.textContent = cssText;
    document.head.appendChild(style);
  }
};
var GeminiChatView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    // YouTube video context tracking
    this.currentVideoContext = null;
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
    container.addClass("gemini-chat-container");
    const header = container.createEl("div", { cls: "gemini-chat-header" });
    const titleContainer = header.createEl("div", { cls: "title-container" });
    titleContainer.createEl("h3", { text: "AI Web Search Chat" });
    const newChatButton = titleContainer.createEl("button", {
      cls: "new-chat-button",
      title: "Start a new conversation (Ctrl/Cmd + N)",
      attr: {
        "aria-label": "Start new chat conversation",
        "role": "button"
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
    newChatButton.addEventListener("click", () => {
      this.clearChat();
    });
    this.containerEl.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.clearChat();
      }
    });
    const providerContainer = header.createEl("div", { cls: "provider-container" });
    providerContainer.createEl("span", {
      text: "Provider: ",
      cls: "provider-label"
    });
    const providerDropdown = providerContainer.createEl("select", { cls: "provider-dropdown" });
    const geminiOption = providerDropdown.createEl("option", {
      value: "gemini",
      text: `Google Gemini ${this.checkApiKey("gemini") ? "\u2713" : "\u26A0\uFE0F"}`
    });
    const perplexityOption = providerDropdown.createEl("option", {
      value: "perplexity",
      text: `Perplexity AI ${this.checkApiKey("perplexity") ? "\u2713" : "\u26A0\uFE0F"}`
    });
    const tavilyOption = providerDropdown.createEl("option", {
      value: "tavily",
      text: `Tavily Search ${this.checkApiKey("tavily") ? "\u2713" : "\u26A0\uFE0F"}`
    });
    const exaOption = providerDropdown.createEl("option", {
      value: "exa",
      text: `Exa AI Search ${this.checkApiKey("exa") ? "\u2713" : "\u26A0\uFE0F"}`
    });
    providerDropdown.value = this.plugin.settings.provider;
    const modelContainer = header.createEl("div", { cls: "model-container" });
    modelContainer.createEl("span", {
      text: "Model: ",
      cls: "model-label"
    });
    const modelDropdown = modelContainer.createEl("select", { cls: "model-dropdown" });
    this.updateModelDropdown(modelDropdown, this.plugin.settings.provider);
    providerDropdown.addEventListener("change", async (e) => {
      var _a;
      const newProvider = e.target.value;
      this.plugin.settings.provider = newProvider;
      this.updateModelDropdown(modelDropdown, newProvider);
      if (((_a = this.currentResearchMode) == null ? void 0 : _a.id) === "youtube" && newProvider !== "gemini") {
        new import_obsidian.Notice("\u26A0\uFE0F YouTube mode requires Gemini provider");
        providerDropdown.value = "gemini";
        this.plugin.settings.provider = "gemini";
        this.updateModelDropdown(modelDropdown, "gemini");
      }
      await this.plugin.saveSettings();
    });
    modelDropdown.addEventListener("change", async (e) => {
      const selectedModel = e.target.value;
      await this.updateModelForCurrentMode(selectedModel);
    });
    this.messageContainer = container.createEl("div", { cls: "gemini-chat-messages" });
    this.inputContainer = container.createEl("div", { cls: "gemini-chat-input-container" });
    this.createInputArea();
    this.currentResearchMode = {
      id: "comprehensive",
      label: "\u{1F50D} Comprehensive",
      description: "Balanced research with detailed analysis",
      model: "gemini-2.5-flash",
      perplexityModel: "sonar-pro",
      exaSearchType: "auto",
      exaCategory: ""
    };
    const hasApiKey = this.checkApiKey(this.plugin.settings.provider);
    if (hasApiKey) {
      this.addMessage("system", `Welcome! Ask me anything and I'll search the web for you using ${this.plugin.settings.provider}.`);
    } else {
      this.addMessage("system", `\u26A0\uFE0F Welcome! Please configure your ${this.plugin.settings.provider} API key in plugin settings before starting.`);
    }
  }
  createInputArea() {
    var _a;
    this.inputContainer.empty();
    const inputGroup = this.inputContainer.createEl("div", { cls: "input-group" });
    const textarea = inputGroup.createEl("textarea", {
      cls: "gemini-chat-input",
      attr: {
        placeholder: "Ask anything...",
        rows: "3"
      }
    });
    const buttonGroup = inputGroup.createEl("div", { cls: "button-group" });
    const sendButton = buttonGroup.createEl("button", {
      cls: "send-button",
      text: "Send"
    });
    const saveButton = buttonGroup.createEl("button", {
      cls: "save-button",
      text: "Send & Save",
      attr: { title: "Send query and save chat to folder" }
    });
    const researchModeContainer = this.inputContainer.createEl("div", { cls: "research-mode-container-bottom" });
    researchModeContainer.createEl("div", { text: "Research Mode:", cls: "research-mode-label-small" });
    const researchButtonsContainer = researchModeContainer.createEl("div", { cls: "research-mode-buttons-bottom" });
    const maxResultsContainer = this.inputContainer.createEl("div", { cls: "max-results-container-bottom" });
    const maxResultsHeader = maxResultsContainer.createEl("div", { cls: "max-results-header" });
    maxResultsHeader.createEl("span", { text: "Max Results:", cls: "max-results-label-small" });
    maxResultsHeader.createEl("span", {
      text: "?",
      cls: "max-results-info-icon",
      attr: { title: "Controls the maximum number of search results per research mode. Changes are saved per mode and applied immediately to searches." }
    });
    const maxResultsSliderContainer = maxResultsContainer.createEl("div", { cls: "max-results-slider-container" });
    const getCurrentMaxResults = () => {
      var _a2, _b;
      const mode = ((_a2 = this.currentResearchMode) == null ? void 0 : _a2.id) || "comprehensive";
      const modeKey = mode;
      return ((_b = this.plugin.settings.researchModeConfigs[modeKey]) == null ? void 0 : _b.tavilyMaxResults) || this.plugin.settings.tavilyMaxResults || 5;
    };
    const currentValue = getCurrentMaxResults();
    const maxResultsValueDisplay = maxResultsSliderContainer.createEl("span", {
      text: currentValue.toString(),
      cls: "max-results-value-display"
    });
    const maxResultsSlider = maxResultsSliderContainer.createEl("input", {
      type: "range",
      cls: "max-results-slider-small",
      attr: {
        min: "1",
        max: "20",
        step: "1",
        value: currentValue.toString(),
        title: "Maximum number of search results (1-20)"
      }
    });
    maxResultsSlider.addEventListener("input", async (e) => {
      var _a2;
      try {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1 || value > 20) {
          console.warn(`Invalid max results value: ${value}. Resetting to 5.`);
          const defaultValue = 5;
          maxResultsSlider.value = defaultValue.toString();
          maxResultsValueDisplay.textContent = defaultValue.toString();
          return;
        }
        const mode = ((_a2 = this.currentResearchMode) == null ? void 0 : _a2.id) || "comprehensive";
        const modeKey = mode;
        if (this.plugin.settings.researchModeConfigs[modeKey]) {
          this.plugin.settings.researchModeConfigs[modeKey].tavilyMaxResults = value;
        }
        this.plugin.settings.tavilyMaxResults = value;
        maxResultsValueDisplay.textContent = value.toString();
        await this.plugin.saveSettings();
        console.log(`Max results updated for ${mode} mode: ${value}`);
        if (value !== currentValue) {
          new import_obsidian.Notice(`\u{1F4CA} Max results set to ${value} for ${mode} mode`, 2e3);
        }
      } catch (error) {
        console.error("Error updating max results:", error);
        new import_obsidian.Notice("\u26A0\uFE0F Error updating max results setting");
      }
    });
    const addDebugMethod = () => {
      window.debugMaxResults = () => {
        var _a2;
        const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
        console.log("=== Max Results Debug Info ===");
        modes.forEach((mode) => {
          var _a3;
          const modeKey = mode;
          const maxResults = ((_a3 = this.plugin.settings.researchModeConfigs[modeKey]) == null ? void 0 : _a3.tavilyMaxResults) || this.plugin.settings.tavilyMaxResults || 5;
          console.log(`${mode}: ${maxResults} results`);
        });
        console.log(`Current mode: ${((_a2 = this.currentResearchMode) == null ? void 0 : _a2.id) || "comprehensive"}`);
        console.log(`Global setting: ${this.plugin.settings.tavilyMaxResults || 5}`);
      };
    };
    addDebugMethod();
    const researchModes = [
      {
        id: "quick",
        label: "\u26A1 Quick",
        description: "Fast answers",
        model: "gemini-2.5-flash-lite",
        perplexityModel: "sonar",
        exaSearchType: "fast",
        exaCategory: ""
      },
      {
        id: "comprehensive",
        label: "\u{1F50D} Comprehensive",
        description: "Balanced research",
        model: "gemini-2.5-flash",
        perplexityModel: "sonar-pro",
        exaSearchType: "auto",
        exaCategory: ""
      },
      {
        id: "deep",
        label: "\u{1F3AF} Deep",
        description: "Expert analysis",
        model: "gemini-2.5-pro",
        perplexityModel: "sonar-deep-research",
        exaSearchType: "neural",
        exaCategory: "research paper"
      },
      {
        id: "reasoning",
        label: "\u{1F9E0} Reasoning",
        description: "Complex analysis",
        model: "gemini-2.5-pro",
        perplexityModel: "sonar-reasoning",
        exaSearchType: "neural",
        exaCategory: "research paper"
      },
      {
        id: "youtube",
        label: "\u{1F3AC} YouTube",
        description: "Video analysis",
        model: "gemini-2.5-pro",
        perplexityModel: "sonar-pro",
        // Not used but required for interface
        exaSearchType: "auto",
        exaCategory: "",
        providerLock: "gemini",
        requiresUrl: true
      }
    ];
    researchModes.forEach((mode) => {
      const button = researchButtonsContainer.createEl("button", {
        cls: `research-mode-btn-small research-mode-${mode.id}`,
        attr: { "data-mode": mode.id },
        text: mode.label
      });
      button.addEventListener("click", () => {
        this.setResearchMode(mode);
        const buttons = researchButtonsContainer.querySelectorAll(".research-mode-btn-small");
        buttons.forEach((btn) => btn.removeClass("active"));
        button.addClass("active");
      });
    });
    (_a = researchButtonsContainer.querySelector('[data-mode="comprehensive"]')) == null ? void 0 : _a.addClass("active");
    sendButton.onclick = () => this.handleSend(textarea.value, false);
    saveButton.onclick = () => this.handleSend(textarea.value, false, true);
    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    };
    textarea.addEventListener("input", autoResize);
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSend(textarea.value, false);
      }
    });
    autoResize();
  }
  async handleSend(message, insertToNote, saveToFolder = false) {
    var _a, _b, _c;
    if (!message.trim())
      return;
    const textarea = this.inputContainer.querySelector(".gemini-chat-input");
    const sendButton = this.inputContainer.querySelector(".send-button");
    const saveButton = this.inputContainer.querySelector(".save-button");
    const originalValue = textarea.value;
    textarea.value = "";
    textarea.disabled = true;
    sendButton.disabled = true;
    saveButton.disabled = true;
    this.addMessage("user", message);
    const provider = this.plugin.settings.provider;
    const isSearchMode = (_b = (_a = this.plugin.settings.providerSearchModes) == null ? void 0 : _a[provider]) != null ? _b : true;
    let thinkingMessage = "Thinking...";
    if (isSearchMode) {
      thinkingMessage = `Searching the web with ${provider}...`;
    } else {
      thinkingMessage = `Chatting with ${provider}...`;
    }
    const thinkingId = this.addMessage("assistant", thinkingMessage, true);
    if (((_c = this.currentResearchMode) == null ? void 0 : _c.requiresUrl) && !this.isValidYouTubeUrl(message) && !this.currentVideoContext) {
      const errorMessage = "\u274C YouTube mode requires a valid YouTube URL. Please paste a YouTube video URL first.";
      this.updateMessage(thinkingId, errorMessage);
      return;
    }
    try {
      let response;
      if (isSearchMode) {
        response = await this.plugin.performWebSearch(message);
      } else {
        if (provider === "gemini") {
          response = await this.plugin.performGeminiChat(message, this.getChatHistory());
        } else if (provider === "perplexity") {
          response = await this.plugin.performPerplexityChat(message, this.getChatHistory());
        } else {
          response = await this.plugin.performWebSearch(message);
        }
      }
      this.updateMessage(thinkingId, response);
      if (insertToNote) {
        this.insertToActiveNote(response);
      }
      if (saveToFolder && this.plugin.settings.chatSaveEnabled) {
        await this.saveToFolder();
      }
    } catch (error) {
      const errorMessage = `\u274C Error: ${error instanceof Error ? error.message : String(error)}`;
      this.updateMessage(thinkingId, errorMessage);
      textarea.value = originalValue;
    } finally {
      textarea.disabled = false;
      sendButton.disabled = false;
      saveButton.disabled = false;
      textarea.focus();
    }
  }
  // Get chat history for context in chat mode
  getChatHistory() {
    if (!this.plugin.settings.contextMemoryEnabled) {
      return [];
    }
    const messages = [];
    const messageElements = this.messageContainer.querySelectorAll(".chat-message");
    messageElements.forEach((element) => {
      var _a;
      const role = element.getAttribute("data-role");
      const content = ((_a = element.querySelector(".message-content")) == null ? void 0 : _a.textContent) || "";
      if (role && content && role !== "system" && !content.includes("Searching the web...") && !content.includes("Thinking...") && !content.includes("Analyzing YouTube video...")) {
        messages.push({
          role: role === "user" ? "user" : "assistant",
          content
        });
      }
    });
    switch (this.plugin.settings.contextMemoryStrategy) {
      case "recent":
        return messages.slice(-this.plugin.settings.maxContextMessages);
      case "token-limit":
        const tokenLimit = this.plugin.settings.maxContextMessages * 100;
        let currentTokens = 0;
        const limitedMessages = [];
        for (let i = messages.length - 1; i >= 0; i--) {
          const messageTokens = Math.ceil(messages[i].content.length / 4);
          if (currentTokens + messageTokens > tokenLimit)
            break;
          currentTokens += messageTokens;
          limitedMessages.unshift(messages[i]);
        }
        return limitedMessages;
      case "summary":
        if (messages.length <= this.plugin.settings.maxContextMessages) {
          return messages;
        }
        const firstMessage = messages[0];
        const lastMessages = messages.slice(-Math.floor(this.plugin.settings.maxContextMessages / 2));
        const middleMessages = messages.slice(1, -Math.floor(this.plugin.settings.maxContextMessages / 2));
        const summaryContent = middleMessages.map(
          (msg) => `${msg.role}: ${msg.content.substring(0, 100)}...`
        ).join("\n");
        const summaryMessage = {
          role: "system",
          content: `[Context Summary] Previous conversation included:
${summaryContent}`
        };
        return [firstMessage, summaryMessage, ...lastMessages];
      default:
        return messages.slice(-this.plugin.settings.maxContextMessages);
    }
  }
  setResearchMode(mode) {
    var _a;
    this.currentResearchMode = mode;
    const modelDropdown = this.containerEl.querySelector(".model-dropdown");
    if (modelDropdown) {
      this.updateModelDropdown(modelDropdown, this.plugin.settings.provider);
    }
    const maxResultsSlider = this.containerEl.querySelector(".max-results-slider-small");
    const maxResultsValueDisplay = this.containerEl.querySelector(".max-results-value-display");
    if (maxResultsSlider && maxResultsValueDisplay) {
      try {
        const modeKey = mode.id;
        const currentValue = ((_a = this.plugin.settings.researchModeConfigs[modeKey]) == null ? void 0 : _a.tavilyMaxResults) || this.plugin.settings.tavilyMaxResults || 5;
        const validValue = Math.max(1, Math.min(20, parseInt(currentValue.toString()) || 5));
        maxResultsSlider.value = validValue.toString();
        maxResultsValueDisplay.textContent = validValue.toString();
        console.log(`Max results slider updated for ${mode.id} mode: ${validValue}`);
      } catch (error) {
        console.error("Error updating max results slider:", error);
      }
    }
    if (mode.id === "youtube") {
      if (this.plugin.settings.provider !== "gemini") {
        this.plugin.settings.provider = "gemini";
        this.plugin.saveSettings();
        const providerDropdown = this.containerEl.querySelector(".provider-dropdown");
        if (providerDropdown) {
          providerDropdown.value = "gemini";
        }
        if (modelDropdown) {
          this.updateModelDropdown(modelDropdown, "gemini");
        }
        new import_obsidian.Notice("\u{1F3AC} Switched to Gemini provider for YouTube video analysis");
      }
      this.plugin.settings.geminiModel = "gemini-2.5-pro";
      this.plugin.saveSettings();
    }
    if (this.plugin.settings.provider === "gemini") {
      this.plugin.settings.geminiModel = mode.model;
    } else if (this.plugin.settings.provider === "perplexity") {
      this.plugin.settings.perplexityModel = mode.perplexityModel;
    } else if (this.plugin.settings.provider === "exa") {
      this.plugin.settings.exaSearchType = mode.exaSearchType;
      this.plugin.settings.exaCategory = mode.exaCategory;
    }
    this.plugin.saveSettings();
    this.addMessage("system", `Research mode set to ${mode.label}: ${mode.description}`);
  }
  // NEW: Update model dropdown based on provider and research mode
  updateModelDropdown(dropdown, provider) {
    var _a;
    dropdown.empty();
    const modelOptions = this.getAvailableModels(provider, (_a = this.currentResearchMode) == null ? void 0 : _a.id);
    modelOptions.forEach((model) => {
      const option = dropdown.createEl("option", {
        value: model.id,
        text: model.displayName
      });
      if (this.isCurrentModel(model.id, provider)) {
        option.selected = true;
      }
    });
  }
  // NEW: Get available models for provider + research mode
  getAvailableModels(provider, researchMode) {
    const models = [];
    switch (provider) {
      case "gemini":
        models.push(
          { id: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro (Best Quality)", compatible: ["comprehensive", "deep", "reasoning", "youtube"] },
          { id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (Balanced)", compatible: ["quick", "comprehensive", "deep"] },
          { id: "gemini-2.5-flash-lite", displayName: "Gemini 2.5 Flash Lite (Fastest)", compatible: ["quick"] }
        );
        break;
      case "perplexity":
        models.push(
          { id: "sonar-reasoning-pro", displayName: "Sonar Reasoning Pro (Advanced)", compatible: ["reasoning", "deep"] },
          { id: "sonar-pro", displayName: "Sonar Pro (Advanced Search)", compatible: ["comprehensive", "deep"] },
          { id: "sonar", displayName: "Sonar (Standard)", compatible: ["quick", "comprehensive"] },
          { id: "sonar-deep-research", displayName: "Sonar Deep Research (Exhaustive)", compatible: ["deep"] },
          { id: "sonar-reasoning", displayName: "Sonar Reasoning (Fast)", compatible: ["reasoning"] }
        );
        break;
      case "tavily":
        models.push({ id: "tavily-search", displayName: "Tavily Search", compatible: ["quick", "comprehensive", "deep"] });
        break;
      case "exa":
        models.push({ id: "exa-neural", displayName: "Neural Search", compatible: ["comprehensive", "deep", "reasoning"] });
        break;
    }
    if (researchMode) {
      return models.filter((model) => model.compatible.includes(researchMode));
    }
    return models;
  }
  // NEW: Check if model is currently selected
  isCurrentModel(modelId, provider) {
    var _a;
    const mode = (_a = this.currentResearchMode) == null ? void 0 : _a.id;
    if (!mode)
      return false;
    const modeConfig = this.plugin.settings.researchModeConfigs[mode];
    switch (provider) {
      case "gemini":
        return modeConfig.geminiModel === modelId;
      case "perplexity":
        return modeConfig.perplexityModel === modelId;
      default:
        return false;
    }
  }
  // NEW: Update model for current research mode
  async updateModelForCurrentMode(modelId) {
    var _a;
    const provider = this.plugin.settings.provider;
    const mode = (_a = this.currentResearchMode) == null ? void 0 : _a.id;
    if (!mode)
      return;
    const availableModels = this.getAvailableModels(provider, mode);
    const selectedModel = availableModels.find((m) => m.id === modelId);
    if (!selectedModel) {
      new import_obsidian.Notice(`\u26A0\uFE0F Model ${modelId} not compatible with ${mode} mode`);
      return;
    }
    const modeKey = mode;
    switch (provider) {
      case "gemini":
        this.plugin.settings.researchModeConfigs[modeKey].geminiModel = modelId;
        break;
      case "perplexity":
        this.plugin.settings.researchModeConfigs[modeKey].perplexityModel = modelId;
        break;
    }
    await this.plugin.saveSettings();
    new import_obsidian.Notice(`\u2705 Updated ${mode} mode to use ${selectedModel.displayName}`);
  }
  addMessage(role, content, isThinking = false) {
    const messageId = Date.now().toString();
    const messageDiv = this.messageContainer.createEl("div", {
      cls: `message ${role}`,
      attr: { "data-id": messageId, "data-role": role }
    });
    if (role === "user") {
      messageDiv.createEl("div", { cls: "message-role", text: "You" });
    } else if (role === "assistant") {
      const roleHeader = messageDiv.createEl("div", { cls: "message-role-header" });
      roleHeader.createEl("span", { cls: "message-role", text: "AI Assistant" });
      const copyButton = roleHeader.createEl("button", {
        cls: "copy-button",
        text: "\u{1F4CB} Copy"
      });
      copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(content);
        copyButton.textContent = "\u2705 Copied!";
        setTimeout(() => {
          copyButton.textContent = "\u{1F4CB} Copy";
        }, 2e3);
      });
    }
    const contentDiv = messageDiv.createEl("div", { cls: "message-content" });
    if (isThinking) {
      contentDiv.addClass("thinking");
      const progressContainer = contentDiv.createEl("div", { cls: "progress-container" });
      const progressBar = progressContainer.createEl("div", { cls: "progress-bar" });
      const progressFill = progressBar.createEl("div", { cls: "progress-bar-fill" });
      const thinkingText = contentDiv.createEl("div", { cls: "thinking-text" });
      thinkingText.textContent = content;
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
          progress = 90;
          clearInterval(progressInterval);
        }
        progressFill.style.width = `${progress}%`;
      }, 200);
      messageDiv.setAttribute("data-progress-interval", progressInterval.toString());
    }
    contentDiv.addClass("selectable-text");
    if (role === "assistant" && !isThinking) {
      this.renderMarkdownContent(contentDiv, content);
    } else {
      contentDiv.textContent = content;
    }
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    return messageId;
  }
  updateMessage(messageId, newContent) {
    const messageEl = this.messageContainer.querySelector(`[data-id="${messageId}"]`);
    if (messageEl) {
      const intervalId = messageEl.getAttribute("data-progress-interval");
      if (intervalId) {
        clearInterval(parseInt(intervalId));
      }
      const contentEl = messageEl.querySelector(".message-content");
      if (contentEl) {
        contentEl.removeClass("thinking");
        contentEl.addClass("selectable-text");
        const progressFill = contentEl.querySelector(".progress-bar-fill");
        if (progressFill) {
          progressFill.style.width = "100%";
          setTimeout(() => {
            const progressContainer = contentEl.querySelector(".progress-container");
            if (progressContainer) {
              progressContainer.remove();
            }
            const thinkingText = contentEl.querySelector(".thinking-text");
            if (thinkingText) {
              thinkingText.remove();
            }
            this.renderMarkdownContent(contentEl, newContent);
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
          }, 300);
        } else {
          this.renderMarkdownContent(contentEl, newContent);
          this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
        const copyButton = messageEl.querySelector(".copy-button");
        if (copyButton) {
          copyButton.onclick = () => {
            navigator.clipboard.writeText(newContent);
            copyButton.textContent = "\u2705 Copied!";
            setTimeout(() => {
              copyButton.textContent = "\u{1F4CB} Copy";
            }, 2e3);
          };
        }
      }
    }
  }
  insertToActiveNote(content) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(`

${content}
`, cursor);
      new import_obsidian.Notice("Response inserted to note");
    } else {
      new import_obsidian.Notice("No active note to insert into");
    }
  }
  // Method to clear chat and start fresh conversation
  clearChat() {
    const hasMessages = this.messageContainer && this.messageContainer.children.length > 1;
    if (hasMessages) {
      const confirmed = confirm("Are you sure you want to start a new chat? This will clear the current conversation.");
      if (!confirmed) {
        return;
      }
    }
    if (this.messageContainer) {
      this.messageContainer.addClass("clearing");
      setTimeout(() => {
        this.messageContainer.empty();
        this.messageContainer.removeClass("clearing");
        this.currentResearchMode = {
          id: "comprehensive",
          label: "\u{1F50D} Comprehensive",
          description: "Balanced research with detailed analysis",
          model: "gemini-2.5-flash",
          perplexityModel: "sonar-pro",
          exaSearchType: "auto",
          exaCategory: ""
        };
        const buttons = this.containerEl.querySelectorAll(".research-mode-btn-small");
        buttons.forEach((btn) => {
          btn.removeClass("active");
          if (btn.getAttribute("data-mode") === "comprehensive") {
            btn.addClass("active");
          }
        });
        const hasApiKey = this.checkApiKey(this.plugin.settings.provider);
        const welcomeMessage = hasApiKey ? `\u{1F195} New conversation started! Ask me anything and I'll search the web for you using ${this.plugin.settings.provider}.` : `\u26A0\uFE0F New conversation started! Please configure your ${this.plugin.settings.provider} API key in plugin settings before starting.`;
        this.addMessage("system", welcomeMessage);
        setTimeout(() => {
          const inputEl = this.containerEl.querySelector(".gemini-chat-input");
          if (inputEl) {
            inputEl.focus();
            inputEl.placeholder = "Ask anything to start your new conversation...";
            setTimeout(() => {
              inputEl.placeholder = "Ask anything...";
            }, 3e3);
          }
        }, 100);
      }, 200);
    } else {
      const inputEl = this.containerEl.querySelector(".gemini-chat-input");
      if (inputEl) {
        inputEl.focus();
      }
    }
  }
  // Method to check if provider has API key configured
  checkApiKey(provider) {
    switch (provider) {
      case "gemini":
        return !!this.plugin.settings.geminiApiKey;
      case "perplexity":
        return !!this.plugin.settings.perplexityApiKey;
      case "tavily":
        return !!this.plugin.settings.tavilyApiKey;
      case "exa":
        return !!this.plugin.settings.exaApiKey;
      default:
        return false;
    }
  }
  // Add markdown rendering method
  renderMarkdownContent(container, content) {
    container.empty();
    const lines = content.split("\n");
    let currentElement = container;
    let inCodeBlock = false;
    let codeBlockContent = [];
    lines.forEach((line) => {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          const pre = container.createEl("pre");
          const code = pre.createEl("code");
          code.textContent = codeBlockContent.join("\n");
          codeBlockContent = [];
          inCodeBlock = false;
          currentElement = container;
        } else {
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeBlockContent.push(line);
      } else if (line.startsWith("### ")) {
        const h3 = container.createEl("h3");
        h3.textContent = line.replace("### ", "");
        currentElement = container;
      } else if (line.startsWith("## ")) {
        const h2 = container.createEl("h2");
        h2.textContent = line.replace("## ", "");
        currentElement = container;
      } else if (line.startsWith("# ")) {
        const h1 = container.createEl("h1");
        h1.textContent = line.replace("# ", "");
        currentElement = container;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        if (currentElement.tagName !== "UL") {
          currentElement = container.createEl("ul");
        }
        const li = currentElement.createEl("li");
        this.parseInlineMarkdown(li, line.replace(/^[*-] /, ""));
      } else if (line.startsWith("**Sources:**") || line.startsWith("--- ")) {
        if (line.startsWith("--- ")) {
          container.createEl("hr");
        } else {
          const sourcesHeader = container.createEl("h4");
          sourcesHeader.textContent = "Sources:";
        }
        currentElement = container;
      } else if (line.trim() === "") {
        container.createEl("br");
        currentElement = container;
      } else {
        if (currentElement.tagName === "UL") {
          currentElement = container;
        }
        const p = container.createEl("p");
        this.parseInlineMarkdown(p, line);
      }
    });
  }
  // Parse inline markdown (bold, italic, links, code)
  parseInlineMarkdown(element, text) {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="external-link">$1 \u{1F517}</a>');
    html = html.replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="external-link">$1 \u{1F517}</a>');
    html = html.replace(/\[(\d+)\]/g, `<a href="#citation-$1" class="citation-link" onclick="this.closest('.message-content').querySelector('h4:contains(Sources), strong:contains(Sources)')?.scrollIntoView({behavior: 'smooth', block: 'center'})">[$1]</a>`);
    element.innerHTML = html;
    const citationLinks = element.querySelectorAll(".citation-link");
    citationLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const messageElement = element.closest(".message-content");
        if (messageElement) {
          const sourcesHeader = Array.from(messageElement.querySelectorAll("strong, h4")).find((el) => {
            var _a;
            return (_a = el.textContent) == null ? void 0 : _a.includes("Sources");
          });
          if (sourcesHeader) {
            sourcesHeader.scrollIntoView({ behavior: "smooth", block: "center" });
            sourcesHeader.style.backgroundColor = "var(--interactive-accent)";
            sourcesHeader.style.color = "white";
            sourcesHeader.style.padding = "8px";
            sourcesHeader.style.borderRadius = "4px";
            sourcesHeader.style.transition = "all 0.3s ease";
            setTimeout(() => {
              sourcesHeader.style.backgroundColor = "";
              sourcesHeader.style.color = "";
              sourcesHeader.style.padding = "";
            }, 2e3);
          }
        }
      });
    });
  }
  async saveToFolder() {
    try {
      const folderPath = this.plugin.settings.chatFolderName;
      const vault = this.app.vault;
      const folder = vault.getAbstractFileByPath(folderPath);
      if (!folder) {
        await vault.createFolder(folderPath);
      }
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      const firstUserMessage = this.getFirstUserMessage() || "chat";
      const query = firstUserMessage.slice(0, 50).replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      let filename;
      switch (this.plugin.settings.chatNoteTemplate) {
        case "timestamp-query":
          filename = `${timestamp}-${query}`;
          break;
        case "query-timestamp":
          filename = `${query}-${timestamp}`;
          break;
        case "query-only":
          filename = query;
          break;
        case "counter":
          const existingFiles = vault.getMarkdownFiles().filter(
            (f) => f.path.startsWith(folderPath) && f.basename.startsWith("chat-")
          );
          filename = `chat-${existingFiles.length + 1}`;
          break;
        default:
          filename = `${timestamp}-${query}`;
      }
      let uniqueFilename = `${filename}.md`;
      let counter = 1;
      while (vault.getAbstractFileByPath(`${folderPath}/${uniqueFilename}`)) {
        uniqueFilename = `${filename}-${counter}.md`;
        counter++;
      }
      const chatContent = this.formatChatNote();
      const filePath = `${folderPath}/${uniqueFilename}`;
      await vault.create(filePath, chatContent);
      new import_obsidian.Notice(`Chat saved to: ${filePath}`);
    } catch (error) {
      new import_obsidian.Notice(`Failed to save chat: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Save to folder error:", error);
    }
  }
  formatChatNote() {
    const timestamp = new Date().toLocaleString();
    const provider = this.plugin.settings.provider;
    const researchMode = this.currentResearchMode;
    let content = `# AI Web Search Chat

`;
    content += `**Date:** ${timestamp}
`;
    content += `**Provider:** ${provider}
`;
    content += `**Research Mode:** ${researchMode}

`;
    content += `---

`;
    const messageElements = this.messageContainer.querySelectorAll(".message");
    messageElements.forEach((messageEl) => {
      var _a, _b;
      const roleEl = messageEl.querySelector(".message-role");
      const contentEl = messageEl.querySelector(".message-content");
      if (roleEl && contentEl) {
        const role = (_a = roleEl.textContent) == null ? void 0 : _a.trim();
        const messageContent = ((_b = contentEl.textContent) == null ? void 0 : _b.trim()) || "";
        if (role === "You") {
          content += `## \u{1F64B} You

${messageContent}

`;
        } else if (role === "AI Assistant" && !messageContent.includes("Searching the web...")) {
          content += `## \u{1F916} AI Assistant

${messageContent}

`;
        }
      }
    });
    content += `
---
*Generated by AI Web Search Plugin*`;
    return content;
  }
  getFirstUserMessage() {
    var _a;
    const userMessages = this.messageContainer.querySelectorAll(".message.user .message-content");
    if (userMessages.length > 0) {
      return ((_a = userMessages[0].textContent) == null ? void 0 : _a.trim()) || "";
    }
    return "";
  }
  // YouTube URL validation helper
  isValidYouTubeUrl(url) {
    const youtubeRegex = /^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?$/;
    return youtubeRegex.test(url.trim());
  }
  extractYouTubeVideoId(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
  // YouTube video context management
  clearVideoContext() {
    this.currentVideoContext = null;
    this.updateVideoContextUI();
  }
  setVideoContext(url, videoId, title) {
    this.currentVideoContext = {
      url,
      videoId,
      title,
      analyzed: true
    };
    this.updateVideoContextUI();
  }
  updateVideoContextUI() {
    var _a;
    if (!this.videoContextContainer || !this.videoContextTitle)
      return;
    if (this.currentVideoContext && ((_a = this.currentResearchMode) == null ? void 0 : _a.id) === "youtube") {
      this.videoContextContainer.style.display = "block";
      this.videoContextTitle.textContent = this.currentVideoContext.title || `Video ${this.currentVideoContext.videoId}`;
    } else {
      this.videoContextContainer.style.display = "none";
    }
  }
  // Public method to get video context
  getVideoContext() {
    return this.currentVideoContext;
  }
  async onClose() {
  }
};
var SearchModal = class {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  open() {
    new import_obsidian.Notice("Search modal coming soon...");
  }
};
var GeminiSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "AI Web Search Settings" });
    new import_obsidian.Setting(containerEl).setName("AI Provider").setDesc("Choose your preferred AI provider").addDropdown((dropdown) => dropdown.addOption("gemini", "Google Gemini").addOption("perplexity", "Perplexity AI").addOption("tavily", "Tavily").addOption("exa", "Exa").setValue(this.plugin.settings.provider).onChange(async (value) => {
      this.plugin.settings.provider = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Gemini API Key").setDesc("Enter your Google AI Studio API key").addText((text) => text.setPlaceholder("Enter API key").setValue(this.plugin.settings.geminiApiKey).onChange(async (value) => {
      this.plugin.settings.geminiApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Perplexity API Key").setDesc("Enter your Perplexity API key").addText((text) => text.setPlaceholder("Enter API key").setValue(this.plugin.settings.perplexityApiKey).onChange(async (value) => {
      this.plugin.settings.perplexityApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Tavily API Key").setDesc("Enter your Tavily API key").addText((text) => text.setPlaceholder("Enter API key").setValue(this.plugin.settings.tavilyApiKey).onChange(async (value) => {
      this.plugin.settings.tavilyApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Exa API Key").setDesc("Enter your Exa API key").addText((text) => text.setPlaceholder("Enter API key").setValue(this.plugin.settings.exaApiKey).onChange(async (value) => {
      this.plugin.settings.exaApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Insert Mode").setDesc("How to insert search results").addDropdown((dropdown) => dropdown.addOption("replace", "Replace Selection").addOption("append", "Append to Document").setValue(this.plugin.settings.insertMode).onChange(async (value) => {
      this.plugin.settings.insertMode = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Max Results").setDesc("Maximum number of search results").addSlider((slider) => slider.setLimits(1, 20, 1).setValue(this.plugin.settings.maxResults).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.maxResults = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Include Images").setDesc("Include images in search results when supported").addToggle((toggle) => toggle.setValue(this.plugin.settings.includeImages).onChange(async (value) => {
      this.plugin.settings.includeImages = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Show Advanced Settings").setDesc("Show provider-specific advanced configuration options").addToggle((toggle) => toggle.setValue(this.plugin.settings.uiPreferences.showAdvancedSettings).onChange(async (value) => {
      this.plugin.settings.uiPreferences.showAdvancedSettings = value;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (this.plugin.settings.uiPreferences.showAdvancedSettings) {
      const advancedContainer = containerEl.createDiv("advanced-settings-container");
      advancedContainer.createEl("h3", { text: "Advanced Provider Settings" });
      const tabContainer = advancedContainer.createDiv("advanced-tabs-container");
      const content = advancedContainer.createDiv("advanced-content");
      const tabs = [
        { id: "gemini", label: "Gemini", method: () => this.addGeminiAdvancedSettings(content) },
        { id: "perplexity", label: "Perplexity", method: () => this.addPerplexityAdvancedSettings(content) },
        { id: "tavily", label: "Tavily", method: () => this.addTavilyAdvancedSettings(content) },
        { id: "exa", label: "Exa", method: () => this.addExaAdvancedSettings(content) }
      ];
      tabs.forEach((tab, index) => {
        const tabButton = tabContainer.createEl("button", {
          text: tab.label,
          cls: index === 0 ? "advanced-tab active" : "advanced-tab"
        });
        tabButton.onclick = () => {
          tabContainer.querySelectorAll(".advanced-tab").forEach((t) => t.removeClass("active"));
          tabButton.addClass("active");
          content.empty();
          tab.method();
        };
      });
      tabs[0].method();
    }
  }
  addGeminiAdvancedSettings(containerEl) {
    containerEl.createEl("h5", { text: "Gemini Advanced Parameters" });
    containerEl.createEl("p", {
      text: "Configure advanced Gemini model parameters for fine-tuned responses. These settings affect all research modes.",
      cls: "settings-help-text"
    });
    new import_obsidian.Setting(containerEl).setName("Gemini Model").setDesc("Choose the Gemini model variant (affects cost and capabilities)").addDropdown((dropdown) => dropdown.addOption("gemini-2.5-pro", "Gemini 2.5 Pro (Best Quality)").addOption("gemini-2.5-flash", "Gemini 2.5 Flash (Balanced)").addOption("gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite (Fastest)").setValue(this.plugin.settings.geminiModel || "gemini-2.5-flash").onChange(async (value) => {
      this.plugin.settings.geminiModel = value;
      const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
      modes.forEach((mode) => {
        if (this.plugin.settings.researchModeConfigs[mode]) {
          this.plugin.settings.researchModeConfigs[mode].geminiModel = value;
        }
      });
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Temperature").setDesc("Controls randomness: 0.0 = focused, 2.0 = creative (Default: 0.7)").addSlider((slider) => slider.setLimits(0, 200, 5).setValue((this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.temperature || 0.7) * 100).setDynamicTooltip().onChange(async (value) => {
      const temperature = value / 100;
      const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
      modes.forEach((mode) => {
        var _a;
        if ((_a = this.plugin.settings.researchModeConfigs[mode]) == null ? void 0 : _a.geminiParams) {
          this.plugin.settings.researchModeConfigs[mode].geminiParams.temperature = temperature;
        }
      });
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Top P (Nucleus Sampling)").setDesc("Cumulative probability cutoff: 0.1 = conservative, 1.0 = diverse (Default: 0.8)").addSlider((slider) => slider.setLimits(10, 100, 5).setValue((this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.topP || 0.8) * 100).setDynamicTooltip().onChange(async (value) => {
      const topP = value / 100;
      const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
      modes.forEach((mode) => {
        var _a;
        if ((_a = this.plugin.settings.researchModeConfigs[mode]) == null ? void 0 : _a.geminiParams) {
          this.plugin.settings.researchModeConfigs[mode].geminiParams.topP = topP;
        }
      });
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Top K").setDesc("Limits vocabulary to top K tokens: 1 = restrictive, 100 = diverse (Default: 40)").addSlider((slider) => slider.setLimits(1, 100, 1).setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.topK || 40).setDynamicTooltip().onChange(async (value) => {
      const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
      modes.forEach((mode) => {
        var _a;
        if ((_a = this.plugin.settings.researchModeConfigs[mode]) == null ? void 0 : _a.geminiParams) {
          this.plugin.settings.researchModeConfigs[mode].geminiParams.topK = value;
        }
      });
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Max Output Tokens").setDesc("Maximum response length: 256 = short, 8192 = very long (Default: 2048)").addSlider((slider) => slider.setLimits(256, 8192, 256).setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiParams.maxOutputTokens || 2048).setDynamicTooltip().onChange(async (value) => {
      const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
      modes.forEach((mode) => {
        var _a;
        if ((_a = this.plugin.settings.researchModeConfigs[mode]) == null ? void 0 : _a.geminiParams) {
          this.plugin.settings.researchModeConfigs[mode].geminiParams.maxOutputTokens = value;
        }
      });
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h6", { text: "Content Safety Settings" });
    containerEl.createEl("p", {
      text: "Configure content filtering levels for different harm categories.",
      cls: "settings-help-text"
    });
    const safetyCategories = [
      { key: "harassment", name: "Harassment", desc: "Malicious comments targeting identity/protected attributes" },
      { key: "hateSpeech", name: "Hate Speech", desc: "Content that promotes hatred toward groups" },
      { key: "sexuallyExplicit", name: "Sexually Explicit", desc: "Contains sexual or erotic content" },
      { key: "dangerousContent", name: "Dangerous Content", desc: "Promotes harmful or illegal activities" }
    ];
    safetyCategories.forEach((category) => {
      new import_obsidian.Setting(containerEl).setName(category.name).setDesc(category.desc).addDropdown((dropdown) => dropdown.addOption("BLOCK_NONE", "None - Allow all content").addOption("BLOCK_ONLY_HIGH", "High - Block only high-confidence harmful content").addOption("BLOCK_MEDIUM_AND_ABOVE", "Medium+ - Block medium and high harmful content (Default)").addOption("BLOCK_LOW_AND_ABOVE", "Low+ - Block low, medium, and high harmful content").setValue(this.plugin.settings.researchModeConfigs.comprehensive.geminiSafety[category.key] || "BLOCK_MEDIUM_AND_ABOVE").onChange(async (value) => {
        const modes = ["quick", "comprehensive", "deep", "reasoning", "youtube"];
        modes.forEach((mode) => {
          var _a;
          if ((_a = this.plugin.settings.researchModeConfigs[mode]) == null ? void 0 : _a.geminiSafety) {
            this.plugin.settings.researchModeConfigs[mode].geminiSafety[category.key] = value;
          }
        });
        await this.plugin.saveSettings();
      }));
    });
  }
  addPerplexityAdvancedSettings(containerEl) {
    containerEl.createEl("h5", { text: "Perplexity Advanced Parameters" });
    containerEl.createEl("p", {
      text: "Control Perplexity search depth and response characteristics.",
      cls: "settings-help-text"
    });
    new import_obsidian.Setting(containerEl).setName("Perplexity Model").setDesc("Choose Perplexity AI model").addDropdown((dropdown) => {
      dropdown.addOption("sonar-reasoning-pro", "Sonar Reasoning Pro (Advanced)").addOption("sonar-pro", "Sonar Pro (Advanced Search)").addOption("sonar", "Sonar (Standard)").addOption("sonar-deep-research", "Sonar Deep Research (Exhaustive)").addOption("sonar-reasoning", "Sonar Reasoning (Fast)").setValue(this.plugin.settings.perplexityModel || "sonar-pro").onChange(async (value) => {
        this.plugin.settings.perplexityModel = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          if (this.plugin.settings.researchModeConfigs[mode].perplexityModel) {
            this.plugin.settings.researchModeConfigs[mode].perplexityModel = value;
          }
        });
        await this.plugin.saveSettings();
      });
    });
    const tempContainer = containerEl.createEl("div", { cls: "setting-item" });
    const tempInfo = tempContainer.createEl("div", { cls: "setting-item-info" });
    tempInfo.createEl("div", { cls: "setting-item-name", text: "Temperature" });
    const tempDesc = tempInfo.createEl("div", { cls: "setting-item-description" });
    const currentTemp = this.plugin.settings.perplexityTemperature || 0.2;
    tempDesc.textContent = `Creativity level (0.0-2.0). Current: ${currentTemp}`;
    const tempControl = tempContainer.createEl("div", { cls: "setting-item-control" });
    const tempSlider = tempControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "0",
        max: "2.0",
        step: "0.1",
        value: currentTemp.toString()
      }
    });
    tempSlider.addEventListener("input", async (e) => {
      const value = parseFloat(e.target.value);
      this.plugin.settings.perplexityTemperature = value;
      tempDesc.textContent = `Creativity level (0.0-2.0). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityTemperature = value;
      });
      await this.plugin.saveSettings();
    });
    const maxTokensContainer = containerEl.createEl("div", { cls: "setting-item" });
    const maxTokensInfo = maxTokensContainer.createEl("div", { cls: "setting-item-info" });
    maxTokensInfo.createEl("div", { cls: "setting-item-name", text: "Max Tokens" });
    const maxTokensDesc = maxTokensInfo.createEl("div", { cls: "setting-item-description" });
    const currentMaxTokens = this.plugin.settings.perplexityMaxTokens || 1024;
    maxTokensDesc.textContent = `Maximum response length (256-4096). Current: ${currentMaxTokens}`;
    const maxTokensControl = maxTokensContainer.createEl("div", { cls: "setting-item-control" });
    const maxTokensSlider = maxTokensControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "256",
        max: "4096",
        step: "64",
        value: currentMaxTokens.toString()
      }
    });
    maxTokensSlider.addEventListener("input", async (e) => {
      const value = parseInt(e.target.value);
      this.plugin.settings.perplexityMaxTokens = value;
      maxTokensDesc.textContent = `Maximum response length (256-4096). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityMaxTokens = value;
      });
      await this.plugin.saveSettings();
    });
    const topPContainer = containerEl.createEl("div", { cls: "setting-item" });
    const topPInfo = topPContainer.createEl("div", { cls: "setting-item-info" });
    topPInfo.createEl("div", { cls: "setting-item-name", text: "Top P" });
    const topPDesc = topPInfo.createEl("div", { cls: "setting-item-description" });
    const currentTopP = this.plugin.settings.perplexityTopP || 1;
    topPDesc.textContent = `Nucleus sampling (0.1-1.0). Current: ${currentTopP}`;
    const topPControl = topPContainer.createEl("div", { cls: "setting-item-control" });
    const topPSlider = topPControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "0.1",
        max: "1.0",
        step: "0.05",
        value: currentTopP.toString()
      }
    });
    topPSlider.addEventListener("input", async (e) => {
      const value = parseFloat(e.target.value);
      this.plugin.settings.perplexityTopP = value;
      topPDesc.textContent = `Nucleus sampling (0.1-1.0). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityTopP = value;
      });
      await this.plugin.saveSettings();
    });
    const topKContainer = containerEl.createEl("div", { cls: "setting-item" });
    const topKInfo = topKContainer.createEl("div", { cls: "setting-item-info" });
    topKInfo.createEl("div", { cls: "setting-item-name", text: "Top K" });
    const topKDesc = topKInfo.createEl("div", { cls: "setting-item-description" });
    const currentTopK = this.plugin.settings.perplexityTopK || 0;
    topKDesc.textContent = `Vocabulary limitation (0-100). Current: ${currentTopK}`;
    const topKControl = topKContainer.createEl("div", { cls: "setting-item-control" });
    const topKSlider = topKControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "0",
        max: "100",
        step: "5",
        value: currentTopK.toString()
      }
    });
    topKSlider.addEventListener("input", async (e) => {
      const value = parseInt(e.target.value);
      this.plugin.settings.perplexityTopK = value;
      topKDesc.textContent = `Vocabulary limitation (0-100, 0=disabled). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityTopK = value;
      });
      await this.plugin.saveSettings();
    });
    const freqPenaltyContainer = containerEl.createEl("div", { cls: "setting-item" });
    const freqPenaltyInfo = freqPenaltyContainer.createEl("div", { cls: "setting-item-info" });
    freqPenaltyInfo.createEl("div", { cls: "setting-item-name", text: "Frequency Penalty" });
    const freqPenaltyDesc = freqPenaltyInfo.createEl("div", { cls: "setting-item-description" });
    const currentFreqPenalty = this.plugin.settings.perplexityFrequencyPenalty || 0;
    freqPenaltyDesc.textContent = `Reduce repetition (-2.0 to 2.0). Current: ${currentFreqPenalty}`;
    const freqPenaltyControl = freqPenaltyContainer.createEl("div", { cls: "setting-item-control" });
    const freqPenaltySlider = freqPenaltyControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "-2.0",
        max: "2.0",
        step: "0.1",
        value: currentFreqPenalty.toString()
      }
    });
    freqPenaltySlider.addEventListener("input", async (e) => {
      const value = parseFloat(e.target.value);
      this.plugin.settings.perplexityFrequencyPenalty = value;
      freqPenaltyDesc.textContent = `Reduce repetition (-2.0 to 2.0). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityFrequencyPenalty = value;
      });
      await this.plugin.saveSettings();
    });
    const presencePenaltyContainer = containerEl.createEl("div", { cls: "setting-item" });
    const presencePenaltyInfo = presencePenaltyContainer.createEl("div", { cls: "setting-item-info" });
    presencePenaltyInfo.createEl("div", { cls: "setting-item-name", text: "Presence Penalty" });
    const presencePenaltyDesc = presencePenaltyInfo.createEl("div", { cls: "setting-item-description" });
    const currentPresencePenalty = this.plugin.settings.perplexityPresencePenalty || 0;
    presencePenaltyDesc.textContent = `Encourage new topics (-2.0 to 2.0). Current: ${currentPresencePenalty}`;
    const presencePenaltyControl = presencePenaltyContainer.createEl("div", { cls: "setting-item-control" });
    const presencePenaltySlider = presencePenaltyControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "-2.0",
        max: "2.0",
        step: "0.1",
        value: currentPresencePenalty.toString()
      }
    });
    presencePenaltySlider.addEventListener("input", async (e) => {
      const value = parseFloat(e.target.value);
      this.plugin.settings.perplexityPresencePenalty = value;
      presencePenaltyDesc.textContent = `Encourage new topics (-2.0 to 2.0). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].perplexityPresencePenalty = value;
      });
      await this.plugin.saveSettings();
    });
    new import_obsidian.Setting(containerEl).setName("Return Citations").setDesc("Include source citations in responses").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.perplexityReturnCitations) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.perplexityReturnCitations = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].perplexityReturnCitations = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Return Images").setDesc("Include images in search results when available").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.perplexityReturnImages) != null ? _a : false).onChange(async (value) => {
        this.plugin.settings.perplexityReturnImages = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].perplexityReturnImages = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Return Related Questions").setDesc("Include suggested follow-up questions").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.perplexityReturnRelated) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.perplexityReturnRelated = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].perplexityReturnRelated = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Search Domain Time").setDesc("Time range for search results").addDropdown((dropdown) => {
      dropdown.addOption("", "No time limit").addOption("hour", "Past hour").addOption("day", "Past day").addOption("week", "Past week").addOption("month", "Past month").addOption("year", "Past year").setValue(this.plugin.settings.perplexitySearchDomainFilter || "").onChange(async (value) => {
        this.plugin.settings.perplexitySearchDomainFilter = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].perplexitySearchDomainFilter = value;
        });
        await this.plugin.saveSettings();
      });
    });
  }
  addTavilyAdvancedSettings(containerEl) {
    containerEl.createEl("h5", { text: "Tavily Advanced Parameters" });
    containerEl.createEl("p", {
      text: "Configure Tavily search depth and result filtering options.",
      cls: "settings-help-text"
    });
    new import_obsidian.Setting(containerEl).setName("Search Depth").setDesc("Depth of search results to retrieve").addDropdown((dropdown) => {
      dropdown.addOption("basic", "Basic - Fast results").addOption("advanced", "Advanced - Comprehensive results").setValue(this.plugin.settings.tavilySearchDepth || "basic").onChange(async (value) => {
        this.plugin.settings.tavilySearchDepth = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilySearchDepth = value;
        });
        await this.plugin.saveSettings();
      });
    });
    const maxResultsContainer = containerEl.createEl("div", { cls: "setting-item" });
    const maxResultsInfo = maxResultsContainer.createEl("div", { cls: "setting-item-info" });
    maxResultsInfo.createEl("div", { cls: "setting-item-name", text: "Max Results" });
    const maxResultsDesc = maxResultsInfo.createEl("div", { cls: "setting-item-description" });
    const currentMaxResults = this.plugin.settings.tavilyMaxResults || 5;
    maxResultsDesc.textContent = `Maximum number of results (1-20). Current: ${currentMaxResults}`;
    const maxResultsControl = maxResultsContainer.createEl("div", { cls: "setting-item-control" });
    const maxResultsSlider = maxResultsControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "1",
        max: "20",
        step: "1",
        value: currentMaxResults.toString()
      }
    });
    maxResultsSlider.addEventListener("input", async (e) => {
      const value = parseInt(e.target.value);
      this.plugin.settings.tavilyMaxResults = value;
      maxResultsDesc.textContent = `Maximum number of results (1-20). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].tavilyMaxResults = value;
      });
      await this.plugin.saveSettings();
    });
    new import_obsidian.Setting(containerEl).setName("Include Domains").setDesc("Comma-separated list of domains to include (e.g., wikipedia.org, reddit.com)").addTextArea((text) => {
      text.setPlaceholder("Enter domains to include...").setValue(this.plugin.settings.tavilyIncludeDomains || "").onChange(async (value) => {
        this.plugin.settings.tavilyIncludeDomains = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyIncludeDomains = value;
        });
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 2;
    });
    new import_obsidian.Setting(containerEl).setName("Exclude Domains").setDesc("Comma-separated list of domains to exclude (e.g., ads.com, spam.com)").addTextArea((text) => {
      text.setPlaceholder("Enter domains to exclude...").setValue(this.plugin.settings.tavilyExcludeDomains || "").onChange(async (value) => {
        this.plugin.settings.tavilyExcludeDomains = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyExcludeDomains = value;
        });
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 2;
    });
    new import_obsidian.Setting(containerEl).setName("Include Answer").setDesc("Include a direct answer in addition to search results").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.tavilyIncludeAnswer) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.tavilyIncludeAnswer = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyIncludeAnswer = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Include Raw Content").setDesc("Include the raw HTML content of search results").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.tavilyIncludeRawContent) != null ? _a : false).onChange(async (value) => {
        this.plugin.settings.tavilyIncludeRawContent = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyIncludeRawContent = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Include Images").setDesc("Include images in search results when available").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.tavilyIncludeImages) != null ? _a : false).onChange(async (value) => {
        this.plugin.settings.tavilyIncludeImages = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyIncludeImages = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Topic").setDesc("Topic category for search context (general, news, etc.)").addDropdown((dropdown) => {
      dropdown.addOption("general", "General").addOption("news", "News").addOption("science", "Science").addOption("technology", "Technology").addOption("business", "Business").addOption("health", "Health").addOption("entertainment", "Entertainment").addOption("sports", "Sports").setValue(this.plugin.settings.tavilyTopic || "general").onChange(async (value) => {
        this.plugin.settings.tavilyTopic = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].tavilyTopic = value;
        });
        await this.plugin.saveSettings();
      });
    });
    const daysContainer = containerEl.createEl("div", { cls: "setting-item" });
    const daysInfo = daysContainer.createEl("div", { cls: "setting-item-info" });
    daysInfo.createEl("div", { cls: "setting-item-name", text: "Recent Content Days" });
    const daysDesc = daysInfo.createEl("div", { cls: "setting-item-description" });
    const currentDays = this.plugin.settings.tavilyDays || 0;
    daysDesc.textContent = `Limit to content from last N days (0=no limit). Current: ${currentDays}`;
    const daysControl = daysContainer.createEl("div", { cls: "setting-item-control" });
    const daysSlider = daysControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "0",
        max: "365",
        step: "1",
        value: currentDays.toString()
      }
    });
    daysSlider.addEventListener("input", async (e) => {
      const value = parseInt(e.target.value);
      this.plugin.settings.tavilyDays = value;
      daysDesc.textContent = `Limit to content from last N days (0=no limit). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].tavilyDays = value;
      });
      await this.plugin.saveSettings();
    });
  }
  addExaAdvancedSettings(containerEl) {
    containerEl.createEl("h5", { text: "Exa Neural Search Advanced Parameters" });
    containerEl.createEl("p", {
      text: "Exa offers the most customization options for semantic search and content filtering.",
      cls: "settings-help-text"
    });
    new import_obsidian.Setting(containerEl).setName("Search Type").setDesc("Type of search to perform").addDropdown((dropdown) => {
      dropdown.addOption("neural", "Neural - Semantic understanding").addOption("keyword", "Keyword - Traditional search").addOption("auto", "Auto - Best of both").setValue(this.plugin.settings.exaSearchType || "neural").onChange(async (value) => {
        this.plugin.settings.exaSearchType = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaSearchType = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Use Autoprompt").setDesc("Automatically enhance queries for better results").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.exaUseAutoprompt) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.exaUseAutoprompt = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaUseAutoprompt = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Category").setDesc("Content category to focus search on").addDropdown((dropdown) => {
      dropdown.addOption("", "Any category").addOption("company", "Company").addOption("research paper", "Research Paper").addOption("news", "News").addOption("github", "GitHub").addOption("tweet", "Tweet").addOption("movie", "Movie").addOption("song", "Song").addOption("personal site", "Personal Site").addOption("pdf", "PDF Document").setValue(this.plugin.settings.exaCategory || "").onChange(async (value) => {
        this.plugin.settings.exaCategory = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaCategory = value;
        });
        await this.plugin.saveSettings();
      });
    });
    const numResultsContainer = containerEl.createEl("div", { cls: "setting-item" });
    const numResultsInfo = numResultsContainer.createEl("div", { cls: "setting-item-info" });
    numResultsInfo.createEl("div", { cls: "setting-item-name", text: "Number of Results" });
    const numResultsDesc = numResultsInfo.createEl("div", { cls: "setting-item-description" });
    const currentNumResults = this.plugin.settings.exaNumResults || 10;
    numResultsDesc.textContent = `Number of results to return (1-20). Current: ${currentNumResults}`;
    const numResultsControl = numResultsContainer.createEl("div", { cls: "setting-item-control" });
    const numResultsSlider = numResultsControl.createEl("input", {
      type: "range",
      cls: "slider",
      attr: {
        min: "1",
        max: "20",
        step: "1",
        value: currentNumResults.toString()
      }
    });
    numResultsSlider.addEventListener("input", async (e) => {
      const value = parseInt(e.target.value);
      this.plugin.settings.exaNumResults = value;
      numResultsDesc.textContent = `Number of results to return (1-20). Current: ${value}`;
      Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
        this.plugin.settings.researchModeConfigs[mode].exaNumResults = value;
      });
      await this.plugin.saveSettings();
    });
    new import_obsidian.Setting(containerEl).setName("Include Domains").setDesc("Comma-separated list of domains to include (e.g., wikipedia.org, arxiv.org)").addTextArea((text) => {
      text.setPlaceholder("Enter domains to include...").setValue(this.plugin.settings.exaIncludeDomains || "").onChange(async (value) => {
        this.plugin.settings.exaIncludeDomains = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaIncludeDomains = value;
        });
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 2;
    });
    new import_obsidian.Setting(containerEl).setName("Exclude Domains").setDesc("Comma-separated list of domains to exclude (e.g., pinterest.com, quora.com)").addTextArea((text) => {
      text.setPlaceholder("Enter domains to exclude...").setValue(this.plugin.settings.exaExcludeDomains || "").onChange(async (value) => {
        this.plugin.settings.exaExcludeDomains = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaExcludeDomains = value;
        });
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 2;
    });
    new import_obsidian.Setting(containerEl).setName("Start Crawl Date").setDesc("Only include results crawled after this date (YYYY-MM-DD format)").addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.exaStartCrawlDate || "").onChange(async (value) => {
        this.plugin.settings.exaStartCrawlDate = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaStartCrawlDate = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("End Crawl Date").setDesc("Only include results crawled before this date (YYYY-MM-DD format)").addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.exaEndCrawlDate || "").onChange(async (value) => {
        this.plugin.settings.exaEndCrawlDate = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaEndCrawlDate = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Start Published Date").setDesc("Only include results published after this date (YYYY-MM-DD format)").addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.exaStartPublishedDate || "").onChange(async (value) => {
        this.plugin.settings.exaStartPublishedDate = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaStartPublishedDate = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("End Published Date").setDesc("Only include results published before this date (YYYY-MM-DD format)").addText((text) => {
      text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.exaEndPublishedDate || "").onChange(async (value) => {
        this.plugin.settings.exaEndPublishedDate = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaEndPublishedDate = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Include Text").setDesc("Include the text content of search results").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.exaIncludeText) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.exaIncludeText = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaIncludeText = value;
        });
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Include Highlights").setDesc("Include highlighted relevant excerpts from results").addToggle((toggle) => {
      var _a;
      toggle.setValue((_a = this.plugin.settings.exaIncludeHighlights) != null ? _a : true).onChange(async (value) => {
        this.plugin.settings.exaIncludeHighlights = value;
        Object.keys(this.plugin.settings.researchModeConfigs).forEach((mode) => {
          this.plugin.settings.researchModeConfigs[mode].exaIncludeHighlights = value;
        });
        await this.plugin.saveSettings();
      });
    });
  }
};
//# sourceMappingURL=main.js.map

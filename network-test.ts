import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';

interface NetworkTestSettings {
	geminiApiKey: string;
	testEndpoint: string;
}

const DEFAULT_SETTINGS: NetworkTestSettings = {
	geminiApiKey: '',
	testEndpoint: 'https://httpbin.org/json'
}

export default class NetworkTestPlugin extends Plugin {
	settings: NetworkTestSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon for quick test
		const ribbonIconEl = this.addRibbonIcon('wifi', 'Network Test', (evt: MouseEvent) => {
			this.runFullNetworkTest();
		});
		ribbonIconEl.addClass('network-test-ribbon-class');

		// Test basic HTTP request
		this.addCommand({
			id: 'test-basic-http',
			name: 'Test: Basic HTTP Request',
			callback: () => {
				this.testBasicHttp();
			}
		});

		// Test Gemini API (without web search)
		this.addCommand({
			id: 'test-gemini-basic',
			name: 'Test: Gemini API Basic',
			callback: () => {
				this.testGeminiBasic();
			}
		});

		// Test Gemini API with web search
		this.addCommand({
			id: 'test-gemini-web-search',
			name: 'Test: Gemini API Web Search',
			callback: () => {
				this.testGeminiWebSearch();
			}
		});

		// Test external API calls
		this.addCommand({
			id: 'test-external-apis',
			name: 'Test: External APIs',
			callback: () => {
				this.testExternalAPIs();
			}
		});

		// Run full test suite
		this.addCommand({
			id: 'run-full-network-test',
			name: 'Test: Run Full Network Test Suite',
			callback: () => {
				this.runFullNetworkTest();
			}
		});

		// Add settings tab
		this.addSettingTab(new NetworkTestSettingTab(this.app, this));

		// Auto-test on load (optional)
		// this.runQuickTest();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async testBasicHttp() {
		new Notice('🔍 Testing basic HTTP request...', 3000);
		
		try {
			const startTime = Date.now();
			const response = await requestUrl({
				url: this.settings.testEndpoint,
				method: 'GET',
				headers: {
					'User-Agent': 'Obsidian-Network-Test/1.0'
				}
			});

			const duration = Date.now() - startTime;
			
			console.log('Basic HTTP Test - Success:', {
				status: response.status,
				duration: `${duration}ms`,
				headers: response.headers,
				data: response.json
			});

			new Notice(`✅ Basic HTTP: SUCCESS (${duration}ms)`, 5000);
			return { success: true, duration, data: response.json };

		} catch (error) {
			console.error('Basic HTTP Test - Failed:', error);
			new Notice(`❌ Basic HTTP: FAILED - ${error.message}`, 8000);
			return { success: false, error: error.message };
		}
	}

	async testGeminiBasic() {
		if (!this.settings.geminiApiKey) {
			new Notice('❌ Gemini API key not set. Please configure in settings.', 5000);
			return { success: false, error: 'No API key' };
		}

		new Notice('🤖 Testing Gemini API (basic)...', 3000);

		try {
			const startTime = Date.now();
			const response = await requestUrl({
				url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.settings.geminiApiKey}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{
						parts: [{
							text: "Say 'Hello from Obsidian Network Test!' in exactly those words."
						}]
					}],
					generationConfig: {
						temperature: 0.1,
						maxOutputTokens: 50
					}
				})
			});

			const duration = Date.now() - startTime;
			const responseData = response.json;
			
			console.log('Gemini Basic Test - Success:', {
				status: response.status,
				duration: `${duration}ms`,
				response: responseData
			});

			const generatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'No text generated';

			new Notice(`✅ Gemini Basic: SUCCESS (${duration}ms)\nResponse: ${generatedText.substring(0, 50)}...`, 8000);
			return { success: true, duration, response: generatedText };

		} catch (error) {
			console.error('Gemini Basic Test - Failed:', error);
			let errorMsg = error.message;
			
			if (error.status === 401) {
				errorMsg = 'Invalid API key';
			} else if (error.status === 403) {
				errorMsg = 'API access forbidden';
			} else if (error.status === 429) {
				errorMsg = 'Rate limit exceeded';
			}

			new Notice(`❌ Gemini Basic: FAILED - ${errorMsg}`, 8000);
			return { success: false, error: errorMsg };
		}
	}

	async testGeminiWebSearch() {
		if (!this.settings.geminiApiKey) {
			new Notice('❌ Gemini API key not set. Please configure in settings.', 5000);
			return { success: false, error: 'No API key' };
		}

		new Notice('🌐 Testing Gemini API with web search...', 3000);

		try {
			const startTime = Date.now();
			const response = await requestUrl({
				url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.settings.geminiApiKey}`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [{
						parts: [{
							text: "What is the current weather in Tokyo today? Please search for recent information."
						}]
					}],
					tools: [{
						googleSearch: {}
					}],
					generationConfig: {
						temperature: 0.7,
						maxOutputTokens: 1000
					}
				})
			});

			const duration = Date.now() - startTime;
			const responseData = response.json;
			
			console.log('Gemini Web Search Test - Success:', {
				status: response.status,
				duration: `${duration}ms`,
				response: responseData,
				hasGrounding: !!responseData.candidates?.[0]?.groundingMetadata
			});

			const candidate = responseData.candidates?.[0];
			const generatedText = candidate?.content?.parts?.[0]?.text || 'No text generated';
			const hasGrounding = !!candidate?.groundingMetadata;
			const sourcesCount = candidate?.groundingMetadata?.groundingChunks?.length || 0;

			new Notice(`✅ Gemini Web Search: SUCCESS (${duration}ms)\nGrounding: ${hasGrounding ? '✅' : '❌'}\nSources: ${sourcesCount}`, 8000);
			return { 
				success: true, 
				duration, 
				response: generatedText,
				hasGrounding,
				sourcesCount
			};

		} catch (error) {
			console.error('Gemini Web Search Test - Failed:', error);
			let errorMsg = error.message;
			
			if (error.status === 401) {
				errorMsg = 'Invalid API key';
			} else if (error.status === 403) {
				errorMsg = 'API access forbidden or web search not enabled';
			} else if (error.status === 429) {
				errorMsg = 'Rate limit exceeded';
			}

			new Notice(`❌ Gemini Web Search: FAILED - ${errorMsg}`, 8000);
			return { success: false, error: errorMsg };
		}
	}

	async testExternalAPIs() {
		new Notice('🌍 Testing external API access...', 3000);
		const results = [];

		// Test multiple external APIs
		const apis = [
			{ name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1' },
			{ name: 'HTTPBin IP', url: 'https://httpbin.org/ip' },
			{ name: 'GitHub API', url: 'https://api.github.com/zen' },
		];

		for (const api of apis) {
			try {
				const startTime = Date.now();
				const response = await requestUrl({
					url: api.url,
					method: 'GET',
					headers: {
						'User-Agent': 'Obsidian-Network-Test/1.0'
					}
				});
				
				const duration = Date.now() - startTime;
				results.push({
					name: api.name,
					success: true,
					duration,
					status: response.status
				});

				console.log(`External API Test - ${api.name}: SUCCESS`, {
					duration: `${duration}ms`,
					status: response.status
				});

			} catch (error) {
				results.push({
					name: api.name,
					success: false,
					error: error.message
				});

				console.error(`External API Test - ${api.name}: FAILED`, error);
			}
		}

		const successCount = results.filter(r => r.success).length;
		const totalCount = results.length;

		new Notice(`🌍 External APIs: ${successCount}/${totalCount} successful`, 8000);
		return results;
	}

	async runFullNetworkTest() {
		new Notice('🧪 Running full network test suite...', 3000);
		
		const results = {
			basicHttp: await this.testBasicHttp(),
			geminiBasic: await this.testGeminiBasic(),
			geminiWebSearch: await this.testGeminiWebSearch(),
			externalAPIs: await this.testExternalAPIs()
		};

		// Create test report
		const report = this.generateTestReport(results);
		
		// Insert report into current note
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			const cursor = editor.getCursor();
			editor.replaceRange(report, cursor);
		}

		console.log('Full Network Test Results:', results);
		
		const basicTests = [results.basicHttp, results.geminiBasic, results.geminiWebSearch];
		const passedBasicTests = basicTests.filter(r => r.success).length;
		const passedAPITests = results.externalAPIs.filter((r: any) => r.success).length;

		new Notice(`🧪 Test Suite Complete: ${passedBasicTests}/3 core tests, ${passedAPITests}/${results.externalAPIs.length} APIs`, 10000);
	}

	generateTestReport(results: any): string {
		const timestamp = new Date().toLocaleString();
		
		let report = `## 🧪 Network Test Report\n\n`;
		report += `**Generated:** ${timestamp}\n\n`;
		report += `---\n\n`;

		// Basic HTTP Test
		report += `### 🌐 Basic HTTP Request\n`;
		report += results.basicHttp.success 
			? `✅ **PASSED** (${results.basicHttp.duration}ms)\n`
			: `❌ **FAILED** - ${results.basicHttp.error}\n`;
		report += `\n`;

		// Gemini Basic Test
		report += `### 🤖 Gemini API Basic\n`;
		report += results.geminiBasic.success 
			? `✅ **PASSED** (${results.geminiBasic.duration}ms)\n`
			: `❌ **FAILED** - ${results.geminiBasic.error}\n`;
		report += `\n`;

		// Gemini Web Search Test
		report += `### 🌐 Gemini Web Search\n`;
		if (results.geminiWebSearch.success) {
			report += `✅ **PASSED** (${results.geminiWebSearch.duration}ms)\n`;
			report += `- Grounding: ${results.geminiWebSearch.hasGrounding ? '✅' : '❌'}\n`;
			report += `- Sources: ${results.geminiWebSearch.sourcesCount}\n`;
		} else {
			report += `❌ **FAILED** - ${results.geminiWebSearch.error}\n`;
		}
		report += `\n`;

		// External APIs Test
		report += `### 🌍 External APIs\n`;
		for (const api of results.externalAPIs) {
			report += api.success 
				? `✅ ${api.name} (${api.duration}ms)\n`
				: `❌ ${api.name} - ${api.error}\n`;
		}
		report += `\n`;

		// Summary
		const basicTests = [results.basicHttp, results.geminiBasic, results.geminiWebSearch];
		const passedBasicTests = basicTests.filter(r => r.success).length;
		const passedAPITests = results.externalAPIs.filter((r: any) => r.success).length;
		const totalAPIs = results.externalAPIs.length;

		report += `---\n\n`;
		report += `### 📊 Summary\n`;
		report += `**Core Tests Passed:** ${passedBasicTests}/3\n`;
		report += `**External APIs Passed:** ${passedAPITests}/${totalAPIs}\n`;
		report += `**Network Capability:** ${passedBasicTests >= 2 ? '✅ Good' : passedBasicTests >= 1 ? '⚠️ Limited' : '❌ Poor'}\n`;
		
		if (results.geminiWebSearch.success && results.geminiWebSearch.hasGrounding) {
			report += `**Web Search Support:** ✅ Fully Supported\n`;
		} else if (results.geminiBasic.success) {
			report += `**Web Search Support:** ⚠️ Basic Gemini only\n`;
		} else {
			report += `**Web Search Support:** ❌ Not Available\n`;
		}

		report += `\n---\n\n*Generated by Network Test Plugin*\n\n`;

		return report;
	}

	async runQuickTest() {
		// Quick test on plugin load
		try {
			const result = await this.testBasicHttp();
			if (result.success) {
				new Notice('🟢 Network connectivity: OK', 3000);
			} else {
				new Notice('🔴 Network connectivity: Issues detected', 5000);
			}
		} catch (error) {
			console.error('Quick test failed:', error);
		}
	}
}

class NetworkTestSettingTab extends PluginSettingTab {
	plugin: NetworkTestPlugin;

	constructor(app: App, plugin: NetworkTestPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Network Test Plugin Settings' });

		// API Key Setting
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('Enter your Google Gemini API key for testing API access.')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Test Endpoint Setting
		new Setting(containerEl)
			.setName('Test Endpoint')
			.setDesc('HTTP endpoint for basic connectivity testing.')
			.addText(text => text
				.setPlaceholder('https://httpbin.org/json')
				.setValue(this.plugin.settings.testEndpoint)
				.onChange(async (value) => {
					this.plugin.settings.testEndpoint = value;
					await this.plugin.saveSettings();
				}));

		// Test Buttons
		containerEl.createEl('h3', { text: 'Quick Tests' });

		new Setting(containerEl)
			.setName('Basic HTTP Test')
			.setDesc('Test basic HTTP connectivity')
			.addButton(button => button
				.setButtonText('Run Test')
				.onClick(() => {
					this.plugin.testBasicHttp();
				}));

		new Setting(containerEl)
			.setName('Gemini API Test')
			.setDesc('Test Gemini API access (requires API key)')
			.addButton(button => button
				.setButtonText('Run Test')
				.onClick(() => {
					this.plugin.testGeminiBasic();
				}));

		new Setting(containerEl)
			.setName('Full Test Suite')
			.setDesc('Run complete network capability test')
			.addButton(button => button
				.setButtonText('Run All Tests')
				.setClass('mod-cta')
				.onClick(() => {
					this.plugin.runFullNetworkTest();
				}));

		// Instructions
		containerEl.createEl('h3', { text: 'Instructions' });
		const instructions = containerEl.createEl('div');
		instructions.innerHTML = `
			<p>This plugin tests Obsidian's network capabilities:</p>
			<ul>
				<li><strong>Basic HTTP:</strong> Tests if requestUrl works with external servers</li>
				<li><strong>Gemini API:</strong> Tests if AI API calls work</li>
				<li><strong>Web Search:</strong> Tests if Gemini web grounding is allowed</li>
				<li><strong>External APIs:</strong> Tests various external services</li>
			</ul>
			<p><em>Results help determine what networking features are available for plugins.</em></p>
		`;
	}
}

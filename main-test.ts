import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl, ItemView, WorkspaceLeaf } from 'obsidian';

// Minimal test version to check compilation
interface GeminiWebSearchSettings {
	provider: 'gemini' | 'perplexity' | 'tavily' | 'exa';
	geminiApiKey: string;
	quickPrompt: string;
}

const DEFAULT_SETTINGS: GeminiWebSearchSettings = {
	provider: 'gemini',
	geminiApiKey: '',
	quickPrompt: 'Simple test prompt'
};

export default class GeminiWebSearchPlugin extends Plugin {
	settings: GeminiWebSearchSettings;

	async onload() {
		await this.loadSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

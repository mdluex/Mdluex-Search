
export enum ContentType {
  NEWS_ARTICLE = 'news_article',
  BLOG_POST = 'blog_post',
  PRODUCT_PAGE = 'product_page',
  FORUM_THREAD = 'forum_thread',
}

export interface SearchResultItemData {
  id: string; 
  name: string; 
  domain: string; 
  title: string;
  snippet: string;
  contentType: ContentType;
  originalQuery?: string; 
  preferredTheme?: 'light' | 'dark' | 'system';
}

export type AIProvider = 'gemini' | 'ollama';

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}


export interface AppState {
  currentView: 'home' | 'results' | 'content_page';
  searchTerm: string;
  searchResults: SearchResultItemData[];
  currentContentPageInfo: {
    htmlContent: string; 
    searchItem: SearchResultItemData;
  } | null;
  isLoadingResults: boolean;
  isLoadingContent: boolean; 
  error: string | null;
  
  // Settings Modal State
  showSettingsModal: boolean;
  selectedProvider: AIProvider;
  userGeminiApiKey: string; // User-entered Gemini API key
  ollamaApiUrl: string; // Base URL for Ollama API
  availableOllamaModels: OllamaModel[];
  selectedOllamaModel: string; // Name of the selected Ollama model
  isLoadingOllamaModels: boolean;
}

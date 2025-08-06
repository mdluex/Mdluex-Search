
export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

export const APP_TITLE = "Mdluex Search";

export const FOOTER_TEXT = `© ${new Date().getFullYear()} ${APP_TITLE} - AI Generated Content. For demonstration purposes only.`;

// localStorage keys
export const LS_KEY_PROVIDER = 'mdlx_selectedProvider';
export const LS_KEY_GEMINI_API_KEY = 'mdlx_userGeminiApiKey';
export const LS_KEY_OLLAMA_MODEL = 'mdlx_selectedOllamaModel';
export const LS_KEY_OLLAMA_API_URL = 'mdlx_ollamaApiUrl';

// Ollama
export const DEFAULT_OLLAMA_API_URL = 'http://localhost:11434';
export const OLLAMA_PAGE_CACHE_PREFIX = 'mdlxSearch_ollamaPageCache_';

// Gemini
export const GEMINI_PAGE_CACHE_PREFIX = 'mdlxSearch_geminiPageCache_'; // Renamed from PAGE_CACHE_PREFIX for clarity
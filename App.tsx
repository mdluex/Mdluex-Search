
import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon } from 'react-feather'; // Import react-feather icon
import { AppState, SearchResultItemData, ContentType, AIProvider, OllamaModel } from './types';
import { generateSearchResults as generateSearchResultsGemini, generatePageContent as generatePageContentGemini, initializeGeminiClient } from './services/geminiService';
import { fetchOllamaModels, generateSearchResultsOllama, generatePageContentOllama } from './services/ollamaService'; 
import HomePage from './components/HomePage';
import SearchResultsPage from './components/SearchResultsPage';
import ContentDisplayPage from './components/ContentDisplayPage';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
// GearIcon import removed
import { APP_TITLE, LS_KEY_PROVIDER, LS_KEY_GEMINI_API_KEY, LS_KEY_OLLAMA_MODEL, LS_KEY_OLLAMA_API_URL, DEFAULT_OLLAMA_API_URL, GEMINI_PAGE_CACHE_PREFIX, OLLAMA_PAGE_CACHE_PREFIX } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedProvider = localStorage.getItem(LS_KEY_PROVIDER) as AIProvider | null;
    const savedGeminiKey = localStorage.getItem(LS_KEY_GEMINI_API_KEY) || '';
    const savedOllamaModel = localStorage.getItem(LS_KEY_OLLAMA_MODEL) || '';
    const savedOllamaApiUrl = localStorage.getItem(LS_KEY_OLLAMA_API_URL) || DEFAULT_OLLAMA_API_URL;

    initializeGeminiClient(savedGeminiKey); 

    return {
      currentView: 'home',
      searchTerm: '',
      searchResults: [],
      currentContentPageInfo: null,
      isLoadingResults: false,
      isLoadingContent: false,
      error: null,
      // Settings
      showSettingsModal: false,
      selectedProvider: savedProvider || 'gemini',
      userGeminiApiKey: savedGeminiKey,
      ollamaApiUrl: savedOllamaApiUrl,
      availableOllamaModels: [],
      selectedOllamaModel: savedOllamaModel,
      isLoadingOllamaModels: false,
    };
  });

  const openSettingsModal = useCallback(() => {
    setState(s => ({ ...s, showSettingsModal: true, error: null }));
    if (state.selectedProvider === 'ollama' && state.availableOllamaModels.length === 0) {
      loadOllamaModels(state.ollamaApiUrl);
    }
  }, [state.selectedProvider, state.availableOllamaModels, state.ollamaApiUrl]);

  const closeSettingsModal = useCallback(() => {
    setState(s => ({ ...s, showSettingsModal: false }));
  }, []);

  const loadOllamaModels = useCallback(async (apiUrl: string) => {
    setState(s => ({ ...s, isLoadingOllamaModels: true, error: null }));
    try {
      const models = await fetchOllamaModels(apiUrl);
      setState(s => ({
        ...s,
        availableOllamaModels: models,
        isLoadingOllamaModels: false,
        selectedOllamaModel: models.find(m => m.name === s.selectedOllamaModel) ? s.selectedOllamaModel : (models.length > 0 ? models[0].name : ''),
      }));
    } catch (err) {
      console.error("Failed to fetch Ollama models:", err);
      setState(s => ({
        ...s,
        isLoadingOllamaModels: false,
        error: err instanceof Error ? `Ollama: ${err.message}` : 'Failed to fetch Ollama models.',
        availableOllamaModels: [], 
      }));
    }
  }, []);
  
  const handleSaveSettings = useCallback((newSettings: Partial<Pick<AppState, 'selectedProvider' | 'userGeminiApiKey' | 'selectedOllamaModel' | 'ollamaApiUrl'>>) => {
    setState(s => {
      const updatedState = { ...s, ...newSettings, showSettingsModal: false };
      
      if (newSettings.selectedProvider) {
        localStorage.setItem(LS_KEY_PROVIDER, newSettings.selectedProvider);
      }
      if (newSettings.userGeminiApiKey !== undefined) {
        localStorage.setItem(LS_KEY_GEMINI_API_KEY, newSettings.userGeminiApiKey);
        initializeGeminiClient(newSettings.userGeminiApiKey); 
      }
      if (newSettings.selectedOllamaModel !== undefined) {
        localStorage.setItem(LS_KEY_OLLAMA_MODEL, newSettings.selectedOllamaModel);
      }
      if (newSettings.ollamaApiUrl !== undefined) {
        localStorage.setItem(LS_KEY_OLLAMA_API_URL, newSettings.ollamaApiUrl);
        if (s.selectedProvider === 'ollama' && newSettings.ollamaApiUrl !== s.ollamaApiUrl) {
            Promise.resolve().then(() => loadOllamaModels(newSettings.ollamaApiUrl!));
        }
      }
      return updatedState;
    });
    console.log("Settings saved:", newSettings);
  }, [loadOllamaModels]);


  useEffect(() => {
    if (state.selectedProvider === 'ollama' && state.availableOllamaModels.length === 0 && !state.isLoadingOllamaModels && !state.showSettingsModal) {
      loadOllamaModels(state.ollamaApiUrl);
    }
  }, [state.selectedProvider, state.availableOllamaModels.length, state.isLoadingOllamaModels, loadOllamaModels, state.ollamaApiUrl, state.showSettingsModal]);


  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState(s => {
        const isRefreshingResults = s.currentView === 'results';
        return {
            ...s,
            isLoadingResults: true,
            isLoadingContent: false,
            error: null,
            searchTerm: query,
            searchResults: isRefreshingResults ? s.searchResults : [],
            currentView: isRefreshingResults ? 'results' : 'home',
        };
    });
    
    try { // Clear all page caches on new search
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(GEMINI_PAGE_CACHE_PREFIX) || key.startsWith(OLLAMA_PAGE_CACHE_PREFIX))) {
          localStorage.removeItem(key);
        }
      }
      console.log("Cleared all page caches from localStorage for new search.");
    } catch (e) {
      console.warn("Could not clear page caches from localStorage:", e);
    }

    try {
      let results: SearchResultItemData[];
      if (state.selectedProvider === 'gemini') {
        results = await generateSearchResultsGemini(query, state.userGeminiApiKey);
      } else if (state.selectedProvider === 'ollama') {
        if (!state.selectedOllamaModel) {
            throw new Error("No Ollama model selected. Please select a model in settings.");
        }
        results = await generateSearchResultsOllama(query, state.selectedOllamaModel, state.ollamaApiUrl);
      } else {
        throw new Error("Invalid AI provider selected.");
      }
      
      setState(s => ({
        ...s,
        searchResults: results,
        currentView: 'results', 
        isLoadingResults: false,
      }));
    } catch (err) {
      console.error("Search failed:", err);
      setState(s => ({ 
        ...s, 
        isLoadingResults: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch search results.', 
        currentView: s.currentView === 'results' ? 'results' : 'home', 
        searchResults: s.currentView === 'results' ? s.searchResults : [] 
      }));
    }
  }, [state.selectedProvider, state.userGeminiApiKey, state.selectedOllamaModel, state.ollamaApiUrl]);

  const handleSelectResult = useCallback(async (item: SearchResultItemData) => {
    setState(s => ({ ...s, isLoadingContent: true, isLoadingResults: false, error: null, currentContentPageInfo: null })); 
    try {
      let htmlString: string | null;
      if (state.selectedProvider === 'gemini') {
        htmlString = await generatePageContentGemini(item, state.searchTerm, state.userGeminiApiKey);
      } else if (state.selectedProvider === 'ollama') {
        if (!state.selectedOllamaModel) {
            throw new Error("No Ollama model selected. Please select a model in settings.");
        }
        htmlString = await generatePageContentOllama(item, state.searchTerm, state.selectedOllamaModel, state.ollamaApiUrl);
      } else {
        throw new Error("Invalid AI provider selected.");
      }

      if (htmlString) {
        setState(s => ({
          ...s,
          currentContentPageInfo: { htmlContent: htmlString, searchItem: item },
          currentView: 'content_page',
          isLoadingContent: false,
        }));
      } else {
        throw new Error("AI failed to generate page HTML content."); 
      }
    } catch (err) {
      console.error("Content HTML generation failed:", err);
      setState(s => ({ ...s, isLoadingContent: false, error: err instanceof Error ? err.message : 'Failed to load page content.' }));
    }
  }, [state.searchTerm, state.selectedProvider, state.userGeminiApiKey, state.selectedOllamaModel, state.ollamaApiUrl]);

  const navigateToHome = () => {
    setState(s => ({ 
        ...s, 
        currentView: 'home', 
        searchTerm: '', 
        searchResults: [], 
        currentContentPageInfo: null, 
        isLoadingResults: false,
        isLoadingContent: false,
    }));
  };

  const navigateToResults = () => {
    setState(s => ({ 
        ...s, 
        currentView: 'results', 
        currentContentPageInfo: null, 
        isLoadingContent: false, 
    }));
  };
  
  const renderView = () => {
    if (state.isLoadingResults && state.currentView === 'home' && state.searchTerm && state.searchResults.length === 0) { 
        return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]"><LoadingSpinner size={16} /><p className="mt-4 text-gray-600 dark:text-neutral-400">Searching the AI-verse for "{state.searchTerm}"...</p></div>;
    }

    switch (state.currentView) {
      case 'home':
        return <HomePage onSearch={handleSearch} initialSearchTerm={state.searchTerm} />;
      case 'results':
        return (
          <SearchResultsPage
            searchTerm={state.searchTerm}
            results={state.searchResults}
            onSelectResult={handleSelectResult}
            onSearch={handleSearch}
            isLoading={state.isLoadingResults} 
            isLoadingSelectedContent={state.isLoadingContent} 
            onNavigateHome={navigateToHome}
            onOpenSettings={openSettingsModal} 
          />
        );
      case 'content_page':
        if (state.currentContentPageInfo && typeof state.currentContentPageInfo.htmlContent === 'string') { 
          return (
            <ContentDisplayPage
              htmlContent={state.currentContentPageInfo.htmlContent} 
              searchItem={state.currentContentPageInfo.searchItem}
              onBackToResults={navigateToResults}
              isLoading={state.isLoadingContent} 
              onOpenSettings={openSettingsModal}
            />
          );
        }
        console.warn("Attempted to render content page without valid HTML content, navigating to results.", state.currentContentPageInfo);
        navigateToResults(); 
        return null; 
      default:
        return <HomePage onSearch={handleSearch} initialSearchTerm={state.searchTerm} />;
    }
  };

  let mainClasses = "flex-grow flex flex-col";
  if (state.currentView === 'home') {
    mainClasses += " container mx-auto";
  } else if (state.currentView === 'results') {
    mainClasses += " w-full"; 
  } else if (state.currentView === 'content_page') {
    mainClasses += " w-full"; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#202124] text-gray-900 dark:text-neutral-200">
      
      {state.currentView === 'home' && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={openSettingsModal}
            className="p-2 rounded-full bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-neutral-300" />
          </button>
        </div>
      )}

      {state.error && (state.isLoadingResults || state.isLoadingContent || state.currentView !== 'home' || (state.currentView === 'home' && state.searchTerm) || state.showSettingsModal) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 border border-red-700 text-white px-4 py-2 rounded-md shadow-lg z-[100]" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline text-sm">{state.error}</span>
           <button onClick={() => setState(s=> ({...s, error: null}))} className="ml-2 text-sm underline">Dismiss</button>
        </div>
      )}

      <main className={mainClasses}>
        {renderView()}
      </main>

      {state.currentView !== 'content_page' && <Footer />}

      {state.showSettingsModal && (
        <SettingsModal
          isOpen={state.showSettingsModal}
          onClose={closeSettingsModal}
          currentProvider={state.selectedProvider}
          currentGeminiApiKey={state.userGeminiApiKey}
          currentOllamaApiUrl={state.ollamaApiUrl}
          availableOllamaModels={state.availableOllamaModels}
          currentOllamaModel={state.selectedOllamaModel}
          isLoadingOllamaModels={state.isLoadingOllamaModels}
          onSave={handleSaveSettings}
          onRefreshOllamaModels={() => loadOllamaModels(state.ollamaApiUrl)}
        />
      )}
    </div>
  );
};

export default App;
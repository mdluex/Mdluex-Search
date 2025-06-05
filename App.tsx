import React, { useState, useCallback, useEffect } from 'react';
import { AppState, SearchResultItemData, PageContentData, ContentType } from './types';
import { generateSearchResults, generatePageContent, checkOllamaStatus, setSelectedModels } from './services/ollamaService';
import { generateSearchResults as geminiSearch, generatePageContent as geminiContent } from './services/geminiService';
import HomePage from './components/HomePage';
import SearchResultsPage from './components/SearchResultsPage';
import ContentDisplayPage from './components/ContentDisplayPage';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import SettingsButton from './components/SettingsButton';
import SettingsModal from './components/SettingsModal';
import { APP_TITLE } from './constants';

type ModelProvider = 'ollama' | 'gemini';

interface ModelSettings {
  provider: ModelProvider;
  search: string;
  content: string;
  geminiApiKey: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'home',
    searchTerm: '',
    searchResults: [],
    currentContentPageInfo: null,
    isLoading: false,
    error: null,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    provider: 'ollama',
    search: 'mistral',
    content: 'llama2',
    geminiApiKey: ''
  });

  useEffect(() => {
    const checkOllama = async () => {
      const isRunning = await checkOllamaStatus();
      if (!isRunning) {
        setState((s: AppState) => ({
          ...s,
          error: 'Ollama is not running. Please start Ollama and refresh the page.',
        }));
      }
    };
    checkOllama();
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('modelSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setModelSettings(parsed);
        if (parsed.provider === 'ollama') {
          setSelectedModels({ search: parsed.search, content: parsed.content });
        }
      } catch (e) {
        console.error('Failed to load saved model settings:', e);
      }
    }
  }, []);

  const handleModelSettingsChange = useCallback((newSettings: ModelSettings) => {
    setModelSettings(newSettings);
    if (newSettings.provider === 'ollama') {
      setSelectedModels({ search: newSettings.search, content: newSettings.content });
    }
    localStorage.setItem('modelSettings', JSON.stringify(newSettings));
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setState((s: AppState) => ({ ...s, isLoading: true, error: null, searchTerm: query, searchResults: [], currentView: 'home' })); 
    try {
      const results = modelSettings.provider === 'ollama' 
        ? await generateSearchResults(query)
        : await geminiSearch(query, modelSettings.geminiApiKey || '');
      
      setState((s: AppState) => ({
        ...s,
        searchResults: results,
        currentView: 'results', 
        isLoading: false,
      }));
    } catch (err) {
      console.error("Search failed:", err);
      setState((s: AppState) => ({ 
        ...s, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch search results.', 
        currentView: 'home' 
      }));
    }
  }, [modelSettings]);

  const handleSelectResult = useCallback(async (item: SearchResultItemData) => {
    setState((s: AppState) => ({ ...s, isLoading: true, error: null }));
    try {
      const content = modelSettings.provider === 'ollama'
        ? await generatePageContent(item, state.searchTerm)
        : await geminiContent(item, state.searchTerm, modelSettings.geminiApiKey || '');

      if (content) {
        setState((s: AppState) => ({
          ...s,
          currentContentPageInfo: { content, searchItem: item },
          currentView: 'content_page',
          isLoading: false,
        }));
      } else {
        throw new Error("Failed to generate page content.");
      }
    } catch (err) {
      console.error("Content generation failed:", err);
      setState((s: AppState) => ({ 
        ...s, 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Failed to load page content.' 
      }));
    }
  }, [state.searchTerm, modelSettings]);

  const navigateToHome = () => {
    setState((s: AppState) => ({ ...s, currentView: 'home', searchTerm: '', searchResults: [], currentContentPageInfo: null, error: null }));
  };

  const navigateToResults = () => {
    setState((s: AppState) => ({ ...s, currentView: 'results', currentContentPageInfo: null, error: null }));
  };

  const renderView = () => {
    if (state.isLoading && state.currentView === 'home' && state.searchTerm) { 
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
            isLoading={state.isLoading}
            onNavigateHome={navigateToHome} 
          />
        );
      case 'content_page':
        if (state.currentContentPageInfo) {
          return (
            <ContentDisplayPage
              contentData={state.currentContentPageInfo.content}
              searchItem={state.currentContentPageInfo.searchItem}
              onBackToResults={navigateToResults}
              isLoading={state.isLoading}
            />
          );
        }
        navigateToResults(); 
        return null; 
      default:
        return <HomePage onSearch={handleSearch} initialSearchTerm={state.searchTerm} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#202124] text-gray-900 dark:text-neutral-200">
      {/* Settings Button */}
      <div className="fixed top-4 right-4 z-50">
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
          </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        modelSettings={modelSettings}
        onModelSettingsChange={handleModelSettingsChange}
      />

      {/* Global error displays */}
      {state.error && state.currentView === 'results' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 border border-red-700 text-white px-4 py-2 rounded-md shadow-lg z-[100]" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline text-sm">{state.error}</span>
        </div>
      )}

      {state.error && state.currentView === 'home' && state.searchTerm && ( 
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 border border-red-700 text-white px-4 py-2 rounded-md shadow-lg z-[100]" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline text-sm">{state.error}</span>
        </div>
      )}

      {state.error && state.currentView === 'content_page' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 border border-red-700 text-white px-4 py-2 rounded-md shadow-lg z-[100]" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline text-sm">{state.error}</span>
        </div>
      )}

      <main className={`flex-grow flex flex-col ${ 
        state.currentView === 'home' ? 'container mx-auto' : 
        state.currentView === 'results' ? 'w-full' : 
        '' 
      }`}>
        {renderView()}
      </main>
      <Footer />
    </div>
  );
};

export default App;

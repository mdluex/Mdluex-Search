
import React, { useState, useEffect, useCallback } from 'react';
import { AIProvider, OllamaModel, AppState } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AIProvider;
  currentGeminiApiKey: string;
  currentOllamaApiUrl: string;
  availableOllamaModels: OllamaModel[];
  currentOllamaModel: string;
  isLoadingOllamaModels: boolean;
  onSave: (settings: Partial<Pick<AppState, 'selectedProvider' | 'userGeminiApiKey' | 'selectedOllamaModel' | 'ollamaApiUrl'>>) => void;
  onRefreshOllamaModels: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  currentGeminiApiKey,
  currentOllamaApiUrl,
  availableOllamaModels,
  currentOllamaModel,
  isLoadingOllamaModels,
  onSave,
  onRefreshOllamaModels,
}) => {
  const [provider, setProvider] = useState<AIProvider>(currentProvider);
  const [geminiApiKey, setGeminiApiKey] = useState(currentGeminiApiKey);
  const [ollamaModel, setOllamaModel] = useState(currentOllamaModel);
  const [ollamaApiUrl, setOllamaApiUrl] = useState(currentOllamaApiUrl);

  useEffect(() => {
    setProvider(currentProvider);
    setGeminiApiKey(currentGeminiApiKey);
    setOllamaModel(currentOllamaModel);
    setOllamaApiUrl(currentOllamaApiUrl);
  }, [isOpen, currentProvider, currentGeminiApiKey, currentOllamaModel, currentOllamaApiUrl]);
  
  useEffect(() => {
    // If Ollama is selected and no model is chosen, or the chosen model isn't in the list,
    // try to set it to the first available model.
    if (provider === 'ollama' && availableOllamaModels.length > 0) {
      const modelExists = availableOllamaModels.some(m => m.name === ollamaModel);
      if (!ollamaModel || !modelExists) {
        setOllamaModel(availableOllamaModels[0].name);
      }
    }
  }, [provider, availableOllamaModels, ollamaModel ]);


  const handleSave = () => {
    onSave({
      selectedProvider: provider,
      userGeminiApiKey: geminiApiKey,
      selectedOllamaModel: ollamaModel,
      ollamaApiUrl: ollamaApiUrl,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[90] bg-black bg-opacity-60 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div 
        className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out"
        onClick={e => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-modal-title" className="text-2xl font-semibold text-gray-800 dark:text-neutral-100">Settings</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200"
            aria-label="Close settings modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">AI Provider</label>
          <div className="flex space-x-4">
            {(['gemini', 'ollama'] as AIProvider[]).map(p => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${provider === p 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-300 dark:hover:bg-neutral-600'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Settings */}
        {provider === 'gemini' && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800/50">
            <h3 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-2">Gemini Configuration</h3>
            <div>
              <label htmlFor="geminiApiKey" className="block text-sm font-medium text-gray-700 dark:text-neutral-300">
                API Key 
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  (Get from Google AI Studio)
                </a>
              </label>
              <input
                type="password"
                id="geminiApiKey"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                placeholder="Leave empty to use environment variable"
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                If empty, the app will try to use the pre-configured <code>API_KEY</code> from the environment.
              </p>
            </div>
          </div>
        )}

        {/* Ollama Settings */}
        {provider === 'ollama' && (
          <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-700 rounded-md  bg-gray-50 dark:bg-neutral-800/50">
            <h3 className="text-lg font-medium text-gray-800 dark:text-neutral-200 mb-3">Ollama Configuration</h3>
            <div className="mb-3">
                <label htmlFor="ollamaApiUrl" className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Ollama API URL</label>
                <input
                    type="text"
                    id="ollamaApiUrl"
                    value={ollamaApiUrl}
                    onChange={e => setOllamaApiUrl(e.target.value)}
                    placeholder="e.g., http://localhost:11434"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
                />
            </div>
            <div className="flex items-center justify-between mb-1">
                 <label htmlFor="ollamaModel" className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Select Model</label>
                 <button
                    onClick={onRefreshOllamaModels}
                    disabled={isLoadingOllamaModels}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    title="Refresh model list from Ollama API"
                >
                    {isLoadingOllamaModels ? (
                        <LoadingSpinner size={4} color="text-blue-500" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    )}
                    Refresh
                </button>
            </div>
            {isLoadingOllamaModels && !availableOllamaModels.length ? (
              <div className="flex items-center justify-center h-20">
                <LoadingSpinner size={6} />
                <p className="ml-2 text-sm text-gray-500 dark:text-neutral-400">Fetching models...</p>
              </div>
            ) : availableOllamaModels.length > 0 ? (
              <select
                id="ollamaModel"
                value={ollamaModel}
                onChange={e => setOllamaModel(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-neutral-100"
                disabled={isLoadingOllamaModels}
              >
                {availableOllamaModels.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({ (m.size / 1024 / 1024 / 1024).toFixed(2) } GB)
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                No Ollama models found or failed to fetch. Ensure Ollama is running and accessible at the specified URL. Check console for errors.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-md border border-gray-300 dark:border-neutral-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-neutral-800 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

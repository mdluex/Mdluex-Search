import React from 'react';
import ModelSelector from './ModelSelector';

type ModelProvider = 'ollama' | 'gemini';

interface ModelSettings {
  provider: ModelProvider;
  search: string;
  content: string;
  geminiApiKey: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelSettings: ModelSettings;
  onModelSettingsChange: (settings: ModelSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  modelSettings, 
  onModelSettingsChange 
}) => {
  if (!isOpen) return null;

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelSettingsChange({
      ...modelSettings,
      provider: e.target.value as ModelProvider
    });
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onModelSettingsChange({
      ...modelSettings,
      geminiApiKey: e.target.value
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md z-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Model Provider Selection */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              AI Provider
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose between local Ollama models or Google's Gemini API
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="provider" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Provider
              </label>
              <select
                id="provider"
                value={modelSettings.provider}
                onChange={handleProviderChange}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="gemini">Gemini (Google)</option>
              </select>
            </div>
          </div>

          {/* Model Selection (Ollama) */}
          {modelSettings.provider === 'ollama' && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                AI Models
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Choose the AI models to use for search and content generation
              </p>
              <ModelSelector 
                selectedModels={{ search: modelSettings.search, content: modelSettings.content }}
                onModelChange={(models) => onModelSettingsChange({ ...modelSettings, ...models })}
                provider={modelSettings.provider}
              />
            </div>
          )}

          {/* API Key Input (Gemini) */}
          {modelSettings.provider === 'gemini' && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Gemini API Key
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enter your Google Gemini API key
              </p>
              <div className="flex flex-col gap-2">
                <label htmlFor="apiKey" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={modelSettings.geminiApiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your Gemini API key"
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get your API key from the{' '}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsModal; 
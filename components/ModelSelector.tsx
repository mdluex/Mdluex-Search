import React, { useEffect, useState } from 'react';
import { getAvailableModels } from '../services/ollamaService';

interface ModelSelectorProps {
  selectedModels: {
    search: string;
    content: string;
  };
  onModelChange: (models: { search: string; content: string }) => void;
  provider: 'ollama' | 'gemini';
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModels, onModelChange, provider }) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider !== 'ollama') return;
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const models = await getAvailableModels();
        setAvailableModels(models);
      } catch (err) {
        setError('Failed to load available models. Please ensure Ollama is running.');
        console.error('Error loading models:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadModels();
  }, [provider]);

  if (provider !== 'ollama') return null;

  const handleModelChange = (type: 'search' | 'content', model: string) => {
    onModelChange({
      ...selectedModels,
      [type]: model
    });
  };

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Loading available models...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="searchModel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Model
        </label>
        <select
          id="searchModel"
          value={selectedModels.search}
          onChange={(e) => handleModelChange('search', e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a model</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contentModel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Content Generation Model
        </label>
        <select
          id="contentModel"
          value={selectedModels.content}
          onChange={(e) => handleModelChange('content', e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a model</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ModelSelector; 
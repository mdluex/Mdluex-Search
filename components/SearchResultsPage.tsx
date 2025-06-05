
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'react-feather'; // Import react-feather icon
import { SearchResultItemData } from '../types';
import SearchBar from './SearchBar';
import ResultItemCard from './ResultItemCard';
import LoadingSpinner from './LoadingSpinner';
// GearIcon import removed
import { APP_TITLE } from '../constants';

interface SearchResultsPageProps {
  searchTerm: string;
  results: SearchResultItemData[];
  onSelectResult: (item: SearchResultItemData) => void;
  onSearch: (query: string) => void;
  isLoading: boolean; 
  isLoadingSelectedContent?: boolean; 
  onNavigateHome: () => void;
  onOpenSettings: () => void; 
}

const RESULTS_PER_PAGE = 10;

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  searchTerm,
  results,
  onSelectResult,
  onSearch,
  isLoading, 
  isLoadingSelectedContent,
  onNavigateHome,
  onOpenSettings
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1); 
  }, [searchTerm]);

  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const currentResults = results.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
    window.scrollTo(0, 0);
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-10 mb-6 flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-3">
          {currentPage > 1 && (
            <button
              onClick={handlePreviousPage}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
          )}
          <span className="text-sm text-gray-700 dark:text-neutral-400">
            Page {currentPage}
          </span>
          {currentPage < totalPages && (
            <button
              onClick={handleNextPage}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              aria-label="Next page"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Mdluex Search AI
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#202124] min-h-screen">
      <header className="py-3 px-4 sm:px-6 sticky top-0 z-40 bg-white dark:bg-[#202124] border-b border-gray-200 dark:border-neutral-700">
        <div className="max-w-3xl mx-auto flex items-center space-x-3 sm:space-x-4">
          <button onClick={onNavigateHome} className="text-lg font-semibold text-neutral-700 dark:text-white hover:opacity-80 transition-opacity" aria-label="Go to homepage">
            {APP_TITLE.split(' ')[0]}
          </button>
          <div className="flex-grow max-w-xl">
            <SearchBar onSearch={onSearch} initialValue={searchTerm} isLoading={isLoading && results.length === 0} />
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
          </button>
        </div>
        
        {isLoading && results.length > 0 && (
            <div className="max-w-3xl mx-auto mt-2 text-xs text-gray-500 dark:text-neutral-500 flex items-center">
                <LoadingSpinner size={4} />
                <span className="ml-2">Loading new results...</span>
            </div>
        )}
        
        {isLoadingSelectedContent && !isLoading && (
             <div className="max-w-3xl mx-auto mt-2 text-xs text-gray-500 dark:text-neutral-500 flex items-center">
                <LoadingSpinner size={4} />
                <span className="ml-2">Preparing page content...</span>
            </div>
        )}
      </header>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-8">
        {isLoading && results.length === 0 && (
          <div className="text-center py-10">
              <LoadingSpinner size={10}/>
              <p className="mt-3 text-sm text-gray-500 dark:text-neutral-400">Generating results for "{searchTerm}"...</p>
          </div>
        )}

        {!isLoading && results.length === 0 && searchTerm && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-700 dark:text-neutral-300 mb-1">No results found for "{searchTerm}".</p>
            <p className="text-sm text-gray-500 dark:text-neutral-400">Suggestions:</p>
            <ul className="list-disc list-inside text-sm text-gray-500 dark:text-neutral-400 mt-2">
                <li>Make sure all words are spelled correctly.</li>
                <li>Try different keywords.</li>
                <li>Try more general keywords.</li>
            </ul>
          </div>
        )}

        {currentResults.length > 0 && (
          <>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-3">
              About {results.length} AI-generated results
            </p>
            <div className="space-y-1">
              {currentResults.map((item, index) => (
                <ResultItemCard 
                    key={item.id} 
                    item={item} 
                    onSelectResult={onSelectResult} 
                    isLastItem={index === currentResults.length - 1}
                />
              ))}
            </div>
            {renderPaginationControls()}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
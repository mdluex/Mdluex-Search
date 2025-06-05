
import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'react-feather'; // Import react-feather icon
import { SearchResultItemData } from '../types';
import LoadingSpinner from './LoadingSpinner';
// GearIcon import removed

interface ContentDisplayPageProps {
  htmlContent: string; 
  searchItem: SearchResultItemData;
  onBackToResults: () => void;
  isLoading: boolean; 
  onOpenSettings: () => void; 
}

const ContentDisplayPage: React.FC<ContentDisplayPageProps> = ({ htmlContent, searchItem, onBackToResults, isLoading, onOpenSettings }) => {
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [pageWrapperClasses, setPageWrapperClasses] = useState('bg-gray-100 text-neutral-900');

  useEffect(() => {
    const systemIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme: 'light' | 'dark';

    if (searchItem.preferredTheme === 'light') {
      currentTheme = 'light';
    } else if (searchItem.preferredTheme === 'dark') {
      currentTheme = 'dark';
    } else { 
      currentTheme = systemIsDark ? 'dark' : 'light';
    }
    setEffectiveTheme(currentTheme);

    if (currentTheme === 'dark') {
      setPageWrapperClasses('dark bg-[#171717] text-neutral-200'); 
    } else {
      setPageWrapperClasses('bg-gray-50 text-neutral-900'); 
    }
  }, [searchItem.preferredTheme]);

  const showLoadingState = isLoading || !htmlContent;

  return (
    <div className={`flex flex-col ${pageWrapperClasses} w-full min-h-full`}>
      <div 
        className={`fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between px-4 sm:px-6 ${effectiveTheme === 'dark' ? 'bg-[#171717]' : 'bg-gray-50'} border-b ${effectiveTheme === 'dark' ? 'border-neutral-700' : 'border-gray-300'}`}
      > 
        <button
            onClick={onBackToResults}
            className={`text-sm ${effectiveTheme === 'dark' ? 'text-[#8ab4f8]' : 'text-blue-600'} hover:underline flex items-center`}
            aria-label="Back to search results"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Results
        </button>
        <div className="flex items-center space-x-3">
            <div className="text-right ml-4 flex-shrink min-w-0">
                <p className={`text-sm font-medium truncate ${effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`} title={searchItem.name}>
                    {searchItem.name}
                </p>
                <a 
                    href={`https://${searchItem.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-xs truncate ${effectiveTheme === 'dark' ? 'text-neutral-400 hover:text-neutral-300' : 'text-gray-600 hover:text-gray-800'} hover:underline`}
                    title={`Go to ${searchItem.domain}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {searchItem.domain}
                </a>
            </div>
            <button
                onClick={onOpenSettings}
                className={`p-2 rounded-full ${effectiveTheme === 'dark' ? 'hover:bg-neutral-700' : 'hover:bg-gray-200'} transition-colors`}
                aria-label="Open settings"
            >
                <SettingsIcon className={`w-5 h-5 ${effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-gray-600'}`} />
            </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col w-full pt-16">
        {isLoading ? (
           <div className={`flex-grow flex flex-col items-center justify-center py-20 px-4 w-full`}>
            <LoadingSpinner size={12} />
            <p className={`mt-4 ${effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Generating full page for "${searchItem.title}"...</p>
          </div>
        ) : (
            htmlContent ? (
                <div
                    className="w-full flex-grow" 
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center flex-grow p-8 text-center">
                    <p className={`text-xl font-semibold ${effectiveTheme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Content Currently Unavailable</p>
                    <p className={`mt-2 ${effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>
                        The AI was unable to generate the page content, or the content is missing. Please try going back and selecting a different result.
                    </p>
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default ContentDisplayPage;
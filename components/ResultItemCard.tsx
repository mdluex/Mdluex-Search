import React from 'react';
import { SearchResultItemData } from '../types';
import { getTextDirection } from '../utils/languageUtils';

interface ResultItemCardProps {
  item: SearchResultItemData;
  onSelectResult: (item: SearchResultItemData) => void;
  isLastItem: boolean;
}

const ResultItemCard: React.FC<ResultItemCardProps> = ({ item, onSelectResult, isLastItem }) => {
  // Detect text direction for title and snippet
  const titleDirection = getTextDirection(item.title);
  const snippetDirection = getTextDirection(item.snippet);

  return (
    <div 
      className={`py-5 ${!isLastItem ? 'border-b border-transparent dark:border-neutral-800' : ''} hover:bg-gray-50 dark:hover:bg-neutral-800/30 rounded-md px-2 -mx-2 transition-colors`} // Subtle hover and padding adjustment
      onClick={() => onSelectResult(item)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelectResult(item)}
    >
      <div className="flex items-center mb-1">
        <img 
            src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=24`} 
            alt="" 
            className="w-5 h-5 mr-2 rounded-sm object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="flex-grow">
            <p className="text-xs text-gray-700 dark:text-neutral-300 truncate">{item.name}</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{item.domain}</p>
        </div>
        <button className="p-1 text-gray-500 dark:text-neutral-500 hover:dark:text-neutral-300" aria-label="More options" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
            </svg>
        </button>
      </div>
      <h3 
        className="text-lg text-blue-600 dark:text-[#8ab4f8] hover:underline cursor-pointer visited:text-purple-600 dark:visited:text-purple-400 mb-0.5"
        dir={titleDirection}
      >
        {item.title}
      </h3>
      <p 
        className="text-sm text-gray-600 dark:text-neutral-300 leading-snug"
        dir={snippetDirection}
      >
        {item.snippet}
      </p>
      {item.contentType && (
          <span className="mt-1 inline-block text-xs text-gray-500 dark:text-neutral-500">
            Category: {item.contentType.replace('_', ' ')}
          </span>
      )}
    </div>
  );
};

export default ResultItemCard;

import React from 'react';
import { NewsArticleContent, SearchResultItemData } from '../../types';
import { getTextDirection } from '../../utils/languageUtils';

interface NewsArticleViewProps {
  content: NewsArticleContent;
  searchItem: SearchResultItemData;
  effectiveTheme: 'light' | 'dark';
}

const NewsArticleView: React.FC<NewsArticleViewProps> = ({ content, searchItem, effectiveTheme }) => {
  const textColor = effectiveTheme === 'dark' ? 'text-neutral-100' : 'text-gray-900';
  const subTextColor = effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-600';
  const bodyTextColor = effectiveTheme === 'dark' ? 'text-neutral-300' : 'text-gray-700';
  const borderColor = effectiveTheme === 'dark' ? 'border-neutral-700' : 'border-gray-300';
  const proseInvertClass = effectiveTheme === 'dark' ? 'prose-invert' : '';

  // Detect text direction for content
  const headlineDirection = getTextDirection(content.headline);
  const bylineDirection = getTextDirection(content.byline);
  const paragraphsDirection = content.paragraphs.some(p => getTextDirection(p) === 'rtl') ? 'rtl' : 'ltr';

  return (
    <div>
      {/* Custom Header for News Article */}
      <header className={`mb-6 pb-4 border-b ${borderColor}`}>
        <div className="flex items-center mb-1">
            <img 
                src={`https://www.google.com/s2/favicons?domain=${searchItem.domain}&sz=32`} 
                alt="" 
                className="w-6 h-6 mr-2 rounded-sm object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div>
                <h1 className={`text-2xl font-semibold ${effectiveTheme === 'dark' ? 'text-neutral-100' : 'text-gray-800'}`}>{searchItem.name}</h1>
                <p className={`text-xs ${effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>{searchItem.domain}</p>
            </div>
        </div>
        {searchItem.originalQuery && (
             <p className={`mt-1 text-xs ${effectiveTheme === 'dark' ? 'text-neutral-500' : 'text-gray-500'}`}>
                Search context: "{searchItem.originalQuery}"
            </p>
        )}
      </header>

      {/* Article Content */}
      <article className={`prose ${proseInvertClass} max-w-none`}>
        <h1 className={`text-3xl font-bold mb-2 ${textColor}`} dir={headlineDirection}>
          {content.headline}
        </h1>
        <div className={`flex items-center text-sm ${subTextColor} mb-6`}>
          <span dir={bylineDirection}>{content.byline}</span>
          <span className="mx-2">•</span>
          <time>{content.date}</time>
          </div>
        <div className={`space-y-4 ${bodyTextColor}`} dir={paragraphsDirection}>
        {content.paragraphs.map((paragraph, index) => (
            <p key={index} dir={getTextDirection(paragraph)}>{paragraph}</p>
        ))}
        </div>
      </article>
    </div>
  );
};

export default NewsArticleView;
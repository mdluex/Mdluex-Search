import React, { useEffect, useState } from 'react';
import { PageContentData, SearchResultItemData, ContentType, NewsArticleContent, BlogPostContent, ProductPageContent, ForumThreadContent } from '../types';
import NewsArticleView from './contentViews/NewsArticleView';
import BlogPostView from './contentViews/BlogPostView';
import ProductPageView from './contentViews/ProductPageView';
import ForumThreadView from './contentViews/ForumThreadView';
import LoadingSpinner from './LoadingSpinner';

interface ContentDisplayPageProps {
  contentData: PageContentData;
  searchItem: SearchResultItemData;
  onBackToResults: () => void;
  isLoading: boolean;
}

const ContentDisplayPage: React.FC<ContentDisplayPageProps> = ({ contentData, searchItem, onBackToResults, isLoading }) => {
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [pageWrapperClasses, setPageWrapperClasses] = useState('');
  const [contentBoxClasses, setContentBoxClasses] = useState('');

  useEffect(() => {
    const systemIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentTheme: 'light' | 'dark';

    if (searchItem.preferredTheme === 'light') {
      currentTheme = 'light';
    } else if (searchItem.preferredTheme === 'dark') {
      currentTheme = 'dark';
    } else { // system or undefined
      currentTheme = systemIsDark ? 'dark' : 'light';
    }
    setEffectiveTheme(currentTheme);

    if (currentTheme === 'dark') {
      setPageWrapperClasses('dark bg-[#202124] text-neutral-200'); // Overall page dark theme
      setContentBoxClasses('bg-neutral-800 text-neutral-100'); // Content box slightly lighter dark
    } else {
      setPageWrapperClasses('bg-white text-neutral-900'); // Overall page light theme
      setContentBoxClasses('bg-gray-50 text-neutral-900');    // Content box off-white
    }
  }, [searchItem.preferredTheme]);

  const renderContent = () => {
    // Pass searchItem and effectiveTheme to each view for custom header and consistent styling
    switch (contentData.type) {
      case ContentType.NEWS_ARTICLE:
        return <NewsArticleView content={contentData.data as NewsArticleContent} searchItem={searchItem} effectiveTheme={effectiveTheme} />;
      case ContentType.BLOG_POST:
        return <BlogPostView content={contentData.data as BlogPostContent} searchItem={searchItem} effectiveTheme={effectiveTheme} />;
      case ContentType.PRODUCT_PAGE:
        return <ProductPageView content={contentData.data as ProductPageContent} searchItem={searchItem} effectiveTheme={effectiveTheme} />;
      case ContentType.FORUM_THREAD:
        return <ForumThreadView content={contentData.data as ForumThreadContent} searchItem={searchItem} effectiveTheme={effectiveTheme} />;
      default:
        return <p className={`text-red-500 ${effectiveTheme === 'dark' ? 'dark:text-red-400' : ''}`}>Error: Unknown content type.</p>;
    }
  };
  
  return (
    // This div applies the full page theme for this view.
    // It will be nested inside App.tsx's main content area.
    <div className={`flex-grow flex flex-col ${pageWrapperClasses}`}>
      {/* "Back to Results" button - positioned above the content box */}
      <div className="container mx-auto px-4 sm:px-6 pt-4 pb-2"> 
        <button
            onClick={onBackToResults}
            className={`text-sm ${effectiveTheme === 'dark' ? 'text-[#8ab4f8]' : 'text-blue-600'} hover:underline flex items-center`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to Results
        </button>
      </div>

      {/* Main content area, containing the themed content box */}
      <div className="container mx-auto px-4 sm:px-6 pb-8 flex-grow">
        {isLoading ? (
           <div className={`flex flex-col items-center justify-center py-20 ${contentBoxClasses} shadow-xl rounded-lg p-4 sm:p-6 md:p-8`}>
            <LoadingSpinner size={12} />
            <p className={`mt-4 ${effectiveTheme === 'dark' ? 'text-neutral-400' : 'text-gray-500'}`}>Loading content from {searchItem.name}...</p>
          </div>
        ) : (
            // This is the "content box" with its distinct background and shadow
            <div className={`${contentBoxClasses} shadow-xl rounded-lg p-4 sm:p-6 md:p-8`}>
                 {renderContent()}
            </div>
        )}
      </div>
    </div>
  );
};

export default ContentDisplayPage;
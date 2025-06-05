
export enum ContentType {
  NEWS_ARTICLE = 'news_article',
  BLOG_POST = 'blog_post',
  PRODUCT_PAGE = 'product_page',
  FORUM_THREAD = 'forum_thread',
}

export interface SearchResultItemData {
  id: string; 
  name: string; 
  domain: string; 
  title: string;
  snippet: string;
  contentType: ContentType;
  originalQuery?: string; // To pass context to content generation
  preferredTheme?: 'light' | 'dark' | 'system'; // Added for page-specific theme
}

// Content for News Article
export interface NewsArticleContent {
  headline: string;
  byline: string;
  date: string;
  paragraphs: string[];
  websiteName: string; 
}

// Content for Blog Post
export interface BlogPostContent {
  title: string;
  author: string;
  date: string;
  paragraphs: string[];
  websiteName: string;
}

// Content for Product Page
export interface ProductPageContent {
  productName: string;
  tagline: string;
  features: string[];
  description: string;
  price: string;
  callToAction: string;
  websiteName: string;
  imageUrl?: string; 
}

// Content for Forum Thread
export interface ForumPost {
  username: string;
  text: string;
  timestamp?: string; 
}

export interface ForumThreadContent {
  threadTitle: string;
  originalPost: ForumPost;
  replies: ForumPost[];
  websiteName: string;
}

export type SpecificPageContent = NewsArticleContent | BlogPostContent | ProductPageContent | ForumThreadContent;

export interface PageContentData {
  type: ContentType;
  data: SpecificPageContent;
}

export interface AppState {
  currentView: 'home' | 'results' | 'content_page';
  searchTerm: string;
  searchResults: SearchResultItemData[];
  currentContentPageInfo: {
    content: PageContentData;
    searchItem: SearchResultItemData;
  } | null;
  isLoading: boolean;
  error: string | null;
}
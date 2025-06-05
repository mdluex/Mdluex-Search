import { Ollama } from 'ollama-node';
import { SearchResultItemData, PageContentData, ContentType, NewsArticleContent, BlogPostContent, ProductPageContent, ForumThreadContent, SpecificPageContent } from '../types';

// Initialize Ollama client
const ollama = new Ollama();

// Get available models
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.models.map((model: any) => model.name);
  } catch (error) {
    console.error('Failed to fetch available models:', error);
    return ['mistral', 'llama2']; // Fallback to default models
  }
}

// Default models if none selected
let selectedModels = {
  search: 'mistral',
  content: 'llama2'
};

export function setSelectedModels(models: { search: string; content: string }) {
  selectedModels = models;
}

export async function generateSearchResults(query: string): Promise<SearchResultItemData[]> {
  const minResults = 5;
  const maxResults = 10;
  const numResults = Math.floor(Math.random() * (maxResults - minResults + 1)) + minResults;
  const prompt = `Generate ${numResults} diverse and plausible fake search results for the query: "${query}".
Ensure the number of results is exactly ${numResults}.
For each result, provide:
1. 'name': A creative and fake website name (e.g., 'QuantumLeap Insights', 'Aether Archives').
2. 'domain': A fake domain ending in .ai, .news, .com, .org, .io, or .tech (e.g., 'quantumleap.ai', 'aetherarchives.tech').
3. 'title': A compelling and relevant search result title for the query.
4. 'snippet': A short, descriptive snippet (1-2 sentences, max 160 characters) relevant to the query and title.
5. 'contentType': One of the following strings: 'news_article', 'blog_post', 'product_page', 'forum_thread'.
6. 'preferredTheme': Randomly choose one of 'light', 'dark', or 'system'. This determines the theme for the generated content page.

Return the results as a single JSON array of objects. Do not include any explanatory text, comments, or markdown formatting before or after the JSON array.
Example of the expected JSON array format (if you were asked for 1 result for '${query}'):
[
  {
    "name": "NovaChronicles",
    "domain": "novachronicles.news",
    "title": "The Future of ${query}: A NovaChronicles Report",
    "snippet": "Explore groundbreaking insights and predictions about ${query} from leading experts in the field.",
    "contentType": "news_article",
    "preferredTheme": "dark"
  }
]`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModels.search,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error('Invalid response from Ollama API');
    }

    // Debug: print the raw response from Ollama
    console.debug('[Ollama Debug] Raw response:', data.response);

    const jsonMatch = data.response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    const results = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(results)) {
      throw new Error('Response is not an array');
    }

    return results.map((item: any) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      originalQuery: query,
      contentType: Object.values(ContentType).includes(item.contentType as ContentType) ? item.contentType as ContentType : ContentType.BLOG_POST,
      preferredTheme: ['light', 'dark', 'system'].includes(item.preferredTheme as string) ? item.preferredTheme : 'system',
    }));
  } catch (error) {
    console.error('Ollama search error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate search results');
  }
}

async function generateGenericPageContent<T extends SpecificPageContent>(
  item: SearchResultItemData,
  originalQuery: string,
  contentTypeSpecificPrompt: string,
  exampleOutput: object
): Promise<T | null> {
  const prompt = `You are generating content for a fake website.\nSearch Query Context: "${originalQuery}"\nSelected Search Result Title: "${item.title}"\nFake Website Name: "${item.name}" (${item.domain})\nContent Type to Generate: "${item.contentType}"\n\nTask: ${contentTypeSpecificPrompt}\n\nOutput requirements:\nReturn a single JSON object with the structure similar to the example below. Do NOT include any explanatory text, comments, or markdown formatting before or after the JSON object.\nExample JSON structure (adapt fields as per task):\n${JSON.stringify(exampleOutput, null, 2)}\n`;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModels.content,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.response) {
      throw new Error('Invalid response from Ollama API');
    }

    // Debug: print the raw response from Ollama
    console.debug('[Ollama Debug] Raw response:', data.response);

    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON object found in response');
    }

    const content = JSON.parse(jsonMatch[0]);
    return content as T;
  } catch (error) {
    console.error('Ollama content generation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate page content');
  }
}

export async function generatePageContent(
  item: SearchResultItemData,
  originalQuery: string
): Promise<PageContentData | null> {
  let specificContent: SpecificPageContent | null = null;
  try {
    switch (item.contentType) {
      case ContentType.NEWS_ARTICLE:
        specificContent = await generateGenericPageContent<NewsArticleContent>(item, originalQuery,
          "Generate a plausible news article. Include a headline, a byline (e.g., 'By AI Staff Writer'), a recent-looking fake date (e.g., 'October 26, 2024'), and 3-4 paragraphs for the article body. The tone should be journalistic.",
          { headline: "Example Headline", byline: "AI Reporter", date: "Jan 1, 2024", paragraphs: ["Paragraph 1.", "Paragraph 2."]}
        );
        break;
      case ContentType.BLOG_POST:
        specificContent = await generateGenericPageContent<BlogPostContent>(item, originalQuery,
          "Generate an engaging blog post. Include a title, an author name (e.g., 'AI Enthusiast'), a recent-looking fake date, and 4-5 paragraphs of content. The tone can be informal and opinionated.",
          { title: "Example Blog Title", author: "Blogger Bot", date: "Jan 1, 2024", paragraphs: ["Content..."]}
        );
        break;
      case ContentType.PRODUCT_PAGE:
        specificContent = await generateGenericPageContent<ProductPageContent>(item, originalQuery,
          "Generate content for a fake e-commerce product page. Include a product name, a catchy tagline, 3-4 bullet points for key features, a detailed product description (2-3 paragraphs), a fake price (e.g., '$XX.99'), and a call to action button text (e.g., 'Add to Cart'). Optionally include a placeholder imageUrl based on the product name.",
          { productName: "AI Gadget X", tagline: "Revolutionary!", features: ["Feature 1", "Feature 2"], description: "Detailed text...", price: "$99.99", callToAction: "Buy Now", imageUrl: `https://picsum.photos/seed/EXAMPLE_PRODUCT/600/400` }
        );
        if (specificContent && !(specificContent as ProductPageContent).imageUrl) {
          (specificContent as ProductPageContent).imageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.id)}/600/400`;
        }
        break;
      case ContentType.FORUM_THREAD:
        specificContent = await generateGenericPageContent<ForumThreadContent>(item, originalQuery,
          "Generate content for a fake forum thread. Include a thread title, an original post (OP) by a fake username (e.g., 'CuriousUser123') with 2-3 paragraphs, and 2-3 replies from other fake usernames (e.g., 'HelpfulBot', 'ExpertCommenter'), each with 1-2 paragraphs and an optional fake timestamp (e.g. '3 hours ago').",
          { threadTitle: "Discussion about X", originalPost: { username: "User1", text: "OP text...", timestamp: "1 day ago" }, replies: [{ username: "User2", text: "Reply text...", timestamp: "12 hours ago" }]}
        );
        break;
      default:
        console.warn("Unknown content type encountered in generatePageContent switch:", item.contentType);
        specificContent = await generateGenericPageContent<BlogPostContent>(item, originalQuery,
          "Generate an engaging blog post as fallback content. Include a title, an author name, a date, and some paragraphs.",
          { title: "Fallback Content Title", author: "AI Generator", date: new Date().toLocaleDateString(), paragraphs: ["This is fallback content as the original type was unknown or failed."] }
        );
        if (specificContent) {
          return { type: ContentType.BLOG_POST, data: specificContent };
        } else {
          throw new Error(`Unsupported content type: ${item.contentType} and fallback generation failed.`);
        }
    }

    if (specificContent) {
      return { type: item.contentType, data: specificContent };
    } else {
      console.error(`Specific content generation resulted in null for type ${item.contentType} without throwing an error.`);
      throw new Error(`Content generation for ${item.contentType} returned null unexpectedly.`);
    }

  } catch (error) {
    console.error(`Error in generatePageContent for type ${item.contentType}:`, error);
    throw error; 
  }
}

// Helper function to check if Ollama is running
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch (error) {
    console.error('Ollama connection error:', error);
    return false;
  }
} 
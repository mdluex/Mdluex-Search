import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SearchResultItemData, ContentType, PageContentData, NewsArticleContent, BlogPostContent, ProductPageContent, ForumThreadContent, SpecificPageContent } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

function getGeminiApiKey(apiKey?: string): string {
  if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') return apiKey;
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;
  throw new Error('Gemini API key is required and was not provided in settings or environment.');
}

function parseGeminiJsonResponse<T>(jsonString: string): T | null {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    console.warn("parseGeminiJsonResponse received non-string or empty input. Input:", jsonString);
    return null;
  }

  let cleanJsonString = jsonString.trim();

  // Remove BOM (Byte Order Mark) if present, as it can break JSON.parse
  if (cleanJsonString.charCodeAt(0) === 0xFEFF) {
    console.warn("BOM character found and removed from JSON string.");
    cleanJsonString = cleanJsonString.substring(1);
  }

  // Remove Markdown code fences if present (as a fallback defense)
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = cleanJsonString.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    console.warn("Markdown code fence found and removed from JSON string during parsing.");
    cleanJsonString = fenceMatch[1].trim();
  }

  try {
    const parsedData = JSON.parse(cleanJsonString);
    return parsedData as T;
  } catch (error: any) {
    console.error(
      "JSON.parse failed in parseGeminiJsonResponse.",
      "\nError Type:", error.name,
      "\nError Message:", error.message,
      "\nAttempted to parse (string after cleaning, BOM removal, and fence removal):", `>>>${cleanJsonString}<<<`, 
      "\nOriginal string passed to parser:", `>>>${jsonString}<<<`
    );
    return null;
  }
}

export async function generateSearchResults(query: string, apiKey?: string): Promise<SearchResultItemData[]> {
  const key = getGeminiApiKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });
  const minResults = 7;
  const maxResults = 20;
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
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const textResponse = response.text || '';
    const results = parseGeminiJsonResponse<Omit<SearchResultItemData, 'id' | 'originalQuery'>[]>(textResponse);
    
    if (!results || !Array.isArray(results)) {
      console.error('Failed to parse search results or results are not an array. Parsed data:', results, "Raw text from API:", textResponse);
      throw new Error('AI failed to generate valid search results format.');
    }
    
    return results.map((item) => ({
      ...item,
      id: crypto.randomUUID(), 
      originalQuery: query,
      contentType: Object.values(ContentType).includes(item.contentType as ContentType) ? item.contentType as ContentType : ContentType.BLOG_POST,
      preferredTheme: ['light', 'dark', 'system'].includes(item.preferredTheme as string) ? item.preferredTheme : 'system',
    }));
  } catch (error) {
    console.error("Error generating search results:", error);
    if (error instanceof Error && error.message.includes('AI failed to generate valid search results format.')) {
        throw error;
    }
    throw new Error(`Failed to communicate with AI for search results. ${error instanceof Error ? error.message : ''}`);
  }
}

async function generateGenericPageContent<T extends SpecificPageContent>(
  item: SearchResultItemData,
  originalQuery: string,
  contentTypeSpecificPrompt: string,
  exampleOutput: object,
  apiKey?: string
): Promise<T | null> {
  const key = getGeminiApiKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });
  const prompt = `You are generating content for a fake website.
Search Query Context: "${originalQuery}"
Selected Search Result Title: "${item.title}"
Fake Website Name: "${item.name}" (${item.domain})
Content Type to Generate: "${item.contentType}"

Task: ${contentTypeSpecificPrompt}

Output requirements:
Return a single JSON object with the structure similar to the example below. Do NOT include any explanatory text, comments, or markdown formatting before or after the JSON object.
Example JSON structure (adapt fields as per task):
${JSON.stringify(exampleOutput, null, 2)}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const textResponse = response.text || '';
    const content = parseGeminiJsonResponse<Omit<T, 'websiteName'>>(textResponse);

    if (!content) { 
        console.error(`Failed to parse ${item.contentType} content from API. Raw text was:`, textResponse, "Attempted to parse into:", content);
        throw new Error(`AI failed to generate valid ${item.contentType} content format after parsing.`);
    }
    return { ...content, websiteName: item.name } as T;
  } catch (error) {
    console.error(`Error generating ${item.contentType} content:`, error);
    if (error instanceof Error && error.message.includes('AI failed to generate valid')) { 
        throw error;
    }
    throw new Error(`Failed to communicate with AI for page content. ${error instanceof Error ? error.message : ''}`);
  }
}

export async function generatePageContent(item: SearchResultItemData, originalQuery: string, apiKey?: string): Promise<PageContentData | null> {
  const key = getGeminiApiKey(apiKey);
  let specificContent: SpecificPageContent | null = null;

  try {
    switch (item.contentType) {
      case ContentType.NEWS_ARTICLE:
        specificContent = await generateGenericPageContent<NewsArticleContent>(item, originalQuery,
          "Generate a plausible news article. Include a headline, a byline (e.g., 'By AI Staff Writer'), a recent-looking fake date (e.g., 'October 26, 2024'), and 3-4 paragraphs for the article body. The tone should be journalistic.",
          { headline: "Example Headline", byline: "AI Reporter", date: "Jan 1, 2024", paragraphs: ["Paragraph 1.", "Paragraph 2."]},
          key
        );
        break;
      case ContentType.BLOG_POST:
        specificContent = await generateGenericPageContent<BlogPostContent>(item, originalQuery,
          "Generate an engaging blog post. Include a title, an author name (e.g., 'AI Enthusiast'), a recent-looking fake date, and 4-5 paragraphs of content. The tone can be informal and opinionated.",
          { title: "Example Blog Title", author: "Blogger Bot", date: "Jan 1, 2024", paragraphs: ["Content..."]},
          key
        );
        break;
      case ContentType.PRODUCT_PAGE:
        specificContent = await generateGenericPageContent<ProductPageContent>(item, originalQuery,
          "Generate content for a fake e-commerce product page. Include a product name, a catchy tagline, 3-4 bullet points for key features, a detailed product description (2-3 paragraphs), a fake price (e.g., '$XX.99'), and a call to action button text (e.g., 'Add to Cart'). Optionally include a placeholder imageUrl based on the product name.",
          { productName: "AI Gadget X", tagline: "Revolutionary!", features: ["Feature 1", "Feature 2"], description: "Detailed text...", price: "$99.99", callToAction: "Buy Now", imageUrl: `https://picsum.photos/seed/EXAMPLE_PRODUCT/600/400` },
          key
        );
        if (specificContent && !(specificContent as ProductPageContent).imageUrl) {
          (specificContent as ProductPageContent).imageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.id)}/600/400`;
        }
        break;
      case ContentType.FORUM_THREAD:
        specificContent = await generateGenericPageContent<ForumThreadContent>(item, originalQuery,
          "Generate content for a fake forum thread. Include a thread title, an original post (OP) by a fake username (e.g., 'CuriousUser123') with 2-3 paragraphs, and 2-3 replies from other fake usernames (e.g., 'HelpfulBot', 'ExpertCommenter'), each with 1-2 paragraphs and an optional fake timestamp (e.g. '3 hours ago').",
          { threadTitle: "Discussion about X", originalPost: { username: "User1", text: "OP text...", timestamp: "1 day ago" }, replies: [{ username: "User2", text: "Reply text...", timestamp: "12 hours ago" }]},
          key
        );
        break;
      default:
        console.warn("Unknown content type encountered in generatePageContent switch:", item.contentType);
        specificContent = await generateGenericPageContent<BlogPostContent>(item, originalQuery,
          "Generate an engaging blog post as fallback content. Include a title, an author name, a date, and some paragraphs.",
          { title: "Fallback Content Title", author: "AI Generator", date: new Date().toLocaleDateString(), paragraphs: ["This is fallback content as the original type was unknown or failed."] },
          key
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
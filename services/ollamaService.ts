
import { OllamaModel, SearchResultItemData, ContentType } from '../types';
import { DEFAULT_OLLAMA_API_URL, OLLAMA_PAGE_CACHE_PREFIX } from '../constants';

interface OllamaTagsResponse {
  models: OllamaModel[];
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  format?: 'json'; // Only for JSON mode, will be removed for search results
  options?: Record<string, unknown>; // For temperature, top_p etc.
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string; // This is the generated text or JSON string
  done: boolean;
  context?: number[]; // For conversational context
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}


export async function fetchOllamaModels(apiUrl: string = DEFAULT_OLLAMA_API_URL): Promise<OllamaModel[]> {
  const fullApiUrl = `${apiUrl.replace(/\/$/, '')}/api/tags`;
  try {
    const response = await fetch(fullApiUrl);
    if (!response.ok) {
      let errorMsg = `Failed to fetch Ollama models. Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg += ` - ${errorData.error || JSON.stringify(errorData)}`;
      } catch (e) { /* ignore parsing error */ }
      throw new Error(errorMsg);
    }
    const data: OllamaTagsResponse = await response.json();
    if (!data.models || !Array.isArray(data.models)) {
        console.warn("Ollama API response for models is not in expected format:", data);
        return [];
    }
    return data.models.sort((a,b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
    throw new Error(`Could not connect to Ollama API at ${fullApiUrl}. Ensure Ollama is running and accessible. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseOllamaJsonResponse<T>(jsonString: string): T | null {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    console.warn("parseOllamaJsonResponse received non-string or empty input. Input:", jsonString);
    return null;
  }

  let cleanJsonString = jsonString.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = cleanJsonString.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    cleanJsonString = fenceMatch[1].trim();
  }
  
  if (cleanJsonString.charCodeAt(0) === 0xFEFF) { // Remove BOM
    cleanJsonString = cleanJsonString.substring(1);
  }

  try {
    const parsedData = JSON.parse(cleanJsonString);
    return parsedData as T;
  } catch (error: any) {
    console.error(
      "JSON.parse failed in parseOllamaJsonResponse.",
      "\nError Type:", error.name,
      "\nError Message:", error.message,
      "\nAttempted to parse (string after cleaning):", `>>>${cleanJsonString}<<<`,
      "\nOriginal string passed to parser:", `>>>${jsonString}<<<`
    );
    return null;
  }
}


export async function generateSearchResultsOllama(
  query: string, 
  modelName: string, 
  apiUrl: string = DEFAULT_OLLAMA_API_URL
): Promise<SearchResultItemData[]> {
  const fullApiUrl = `${apiUrl.replace(/\/$/, '')}/api/generate`;
  const minResults = 5;
  const maxResults = 10; // Adjusted for potentially larger text output before extraction
  const numResults = Math.floor(Math.random() * (maxResults - minResults + 1)) + minResults;

  const prompt = `You are an AI assistant that generates fictional search results.
Generate exactly ${numResults} diverse and plausible fake search results for the query: "${query}".
For each result, provide:
1. 'name': A creative and fake website name (e.g., 'QuantumLeap Insights', 'Aether Archives').
2. 'domain': A fake domain ending in .ai, .news, .com, .org, .io, or .tech (e.g., 'quantumleap.ai', 'aetherarchives.tech').
3. 'title': A compelling and relevant search result title for the query.
4. 'snippet': A short, descriptive snippet (1-2 sentences, max 160 characters) relevant to the query and title.
5. 'contentType': One of the following strings: 'news_article', 'blog_post', 'product_page', 'forum_thread'.
6. 'preferredTheme': Randomly choose one of 'light', 'dark', or 'system'.

Return the results as a single JSON array of objects. The array MUST contain exactly ${numResults} objects.
The JSON array should be well-formed and parseable. Do not include any explanatory text OUTSIDE the JSON array that would make extraction difficult, but ensure the JSON array itself is complete.

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

  const requestBody: OllamaGenerateRequest = {
    model: modelName,
    prompt: prompt,
    stream: false,
    // format: "json", // REMOVED: We will parse from text response
    options: {
        temperature: 0.7, 
        // num_predict might be useful if Ollama truncates, but let's try without first
        // num_predict: 2048, // Max tokens, adjust based on model and expected output size
    }
  };

  try {
    const apiResponse = await fetch(fullApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      throw new Error(`Ollama API error (${apiResponse.status}): ${errorBody}`);
    }

    const ollamaResult: OllamaGenerateResponse = await apiResponse.json();
    const rawTextResponse = ollamaResult.response;

    if (!rawTextResponse || typeof rawTextResponse !== 'string' || rawTextResponse.trim() === '') {
        console.error('Ollama: Received empty or non-string response from API. Raw response:', rawTextResponse);
        throw new Error('Ollama AI returned an empty or invalid text response.');
    }
    
    // Try to extract the JSON array using regex
    const jsonArrayRegex = /(\[[\s\S]*\])/s; // Find content between '[' and ']'
    const match = rawTextResponse.match(jsonArrayRegex);
    
    let jsonStringToParse: string | null = null;
    if (match && match[1]) {
        jsonStringToParse = match[1];
        console.log("Ollama: Extracted JSON array string via regex:", jsonStringToParse.substring(0, 300) + "...");
    } else {
        // Fallback: if regex fails, try to parse the whole response,
        // assuming it might be a clean JSON array (less likely without format:json)
        // or a single object that parseOllamaJsonResponse can handle.
        console.warn("Ollama: Could not extract JSON array via regex. Attempting to parse entire response. Raw response:", rawTextResponse.substring(0, 300) + "...");
        jsonStringToParse = rawTextResponse;
    }
    
    type PossibleParseResult = Omit<SearchResultItemData, 'id' | 'originalQuery'>[] | Omit<SearchResultItemData, 'id' | 'originalQuery'>;
    let parsedJson = parseOllamaJsonResponse<PossibleParseResult>(jsonStringToParse);
    let resultsArray: Omit<SearchResultItemData, 'id' | 'originalQuery'>[];

    if (parsedJson) {
      if (Array.isArray(parsedJson)) {
        resultsArray = parsedJson;
      } else if (typeof parsedJson === 'object' && parsedJson !== null) {
        // This case should be less common if the regex for array extraction works,
        // but it's a fallback if the model returns a single object instead of an array.
        resultsArray = [parsedJson as Omit<SearchResultItemData, 'id' | 'originalQuery'>];
        console.warn("Ollama: Parsed JSON was a single object; wrapped it in an array.", parsedJson);
      } else {
        console.error('Ollama: Parsed JSON response from extracted string is not an array or an object. Parsed data:', parsedJson, "Extracted string:", jsonStringToParse);
        throw new Error('Ollama AI returned an unexpected JSON type after extraction (not an array or object).');
      }
    } else {
      console.error('Ollama: Failed to parse JSON from extracted string. Extracted string:', jsonStringToParse, "Original raw response:", rawTextResponse.substring(0,500) + "...");
      throw new Error('Ollama AI failed to parse JSON response after extraction.');
    }
    
    // Final check to ensure we have an array.
    if (!Array.isArray(resultsArray)) {
        console.error('Ollama: Critical error - resultsArray is not an array after all processing. Data:', resultsArray, "Original raw response:", rawTextResponse);
        throw new Error('Ollama AI: Critical internal error processing results (resultsArray not an array).');
    }
    
    const limitedResults = resultsArray.slice(0, numResults);

    return limitedResults.map((item) => {
      if (typeof item !== 'object' || item === null) {
        console.warn('Ollama: Search result item is not an object, skipping:', item);
        return {
          id: crypto.randomUUID(),
          name: 'Invalid Item From Ollama',
          domain: 'error.ollama.com',
          title: 'Invalid search result item received from Ollama',
          snippet: 'This item was not in the expected format. The model may have struggled with the JSON structure.',
          contentType: ContentType.BLOG_POST,
          preferredTheme: 'system',
          originalQuery: query,
        } as SearchResultItemData;
      }
      return {
        ...item,
        id: crypto.randomUUID(), 
        originalQuery: query,
        contentType: Object.values(ContentType).includes(item.contentType as ContentType) ? item.contentType as ContentType : ContentType.BLOG_POST,
        preferredTheme: ['light', 'dark', 'system'].includes(item.preferredTheme as string) ? item.preferredTheme as 'light' | 'dark' | 'system' : 'system',
      };
    });

  } catch (error) {
    console.error("Error generating search results with Ollama:", error);
    if (error instanceof Error && (error.message.startsWith('Ollama AI') || error.message.includes('Ollama API error') || error.message.startsWith('Ollama:'))) {
        throw error;
    }
    throw new Error(`Failed to communicate with Ollama for search results. ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function generatePageContentOllama(
  item: SearchResultItemData, 
  originalQuery: string, 
  modelName: string, 
  apiUrl: string = DEFAULT_OLLAMA_API_URL
): Promise<string | null> {
  const fullApiUrl = `${apiUrl.replace(/\/$/, '')}/api/generate`;
  const cacheKey = `${OLLAMA_PAGE_CACHE_PREFIX}${modelName}_${item.id}`;
  
  try {
    const cachedHtml = localStorage.getItem(cacheKey);
    if (cachedHtml) {
      console.log(`Ollama: Serving page from cache: ${item.id} (Model: ${modelName})`);
      return cachedHtml;
    }
  } catch (e) {
    console.warn(`Ollama: Could not read from localStorage for key ${cacheKey}:`, e);
  }

  const themeInstruction = item.preferredTheme === 'dark'
    ? "The page should have a dark theme, with a dark background (e.g., #121212, #202124) and light text (e.g., #e0e0e0, #ffffff). Ensure good contrast and readability."
    : item.preferredTheme === 'light'
    ? "The page should have a light theme, with a light background (e.g., #ffffff, #f8f9fa) and dark text (e.g., #212529, #333333). Ensure good contrast and readability."
    : "The page should respect system preferences for theme (light or dark) if possible, otherwise default to a clean, accessible light theme. Ensure good contrast and readability.";

  const imagePlaceholderInstruction = `
    **CRITICAL: Image and Avatar Placeholders:**
    You MUST use ONLY \`<img>\` tags for any visual elements. Differentiate between general content images and user avatars.

    **1. General Content Images (Article Headers, Product Photos, etc.): Use Picsum.photos**
    *   For general images, use the format: \`<img src="placeholder-image://picsum.photos/seed/{UNIQUE_SEED_KEYWORDS}/{WIDTH}/{HEIGHT}" alt="A descriptive alt text" style="width:{WIDTH}px; height:{HEIGHT}px; object-fit:cover; background-color: #ccc;">\`
    *   Replace \`{UNIQUE_SEED_KEYWORDS}\` with 1-3 keywords related to the image (e.g., 'abstract-technology', 'product-gadget').
    *   Replace \`{WIDTH}\` and \`{HEIGHT}\` with pixel dimensions. Add inline styles for width, height, object-fit:cover and a light background-color (#ccc or #eee for light theme, #333 or #444 for dark theme) as a fallback.
    *   Ensure these images are responsive (e.g., \`max-width: 100%; height: auto;\` in CSS).
    *   Example: \`<img src="placeholder-image://picsum.photos/seed/futuristic-cityscape/700/400" alt="Futuristic cityscape concept" style="width:700px; height:400px; object-fit:cover; background-color: #eeeeee; margin-bottom: 1em; max-width:100%;">\`

    **2. Avatars / Profile Photos: Use i.pravatar.cc**
    *   For user avatars (e.g., in forum posts, blog author bios), use the format: \`<img src="placeholder-avatar://i.pravatar.cc/{SIZE}?u={UNIQUE_USER_IDENTIFIER}" alt="Avatar for {USERNAME}" style="width:{SIZE}px; height:{SIZE}px; border-radius:50%; object-fit:cover; background-color: #ccc;">\`
    *   Replace \`{SIZE}\` with a small dimension, typically 40 to 80 (e.g., 50).
    *   Replace \`{UNIQUE_USER_IDENTIFIER}\` with a unique string like a fictional username or a random ID (e.g., 'user_alex_123', 'random_blogger_7'). This is CRITICAL for getting varied avatars.
    *   Ensure \`border-radius:50%\` for circular avatars. Add inline styles for width, height, object-fit:cover and a light background-color.
    *   Example: \`<img src="placeholder-avatar://i.pravatar.cc/50?u=forumUserXyz" alt="Avatar for forumUserXyz" style="width:50px; height:50px; border-radius:50%; object-fit:cover; background-color: #444444; margin-right: 10px;">\`

    **STRICTLY FORBIDDEN FOR BOTH TYPES:**
    *   NO \`<div>\` based placeholders. Only \`<img>\` tags with the specified "placeholder-image://" or "placeholder-avatar://" src formats.
    *   NO direct \`https://picsum.photos/...\` or \`https://i.pravatar.cc/...\` links in the \`src\` attribute. You MUST use the "placeholder-image://" or "placeholder-avatar://" prefix.
    *   NO \`background-image: url(...)\` CSS for content images/avatars.
    *   NO other placeholder services or image URLs.
    Ensure every image has proper alt text.
  `;
  
  const fullWidthRequirement = `
    - **ABSOLUTE REQUIREMENT for Full Width**: The primary content wrapper \`<div>\` directly inside the \`<body>\` (or the \`<body>\` itself if no such wrapper is used) MUST NOT have any \`max-width\`, \`margin-left\`, \`margin-right\`, \`padding-left\`, or \`padding-right\` CSS properties that would prevent it from spanning the entire viewport width. The intention is an edge-to-edge presentation for the main content block. Internal padding *within this full-width block* for text columns or specific content elements (e.g. \`padding: 0 20px;\` on a child div that holds the text) is acceptable for readability, but the main block itself must be full-width.
    - **DO NOT** apply CSS like \`max-width: [some_pixel_value]; margin: 0 auto;\` to the \`<body>\` or the main content wrapper div for THIS CONTENT TYPE. It must fill the screen.
  `;

  const currentYear = new Date().getFullYear();

  const headerFooterInstructions = `
      - **Page Header**: Include a distinctive header section. This header MUST prominently display the website name: "${item.name}". It can also include 2-3 simple, fake navigation links appropriate for the site type (e.g., "Home", "About", "Categories"). Style it to match the page's theme.
      - **Page Footer**: Include a distinct footer section at the very end of the <body>. This footer MUST include:
          - The website name: "${item.name}".
          - A fake copyright notice: "© ${currentYear} ${item.name}. All Rights Reserved." (or similar).
          - 2-4 relevant fake links (e.g., "Privacy Policy", "Contact Us", "Terms of Service"). Use \`href="#"\` or \`href="javascript:void(0)"\` for these links. Style it to match the page's theme and be unobtrusive.
  `;

  const contentSpecificInstructions: { [key in ContentType]: string } = {
    [ContentType.NEWS_ARTICLE]: `
      - Structure: A typical news article layout.
      ${fullWidthRequirement}
      ${headerFooterInstructions}
      - Headline Section: Prominently display the headline: "${item.title}".
      - Byline: Include a fictional byline and a plausible recent date.
      - Image: Include ONE lead image using the "placeholder-image://picsum.photos/" format. Place it near the top, below the headline/byline. Suggest dimensions like 700x400 or 800x450. Ensure responsiveness.
      - Body: Several paragraphs (3-5) of well-written, informative article content. Ensure readable line lengths.
      - Tone: Journalistic, objective.
    `,
    [ContentType.BLOG_POST]: `
      - Structure: An engaging blog post format.
      ${fullWidthRequirement}
      ${headerFooterInstructions}
      - Title Section: A clear title: "${item.title}".
      - Author/Date: Include a fictional author name and publication date. The author MIGHT have an avatar (e.g., 40x40 or 50x50); if so, use the "placeholder-avatar://i.pravatar.cc/" format with a unique user identifier.
      - Image: Optionally, include one or two general content images using the "placeholder-image://picsum.photos/" format, distributed within the content. Suggest dimensions like 600x350. Ensure responsiveness.
      - Body: Multiple paragraphs (4-6). Use headings/subheadings if appropriate. Ensure readable line lengths.
      - Tone: Can be informal, personal, or authoritative.
    `,
    [ContentType.PRODUCT_PAGE]: `
      - Structure: A clean, modern e-commerce product page.
      ${fullWidthRequirement}
      ${headerFooterInstructions}
      - Product Name Section: Prominently display "${item.title}".
      - Imagery: Include a prominent product image using "placeholder-image://picsum.photos/" (e.g., 400x400 or 500x500). Maybe smaller thumbnail images also using this format. Ensure responsiveness.
      - Features: Bulleted list of 3-5 key features.
      - Description: Detailed product description (2-3 paragraphs).
      - Price: Fictional price.
      - Call to Action: Prominent button (e.g., "Add to Cart", "Buy Now").
      - Tone: Persuasive, informative.
    `,
    [ContentType.FORUM_THREAD]: `
      - Structure: A typical forum thread layout.
      ${fullWidthRequirement}
      ${headerFooterInstructions}
      - Thread Title Section: Clearly state "${item.title}".
      - Original Post (OP): By a fictional user, including:
          - Avatar: A small (e.g., 50x50 or 60x60) circular avatar. CRITICAL: Use the "placeholder-avatar://i.pravatar.cc/{SIZE}?u={UNIQUE_USERNAME_OP}" format. Replace {UNIQUE_USERNAME_OP} with a unique name like "OriginalPoster_Thread123".
          - Username and timestamp.
          - Post content (2-3 paragraphs).
      - Replies: 2-4 replies from different fictional users, each with:
          - Avatar: Similar avatar for each replier. CRITICAL: Use "placeholder-avatar://i.pravatar.cc/{SIZE}?u={UNIQUE_USERNAME_REPLY_N}" format, ensuring {UNIQUE_USERNAME_REPLY_N} is unique for each replier (e.g., "ReplyUser_A", "ReplyUser_B").
          - Username, timestamp, and reply content (1-2 paragraphs each).
      - Tone: Conversational, community-driven.
    `,
  };

  const typeInstructions = contentSpecificInstructions[item.contentType] || contentSpecificInstructions[ContentType.BLOG_POST];

  const prompt = `
    You are an AI web page generator. Your task is to create a COMPLETE, SINGLE HTML file string for a fictional web page.
    This HTML output MUST include all necessary CSS within <style> tags in the <head> section.
    Do NOT use external CSS files or external font imports (use common system fonts like sans-serif, serif, monospace).
    The page should be visually appealing, responsive, and accessible.
    
    **CRITICAL Layout Constraint FOR ALL CONTENT TYPES:** 
    The generated <html> and <body> tags, AND any primary direct child wrapper \`<div>\` inside \`<body>\`, MUST be styled to take up the full available width. The height of these elements should be determined by their content, not fixed to the viewport height.
    Avoid applying \`max-width\` CSS to the overall \`<body>\` or its immediate main content wrapper that would constrain the entire page. 
    Individual elements *within* the full-width page (like text blocks, images, or specific content sections) can have their own \`max-width\` or padding for readability and layout purposes, but the foundational page structure MUST be full-width.

    Page Details:
    - Website Name: "${item.name}" (MUST be used in the page's header and footer)
    - Domain (for context): "${item.domain}"
    - Page Title (for HTML <title> tag and usually as a main heading): "${item.title}"
    - Original Search Query Context (to inform content): "${originalQuery}"
    - Content Type to Generate: "${item.contentType}"
    - Preferred Theme Hint: "${item.preferredTheme}" (${themeInstruction})

    Content Requirements for "${item.contentType}":
    ${typeInstructions} 
    
    ${imagePlaceholderInstruction}

    CRITICAL HTML Structure & CSS Requirements:
    1.  Start your output DIRECTLY with \`<!DOCTYPE html>\`. No introductory text or markdown.
    2.  Full HTML structure: \`<html><head>...</head><body>...</body></html>\`. The body must contain the header, main content, and footer as described.
    3.  \`<head>\` section: \`<meta charset="UTF-8">\`, \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\`, \`<title>${item.title}</title>\`, SINGLE \`<style>\` tag with ALL CSS.
    4.  **IMPORTANT Styling for INJECTED HTML in your <style> tag:**
        - Apply this exact CSS to the generated HTML: \`html, body { width: 100%; margin: 0; padding: 0; box-sizing: border-box; }\`
        - **VERY IMPORTANT FOR SCROLLING BEHAVIOR: The generated \`<html>\` and \`<body>\` tags (of THIS AI-generated HTML document snippet) MUST have \`height: auto;\` and \`overflow-y: visible;\`. DO NOT set \`height: 100%\`, \`height: 100vh\`, or \`min-height: 100vh\` on these elements. DO NOT set \`overflow-y: scroll;\` or \`overflow-y: auto;\` on these elements. These styles MUST allow the content to expand naturally and delegate scrolling to the parent (host) page.**
        - An \`overflow-x: hidden;\` on the generated \`<body>\` tag is acceptable to prevent accidental horizontal scrollbars.
        - If you use a primary wrapper \`<div>\` directly inside your generated \`<body>\`, this wrapper also MUST NOT have a fixed height (like \`height: 100vh\`) combined with \`overflow-y: scroll/auto\`. It should also expand with its content and use \`overflow-y: visible;\`.
        - Apply a base font: \`body { font-family: sans-serif; /* or other common system font */ }\`
    5.  The \`<body>\` tag or its main immediate child wrapper \`div\` must also be full-width, as per the "CRITICAL Layout Constraint" above.
    6.  Theme: Strictly adhere to the \`${themeInstruction}\`. All colors must reflect the chosen theme.
    7.  Responsiveness: Ensure the page looks good on mobile and desktop. Use responsive units and media queries if necessary. Images should be responsive (e.g., \`max-width: 100%; height: auto;\`).
    8.  NO JAVASCRIPT: No \`<script>\` tags or inline JavaScript.
    9.  Image Placeholders: Strictly use the "placeholder-image://picsum.photos/..." format for general images AND "placeholder-avatar://i.pravatar.cc/..." for avatars, as instructed above.
    10. Content Plausibility: Generate creative and plausible text content.

    Output ONLY the raw HTML code. Do not wrap it in markdown or add any explanations.
  `;
  
  const requestBody: OllamaGenerateRequest = {
    model: modelName,
    prompt: prompt,
    stream: false, 
    options: {
        temperature: 0.7,
    }
  };

  try {
    console.log(`Ollama: Generating HTML for: ${item.title}, Type: ${item.contentType}, Theme: ${item.preferredTheme}, Model: ${modelName}`);
    const apiResponse = await fetch(fullApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      throw new Error(`Ollama API error (${apiResponse.status}): ${errorBody}`);
    }

    const ollamaResult: OllamaGenerateResponse = await apiResponse.json();
    let htmlContent = ollamaResult.response;

    if (!htmlContent || typeof htmlContent !== 'string') {
      console.error("Ollama AI returned no content or non-string content for HTML page.");
      throw new Error("Ollama AI failed to generate page content string.");
    }
    
    let cleanedHtml = htmlContent.trim();
    const htmlFenceRegex = /^```(?:html)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanedHtml.match(htmlFenceRegex);
    if (match && match[1]) {
      cleanedHtml = match[1].trim();
    }
    
    cleanedHtml = cleanedHtml.replace(
        /placeholder-image:\/\/picsum\.photos\/seed\/([^/]+)\/(\d+)\/(\d+)/g,
        (_match, seed, width, height) => {
            const saneSeed = encodeURIComponent(seed.substring(0, 50)); 
            return `https://picsum.photos/seed/${saneSeed}/${width}/${height}`;
        }
    );
    cleanedHtml = cleanedHtml.replace( 
        /placeholder-image:\/\/picsum\.photos\/(\d+)\/(\d+)/g,
        (_match, width, height) => `https://picsum.photos/${width}/${height}`
    );
    cleanedHtml = cleanedHtml.replace(
        /placeholder-avatar:\/\/i\.pravatar\.cc\/(\d+)\?u=([^"\s&']+)/g,
        (_match, size, userIdentifier) => {
            const saneIdentifier = encodeURIComponent(userIdentifier.substring(0, 50)); 
            return `https://i.pravatar.cc/${size}?u=${saneIdentifier}`;
        }
    );
     cleanedHtml = cleanedHtml.replace( 
        /placeholder-avatar:\/\/i\.pravatar\.cc\/(\d+)/g,
        (_match, size) => `https://i.pravatar.cc/${size}` 
    );

    const lowerCaseContent = cleanedHtml.toLowerCase();
    if (!lowerCaseContent.startsWith("<!doctype html>") && !lowerCaseContent.startsWith("<html")) {
        console.warn("Ollama: Generated HTML might be missing doctype or html tag at the beginning. Raw content:", cleanedHtml.substring(0,200));
        if (lowerCaseContent.includes("<html") && !lowerCaseContent.startsWith("<!doctype html>")) {
             if (lowerCaseContent.indexOf("<html") < 10) { 
                 console.warn("Ollama: Prepending <!DOCTYPE html> as it was missing or misplaced.");
                 cleanedHtml = "<!DOCTYPE html>\n" + cleanedHtml.substring(cleanedHtml.toLowerCase().indexOf("<html"));
             } else {
                 console.error("Ollama AI failed to generate valid HTML structure (<html> tag not at/near beginning).");
                 throw new Error("Ollama AI failed to generate valid HTML structure (<html> tag not at/near beginning).");
             }
        } else if (!lowerCaseContent.includes("<html")) { 
            console.error("Ollama AI failed to generate valid HTML structure (missing <html> tag after cleaning).");
            throw new Error("Ollama AI failed to generate valid HTML structure (missing <html> tag after cleaning).");
        }
    }
     if (!lowerCaseContent.includes("</head>") || !lowerCaseContent.includes("</body>") || !lowerCaseContent.includes("</html>")) {
        console.warn("Ollama: Generated HTML might be incomplete (missing head/body/html closing tags). Content length:", cleanedHtml.length);
    }


    try {
      localStorage.setItem(cacheKey, cleanedHtml);
      console.log(`Ollama: Cached page: ${item.id} (Model: ${modelName})`);
    } catch (e) {
      console.warn(`Ollama: Could not write to localStorage for key ${cacheKey}:`, e);
    }

    return cleanedHtml;

  } catch (error) {
    console.error(`Ollama: Error generating HTML page content for ${item.contentType} ("${item.title}"):`, error);
    if (error instanceof Error && (error.message.startsWith('Ollama AI failed') || error.message.startsWith('Ollama API error'))) {
        throw error;
    }
    throw new Error(`Failed to communicate with Ollama for HTML page content. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

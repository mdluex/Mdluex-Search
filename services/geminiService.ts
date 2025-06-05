
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SearchResultItemData, ContentType } from '../types';
import { GEMINI_TEXT_MODEL, GEMINI_PAGE_CACHE_PREFIX } from '../constants'; // Updated constant name

let ai: GoogleGenAI | undefined;
let currentApiKey: string | undefined;

export function initializeGeminiClient(userApiKey?: string) {
  const apiKeyToUse = userApiKey || process.env.API_KEY;

  if (!apiKeyToUse) {
    console.error("Gemini API Key is not available. Please provide one in settings or ensure process.env.API_KEY is set.");
    ai = undefined; // Ensure ai is undefined if no key
    currentApiKey = undefined;
    return;
  }

  if (ai && currentApiKey === apiKeyToUse) {
    // Client already initialized with the same key
    return;
  }

  try {
    ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    currentApiKey = apiKeyToUse;
    console.log("Gemini client initialized.", userApiKey ? "Using user-provided API key." : "Using API key from environment.");
  } catch (error) {
    console.error("Failed to initialize Gemini client:", error);
    ai = undefined;
    currentApiKey = undefined;
  }
}

// Call initialize on load with no user key, allowing fallback to env.
// App.tsx will call this again if user provides a key.
initializeGeminiClient(); 

// export const PAGE_CACHE_PREFIX = 'mdlxSearch_pageCache_'; // Old name, replaced by GEMINI_PAGE_CACHE_PREFIX

function parseGeminiJsonResponse<T>(jsonString: string): T | null {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    console.warn("parseGeminiJsonResponse received non-string or empty input. Input:", jsonString);
    return null;
  }

  let cleanJsonString = jsonString.trim();
  if (cleanJsonString.charCodeAt(0) === 0xFEFF) {
    cleanJsonString = cleanJsonString.substring(1);
  }

  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const fenceMatch = cleanJsonString.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
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
      "\nAttempted to parse (string after cleaning):", `>>>${cleanJsonString}<<<`, 
      "\nOriginal string passed to parser:", `>>>${jsonString}<<<`
    );
    return null;
  }
}

async function ensureAiClientInitialized(userApiKey?: string): Promise<GoogleGenAI> {
  if (!ai || (userApiKey && currentApiKey !== userApiKey) || (!userApiKey && currentApiKey !== process.env.API_KEY)) {
    initializeGeminiClient(userApiKey);
  }
  if (!ai) {
    console.error("Gemini client is not initialized. Cannot make API call.");
    throw new Error("Gemini client not initialized. Configure API key in settings or ensure process.env.API_KEY is available.");
  }
  return ai;
}

export async function generateSearchResults(query: string, userGeminiApiKey?: string): Promise<SearchResultItemData[]> {
  const localAI = await ensureAiClientInitialized(userGeminiApiKey);
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
    const response: GenerateContentResponse = await localAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const textResponse = response.text;
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

export async function generatePageContent(item: SearchResultItemData, originalQuery: string, userGeminiApiKey?: string): Promise<string | null> {
  const localAI = await ensureAiClientInitialized(userGeminiApiKey);
  const cacheKey = `${GEMINI_PAGE_CACHE_PREFIX}${item.id}`; // Updated constant name
  
  try {
    const cachedHtml = localStorage.getItem(cacheKey);
    if (cachedHtml) {
      console.log(`Serving page from cache: ${item.id}`);
      return cachedHtml;
    }
  } catch (e) {
    console.warn(`Could not read from localStorage for key ${cacheKey}:`, e);
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

  try {
    console.log(`Generating HTML for: ${item.title}, Type: ${item.contentType}, Theme: ${item.preferredTheme}`);
    const response: GenerateContentResponse = await localAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    let htmlContent = response.text;

    if (!htmlContent || typeof htmlContent !== 'string') {
      console.error("AI returned no content or non-string content for HTML page.");
      throw new Error("AI failed to generate page content string.");
    }
    
    let cleanedHtml = htmlContent.trim();
    const htmlFenceRegex = /^```(?:html)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanedHtml.match(htmlFenceRegex);
    if (match && match[1]) {
      cleanedHtml = match[1].trim();
    }
    
    cleanedHtml = cleanedHtml.replace(
        /placeholder-image:\/\/picsum\.photos\/seed\/([^/]+)\/(\d+)\/(\d+)/g,
        (match, seed, width, height) => {
            const saneSeed = encodeURIComponent(seed.substring(0, 50)); 
            return `https://picsum.photos/seed/${saneSeed}/${width}/${height}`;
        }
    );
    cleanedHtml = cleanedHtml.replace( 
        /placeholder-image:\/\/picsum\.photos\/(\d+)\/(\d+)/g,
        (match, width, height) => `https://picsum.photos/${width}/${height}`
    );

    cleanedHtml = cleanedHtml.replace(
        /placeholder-avatar:\/\/i\.pravatar\.cc\/(\d+)\?u=([^"\s&']+)/g,
        (match, size, userIdentifier) => {
            const saneIdentifier = encodeURIComponent(userIdentifier.substring(0, 50)); 
            return `https://i.pravatar.cc/${size}?u=${saneIdentifier}`;
        }
    );
     cleanedHtml = cleanedHtml.replace( 
        /placeholder-avatar:\/\/i\.pravatar\.cc\/(\d+)/g,
        (match, size) => `https://i.pravatar.cc/${size}` 
    );

    const lowerCaseContent = cleanedHtml.toLowerCase();
    if (!lowerCaseContent.startsWith("<!doctype html>") && !lowerCaseContent.startsWith("<html")) {
        console.warn("Generated HTML might be missing doctype or html tag at the beginning. Raw content (after cleaning):", cleanedHtml.substring(0,150));
        if (lowerCaseContent.includes("<html") && !lowerCaseContent.startsWith("<!doctype html>")) {
             if (lowerCaseContent.indexOf("<html") < 10) { 
                 console.warn("Prepending <!DOCTYPE html> as it was missing or misplaced.");
                 cleanedHtml = "<!DOCTYPE html>\n" + cleanedHtml.substring(cleanedHtml.toLowerCase().indexOf("<html"));
             } else {
                 console.error("AI failed to generate valid HTML structure (<html> tag not at/near beginning).");
                 throw new Error("AI failed to generate valid HTML structure (<html> tag not at/near beginning).");
             }
        } else if (!lowerCaseContent.includes("<html")) { 
            console.error("AI failed to generate valid HTML structure (missing <html> tag after cleaning).");
            throw new Error("AI failed to generate valid HTML structure (missing <html> tag after cleaning).");
        }
    }
    if (!lowerCaseContent.includes("</head>") || !lowerCaseContent.includes("</body>") || !lowerCaseContent.includes("</html>")) {
        console.warn("Generated HTML might be incomplete (missing head/body/html closing tags). Content length:", cleanedHtml.length);
    }

    try {
      localStorage.setItem(cacheKey, cleanedHtml);
      console.log(`Cached page: ${item.id}`);
    } catch (e) {
      console.warn(`Could not write to localStorage for key ${cacheKey}:`, e);
    }

    return cleanedHtml;
  } catch (error) {
    console.error(`Error generating HTML page content for ${item.contentType} ("${item.title}"):`, error);
    if (error instanceof Error && error.message.startsWith('AI failed to generate')) {
        throw error;
    }
    throw new Error(`Failed to communicate with AI for HTML page content. ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
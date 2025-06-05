# Mdluex Search | The Fictional Internet

[![GitHub](https://img.shields.io/badge/GitHub-Mdluex%20Search-blue?style=flat-square&logo=github)](https://github.com/mdluex/Mdluex-Search)

A fictional search engine powered by AI, built with React and TypeScript. Enter any query, and Mdluex Search returns a list of fictional (and often humorous) search results. Clicking a result generates a full, unique HTML webpage on the fly.

## Installation

### Option 1: Clone the Repository (Recommended)

1. Open your terminal or command prompt.
2. Clone the repository:
   ```bash
   git clone https://github.com/mdluex/Mdluex-Search.git
   cd Mdluex-Search
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up your environment:
   - For Gemini API (optional): Set the `API_KEY` environment variable
   - For Ollama (optional): Install from [ollama.com/download](https://ollama.com/download)

### Option 2: Download ZIP

1. Visit [https://github.com/mdluex/Mdluex-Search](https://github.com/mdluex/Mdluex-Search)
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file to your desired location
5. Open a terminal in the extracted directory
6. Install dependencies:
   ```bash
   npm install
   ```
7. Set up your environment as described in Option 1

### Post-Installation

After installation, you can start the application using either:

- Windows: Double-click `start-app.bat`
- Linux/Mac: 
  ```bash
  chmod +x start-app.sh
  ./start-app.sh
  ```

For more details on running the application, see the [Running the Application](#2-running-the-application) section below.

## Features

*   **AI-Powered Search:** Enter any query and get a list of fictional search results.
*   **Dynamic Content Generation:** Clicking a search result generates a full, unique HTML webpage on the fly.
*   **Shareable Links:** Create temporary public URLs using Localtunnel to share your search results with others.
*   **Dual AI Provider Support:**
    *   **Gemini:** Utilizes Google's Generative AI models for high-quality content.
    *   **Ollama:** Supports running local large language models for offline or custom use.
*   **Settings Configuration:**
    *   Switch between Gemini and Ollama providers.
    *   Configure Gemini API Key (can use environment variable or user input).
    *   Configure Ollama API URL and select from available local models.
*   **Responsive Design:** Adapts to various screen sizes for a seamless experience on desktop and mobile.
*   **Themed Content:** Generated pages respect a preferred theme (light, dark, or system) specified in the search result metadata.
*   **Image Placeholders:** Dynamically loads images from placeholder services (Picsum.photos, i.pravatar.cc) into generated content.
*   **Caching:** Generated page content is cached in `localStorage` to speed up subsequent views of the same page.
*   **"I'm Feeling Fictional" Button:** Generates a random, imaginative search query.
*   **Easy Setup:** Includes a `.bat` script for easy startup on Windows.

## Technology Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI APIs:**
    *   `@google/genai` (for Gemini API)
    *   Direct HTTP requests to Ollama's API
*   **Icons:** React Feather
*   **Module Loading:** ES Modules via `esm.sh` (no build step)
*   **Development Server:** Vite
*   **Tunneling:** Localtunnel for creating shareable links

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js and npm:**
    *   The application uses `npx` (which comes with npm) to run a local server.
    *   Download and install from [nodejs.org](https://nodejs.org/).
2.  **Ollama (Optional, if you want to use local models):**
    *   Download and install from [ollama.com/download](https://ollama.com/download).
    *   Ensure the `ollama` command is in your system's PATH.
    *   Pull some models after installation (e.g., `ollama pull llama3`, `ollama pull mistral`).
3.  **Localtunnel (Optional, for shareable links):**
    *   Will be automatically installed via `npx` when needed.
    *   No manual installation required.

## Setup and Running the Application

### 1. API Key for Gemini (Required for Gemini Provider)

If you plan to use the Gemini provider, you need an API key from Google AI Studio.

*   Go to [Google AI Studio](https://aistudio.google.com/app/apikey) to get your API key.
*   **Crucially, this API key must be set as an environment variable named `API_KEY` in the environment where you run `start-app.bat` or your terminal.**
    *   You can set this temporarily in your command prompt: `set API_KEY=YOUR_API_KEY_HERE` before running the script.
    *   Alternatively, set it as a system-wide environment variable.
*   The application will first try to use a user-provided API key from the settings modal. If that's empty, it will fall back to `process.env.API_KEY`.

### 2. Running the Application

#### Using Start Scripts

The easiest way to start the application is by using the provided start scripts:

##### Windows (`start-app.bat`)
1.  Save all project files (including `start-app.bat`) into a directory.
2.  **Ensure `API_KEY` environment variable is set if you intend to use Gemini.**
3.  Double-click `start-app.bat`.
    This script will:
    *   Check for Node.js, npm, and Ollama installations.
    *   Ask if you want to create a shareable link using Localtunnel.
    *   If yes, fetch and display the tunnel password.
    *   Start the application using Vite.
    *   Create a shareable link at `https://mdluex-search.loca.lt` if requested.
    *   Open your browser automatically.

##### Linux/Mac (`start-app.sh`)
1.  Save all project files (including `start-app.sh`) into a directory.
2.  Make the script executable:
    ```bash
    chmod +x start-app.sh
    ```
3.  **Ensure `API_KEY` environment variable is set if you intend to use Gemini.**
4.  Run the script:
    ```bash
    ./start-app.sh
    ```
    This script will:
    *   Check for Node.js, npm, and Ollama installations.
    *   Ask if you want to create a shareable link using Localtunnel.
    *   If yes, fetch and display the tunnel password.
    *   Start the application using Vite.
    *   Create a shareable link at `https://mdluex-search.loca.lt` if requested.
    *   Open your browser automatically.

#### Manual Startup (All Platforms)

1.  **Set Gemini API Key (if using Gemini):**
    *   **Linux/macOS:** `export API_KEY="YOUR_GEMINI_API_KEY"`
    *   **Windows (PowerShell):** `$env:API_KEY="YOUR_GEMINI_API_KEY"`
    *   **Windows (CMD):** `set API_KEY=YOUR_GEMINI_API_KEY`
2.  **Prepare for `npx` (No explicit `npm install` needed for runtime):**
    The project uses CDNs via import maps in `index.html` for runtime dependencies, so a general `npm install` for those is not required. The `serve` command for the local server is run via `npx serve .`, which will download `serve` temporarily if it's not already available.
3.  **Start Ollama Server (Optional):**
    If you want to use Ollama, open a new terminal and run:
    ```bash
    ollama serve
    ```
    Keep this terminal window open.
4.  **Start the Frontend Application Server:**
    In your main terminal (in the project root), run:
    ```bash
    npx serve .
    ```
    This will typically start the server on `http://localhost:3000`.
5.  Open your browser and navigate to `http://localhost:3000` (or the port shown in the terminal).

## Configuration

The application can be configured via the **Settings modal**, accessible by clicking the gear icon:

*   **Top-right on the Home page.**
*   **In the header on the Search Results and Content Display pages.**

**Settings Options:**

*   **AI Provider:**
    *   `Gemini`: Uses Google's Gemini API.
    *   `Ollama`: Uses a local Ollama instance.
*   **Gemini API Key:**
    *   Enter your Gemini API key here to override the environment variable.
    *   If left empty, the app will attempt to use the `API_KEY` environment variable.
*   **Ollama API URL:**
    *   The base URL for your local Ollama API (default: `http://localhost:11434`).
*   **Ollama Model Selection:**
    *   If Ollama is selected, a dropdown will appear with models fetched from your local Ollama instance.
    *   A "Refresh" button allows you to re-fetch the list of available models.

Settings are saved to `localStorage` and persist across sessions.

## Project Structure

```
.
├── components/               # React components
│   ├── App.tsx               # Main application component, state management, routing
│   ├── ContentDisplayPage.tsx # Renders the AI-generated HTML page
│   ├── Footer.tsx            # Application footer
│   ├── HomePage.tsx          # Initial search page
│   ├── LoadingSpinner.tsx    # Reusable loading indicator
│   ├── ResultItemCard.tsx    # Displays a single search result
│   ├── SearchBar.tsx         # Reusable search input bar
│   ├── SearchResultsPage.tsx # Displays list of search results and pagination
│   └── SettingsModal.tsx     # Modal for configuring AI provider and keys
├── services/                 # API interaction logic
│   ├── geminiService.ts      # Functions for interacting with Gemini API
│   └── ollamaService.ts      # Functions for interacting with Ollama API
├── constants.ts              # Application-wide constants (model names, localStorage keys)
├── index.html                # Main HTML file, sets up import maps and Tailwind
├── index.tsx                 # Entry point for React application
├── metadata.json             # Application metadata
├── README.md                 # This file
├── start-app.bat             # Windows batch script to start the app and Ollama
├── start-app.sh              # Shell script to start the app on Linux/Mac
└── types.ts                  # TypeScript type definitions
```

## How It Works

1.  **User Interaction:** The user lands on the `HomePage`, enters a search query into the `SearchBar`, and submits.
2.  **State Update:** `App.tsx` updates its state, setting `isLoadingResults` to true and transitioning the view.
3.  **API Key Initialization:** The `geminiService.ts` initializes the `GoogleGenAI` client using either a user-provided key (from settings/localStorage) or the `process.env.API_KEY`.
4.  **Search Result Generation:**
    *   Based on the selected provider in `App.tsx` (Gemini or Ollama):
        *   If **Gemini**, `generateSearchResultsGemini` in `geminiService.ts` constructs a prompt and calls the Gemini API (using `responseMimeType: "application/json"`) to get a JSON array of search results.
        *   If **Ollama**, `generateSearchResultsOllama` in `ollamaService.ts` constructs a similar prompt and calls the local Ollama API's `/api/generate` endpoint. It then processes the text response, extracting the JSON array using regular expressions to ensure robustness.
5.  **Display Results:** `App.tsx` receives the search results, updates its state, and renders `SearchResultsPage.tsx`, which displays the items using `ResultItemCard.tsx`.
6.  **Content Page Generation:**
    *   The user clicks on a `ResultItemCard`.
    *   `App.tsx` sets `isLoadingContent` to true.
    *   Based on the selected provider:
        *   If **Gemini**, `generatePageContentGemini` constructs a detailed prompt (including HTML structure, CSS, image placeholder instructions, theme, and content type specifics) and calls the Gemini API.
        *   If **Ollama**, `generatePageContentOllama` uses a similar detailed prompt and calls the local Ollama API's `/api/generate` endpoint.
7.  **Content Rendering:**
    *   The AI returns a full HTML string.
    *   The service (Gemini or Ollama) processes this HTML:
        *   Replaces "placeholder-image://" and "placeholder-avatar://" URLs with actual image URLs from Picsum.photos and i.pravatar.cc.
        *   Performs basic validation of the HTML structure.
    *   The HTML content is cached in `localStorage` with a unique key based on the item ID (and model name for Ollama).
    *   `App.tsx` updates its state with the HTML and renders `ContentDisplayPage.tsx`.
    *   `ContentDisplayPage.tsx` uses `dangerouslySetInnerHTML` to render the AI-generated HTML string. The theme of the wrapper is adjusted based on the `preferredTheme` of the search result.
8.  **Caching:** On subsequent requests for the same page content (same item ID), the content is served directly from `localStorage` if available, bypassing the AI API call. Caches are cleared on a new search.

## Environment Variables

*   **`API_KEY`**: (Required for Gemini) Your Google Gemini API key. This must be set in the environment where the application is run. The application uses `process.env.API_KEY` as a fallback if no key is provided in the settings modal.

## Known Limitations / Future Improvements

*   **Ollama Model Variability:** The quality and consistency of output from Ollama can vary significantly depending on the model used and its ability to follow complex instructions (especially for structured JSON or HTML).
*   **Error Handling:** While basic error handling is in place, it could be made more granular and user-friendly for specific API issues.
*   **No Build Step:** The application uses ES Modules loaded directly from `esm.sh` via an import map in `index.html`. For larger applications, a build step (e.g., with Vite or Webpack) would be beneficial for optimization, bundling, and legacy browser support.
*   **Prompt Engineering:** Prompts for both Gemini and Ollama can be further refined for better and more consistent outputs.
*   **Advanced Ollama Configuration:** The settings modal could expose more Ollama parameters (temperature, top_k, etc.).
*   **Streaming Responses:** For Ollama, implementing streaming responses could improve perceived performance, especially for page content generation. Gemini streaming is also an option.
*   **Security of Client-Side API Key:** While the Gemini API key can be user-provided and stored in `localStorage`, using environment variables for the primary key is a common pattern for client-side demos. For production applications, API keys should ideally be handled via a backend proxy.

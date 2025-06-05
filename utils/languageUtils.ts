// List of RTL language codes
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv'];

// Function to detect if text is likely in an RTL language
export function isRTLText(text: string): boolean {
  // Check if text contains any RTL characters
  const rtlRegex = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

// Function to detect the dominant language of text
export function detectLanguage(text: string): string {
  // Simple heuristic: if text contains RTL characters, assume Arabic
  // This is a simplified version - in a production app, you'd want to use a proper language detection library
  return isRTLText(text) ? 'ar' : 'en';
}

// Function to get the text direction based on language
export function getTextDirection(text: string): 'rtl' | 'ltr' {
  return isRTLText(text) ? 'rtl' : 'ltr';
} 
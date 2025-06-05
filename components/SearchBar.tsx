import React, { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialValue = '', isLoading = false }) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onSearch(query);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex w-full items-center rounded-full bg-white dark:bg-[#303134] h-11 shadow hover:shadow-md focus-within:shadow-md focus-within:ring-1 focus-within:ring-transparent dark:focus-within:bg-[#303134] dark:hover:bg-neutral-700"
      // Removed border classes, relying on bg and shadow. Adjusted height slightly to h-11.
    >
      <div className="pl-4 pr-2 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-400 dark:text-neutral-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the AI-generated web..."
        className="flex-grow h-full bg-transparent outline-none text-gray-900 dark:text-neutral-100 placeholder-gray-500 dark:placeholder-neutral-400 text-sm"
        disabled={isLoading}
      />
      <div className="pr-3 flex items-center space-x-3">
        {/* Placeholder Microphone Icon */}
        <button type="button" className="p-1 rounded-full hover:bg-neutral-600" aria-label="Search by voice" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-400 dark:text-neutral-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125S10.875 5.754 10.875 6.375v7.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
        </button>
        {/* Placeholder Camera/Lens Icon */}
        <button type="button" className="p-1 rounded-full hover:bg-neutral-600" aria-label="Search by image" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-gray-400 dark:text-neutral-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.174 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
        </button>
         {/* Submit button (hidden, form submits on enter) */}
        <button type="submit" className="hidden" disabled={isLoading}></button>
      </div>
    </form>
  );
};

export default SearchBar;
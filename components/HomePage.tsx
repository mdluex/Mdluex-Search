
import React from 'react';
import SearchBar from './SearchBar';
import { APP_TITLE } from '../constants';

interface HomePageProps {
  onSearch: (query: string) => void;
  initialSearchTerm: string;
  // isLoading prop removed, App.tsx handles global loading indicator
}

const HomePage: React.FC<HomePageProps> = ({ onSearch, initialSearchTerm }) => {
  const handleFeelingFictional = () => {
    const prompts = [
      "The lost city of digital Atlantis",
      "Quantum cats and their paradoxes",
      "How to bake a cake in zero gravity",
      "The secret history of AI pirates",
      "Why do robots dream of electric sheep?",
      "Alien languages decoded by neural nets",
      "The Fictional Web's most mysterious page",
      "A guide to time travel for beginners",
      "The best fictional gadgets of 2099",
      "Unicorns in the blockchain era"
    ];
    const randomQuery = prompts[Math.floor(Math.random() * prompts.length)];
    onSearch(randomQuery);
  };
  
  const handleMainSearch = () => {
     const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement | null;
     const query = inputElement?.value.trim();
     if (query) { 
        onSearch(query);
     }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-center px-4 pt-16 sm:pt-0"> {/* Added pt-16 for small screens to avoid overlap with potential fixed header elements like settings */}
      <h1 className="text-7xl sm:text-8xl font-bold mb-4 mt-0 text-neutral-800 dark:text-white select-none">
        {APP_TITLE}
      </h1>
      <div className="w-full max-w-xl flex flex-col items-center">
        <div className="w-full mb-4">
          <SearchBar onSearch={onSearch} initialValue={initialSearchTerm} />
        </div>
        <div className="flex space-x-3 mb-4">
          <button
            onClick={handleMainSearch}
            className="px-4 py-2 bg-neutral-200 dark:bg-[#303134] hover:dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded text-sm transition-colors"
          >
            Mdluex Search
          </button>
          <button
            onClick={handleFeelingFictional}
            className="px-4 py-2 bg-neutral-200 dark:bg-[#303134] hover:dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded text-sm transition-colors"
          >
            I'm Feeling Fictional
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-neutral-400">
          Explore the AI-generated universe in: <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={e => { e.preventDefault(); onSearch('The Fictional Web by Mahmoud Salah El-Din'); }}>The Fictional Web</a>
        </p>
      </div>
    </div>
  );
};

export default HomePage;

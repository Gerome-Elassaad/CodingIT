"use client";

import { useState } from "react";
import { appConfig } from '@/config/app.config';
import HeroInputSubmitButton from "@/components/app/(home)/sections/hero-input/Button/Button";

interface HeroInputProps {
  url: string;
  setUrl: (url: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: any[];
  isFadingOut: boolean;
  handleSubmit: (selectedResult?: any) => void;
  handleSearchAgain: () => void;
  validateUrl: (urlString: string) => boolean;
  isURL: (str: string) => boolean;
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export default function HeroInput({
  url,
  setUrl,
  isSearching,
  hasSearched,
  searchResults,
  isFadingOut,
  handleSubmit,
  handleSearchAgain,
  validateUrl,
  isURL,
  selectedStyle,
  setSelectedStyle,
  selectedModel,
  setSelectedModel,
}: HeroInputProps) {
  const [isValidUrl, setIsValidUrl] = useState<boolean>(false);

  const styles = [
    { id: "1", name: "Glassmorphism", description: "Frosted glass effect" },
    { id: "2", name: "Neumorphism", description: "Soft 3D shadows" },
    { id: "3", name: "Brutalism", description: "Bold and raw" },
    { id: "4", name: "Minimalist", description: "Clean and simple" },
    { id: "5", name: "Dark Mode", description: "Dark theme design" },
    { id: "6", name: "Gradient Rich", description: "Vibrant gradients" },
    { id: "7", name: "3D Depth", description: "Dimensional layers" },
    { id: "8", name: "Retro Wave", description: "80s inspired" },
  ];

  const models = appConfig.ai.availableModels.map(model => ({
    id: model,
    name: appConfig.ai.modelDisplayNames[model] || model,
  }));

  return (
    <div className="max-w-552 mx-auto z-[11] lg:z-[2]">
      <div className="rounded-20 -mt-30 lg:-mt-30">
        <div
          className="bg-white rounded-20"
          style={{
            boxShadow: "0px 0px 44px 0px rgba(0, 0, 0, 0.02), 0px 88px 56px -20px rgba(0, 0, 0, 0.03), 0px 56px 56px -20px rgba(0, 0, 0, 0.02), 0px 32px 32px -20px rgba(0, 0, 0, 0.03), 0px 16px 24px -12px rgba(0, 0, 0, 0.03), 0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 0px 0px 10px #F9F9F9",
          }}
        >
          <div className="p-16 flex gap-12 items-center w-full relative bg-white rounded-20">
            {hasSearched && searchResults.length > 0 && !isFadingOut ? (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-40 flex-shrink-0"
                >
                  <rect x="2" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="11" y="4" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="2" y="11" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="11" y="11" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <div className="flex-1 text-body-input text-accent-black">
                  Select which site to clone from the results below
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSearchAgain();
                  }}
                  className="button relative rounded-10 px-12 py-8 text-label-medium font-medium flex items-center justify-center gap-6 bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-[0.995] transition-all"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-60"
                  >
                    <path d="M14 14L10 10M11 6.5C11 9 9 11 6.5 11C4 11 2 9 2 6.5C2 4 4 2 6.5 2C9 2 11 4 11 6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>Search Again</span>
                </button>
              </>
            ) : (
              <>
                {isURL(url) ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-40 flex-shrink-0"
                  >
                    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 10L9 12L13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-40 flex-shrink-0"
                  >
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12.5 12.5L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                <input
                  className="flex-1 bg-transparent text-body-input text-accent-black placeholder:text-black-alpha-48 focus:outline-none focus:ring-0 focus:border-transparent"
                  placeholder="Enter URL or search term..."
                  type="text"
                  value={url}
                  disabled={isSearching}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUrl(value);
                    setIsValidUrl(validateUrl(value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isSearching) {
                      handleSubmit();
                    }
                  }}
                  className={isSearching ? 'pointer-events-none' : ''}
                >
                  <HeroInputSubmitButton
                    dirty={url.length > 0}
                    buttonText={isURL(url) ? 'Scrape Site' : 'Search'}
                    disabled={isSearching}
                  />
                </div>
              </>
            )}
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isValidUrl ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-[28px]">
              <div className="border-t border-gray-100 bg-white">
                <div className={`mb-2 pt-4 transition-all duration-300 transform ${isValidUrl ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`} style={{ transitionDelay: '100ms' }}>
                  <div className="grid grid-cols-4 gap-1">
                    {styles.map((style, index) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`
                          py-2.5 px-2 rounded text-[10px] font-medium border transition-all text-center
                          ${selectedStyle === style.id
                            ? 'border-orange-500 bg-orange-50 text-orange-900'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}
                          ${isValidUrl ? 'opacity-100' : 'opacity-0'}
                        `}
                        style={{
                          transitionDelay: `${150 + index * 30}ms`,
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`flex gap-3 mt-2 pb-4 transition-all duration-300 transform ${isValidUrl ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="px-3 py-2.5 text-[10px] font-medium text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="flex-1 px-3 py-2.5 text-[10px] text-gray-700 bg-gray-50 rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
                    placeholder="Additional instructions (optional)"
                    onChange={(e) => sessionStorage.setItem('additionalInstructions', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

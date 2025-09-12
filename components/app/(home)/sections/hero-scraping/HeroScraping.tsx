"use client";

interface SearchResult {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  markdown: string;
}

interface HeroScrapingProps {
  showSearchTiles: boolean;
  hasSearched: boolean;
  isFadingOut: boolean;
  isSearching: boolean;
  searchResults: SearchResult[];
  handleSubmit: (selectedResult?: SearchResult) => void;
  showInstructionsForIndex: number | null;
  setShowInstructionsForIndex: (index: number | null) => void;
  additionalInstructions: string;
  setAdditionalInstructions: (instructions: string) => void;
}

export default function HeroScraping({
  showSearchTiles,
  hasSearched,
  isFadingOut,
  isSearching,
  searchResults,
  handleSubmit,
  showInstructionsForIndex,
  setShowInstructionsForIndex,
  additionalInstructions,
  setAdditionalInstructions,
}: HeroScrapingProps) {
  return (
    <>
      {showSearchTiles && hasSearched && (
        <section className={`carousel-section relative w-full overflow-hidden mt-32 mb-32 transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white rounded-[50%] transform scale-x-150 -translate-y-24" />

          {isSearching ? (
            <div className="relative h-[250px] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[120px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, white 0%, white 20%, transparent 100%)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-[120px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to left, white 0%, white 20%, transparent 100%)' }} />

              <div className="carousel-container absolute left-0 flex gap-12 py-4">
                {[...Array(10), ...Array(10)].map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="flex-shrink-0 w-[400px] h-[240px] rounded-lg overflow-hidden border-2 border-gray-200/30 bg-white relative"
                  >
                    <div className="absolute inset-0 skeleton-shimmer">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 skeleton-gradient" />
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-40 bg-gray-100 border-b border-gray-200/50 flex items-center px-6 gap-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
                        <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <div className="flex-1 h-8 bg-gray-200 rounded-md mx-6 animate-pulse" />
                    </div>
                    <div className="absolute top-44 left-4 right-4">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                      <div className="h-3 bg-gray-150 rounded w-1/2 mb-2 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="h-3 bg-gray-150 rounded w-2/3 animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="relative h-[250px] overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[120px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, white 0%, white 20%, transparent 100%)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-[120px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to left, white 0%, white 20%, transparent 100%)' }} />

              <div className="carousel-container absolute left-0 flex gap-12 py-4">
                {[...searchResults, ...searchResults].map((result, index) => (
                  <div
                    key={`${result.url}-${index}`}
                    className="group flex-shrink-0 w-[400px] h-[240px] rounded-lg overflow-hidden border-2 border-gray-200/50 transition-all duration-300 hover:shadow-2xl bg-white relative"
                    onMouseLeave={() => {
                      if (showInstructionsForIndex === index) {
                        setShowInstructionsForIndex(null);
                        setAdditionalInstructions('');
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col items-center justify-center p-6">
                      {showInstructionsForIndex === index ? (
                        <div className="w-full max-w-[380px]">
                          <div className="bg-white rounded-20" style={{
                            boxShadow: "0px 0px 44px 0px rgba(0, 0, 0, 0.02), 0px 88px 56px -20px rgba(0, 0, 0, 0.03), 0px 56px 56px -20px rgba(0, 0, 0, 0.02), 0px 32px 32px -20px rgba(0, 0, 0, 0.03), 0px 16px 24px -12px rgba(0, 0, 0, 0.03), 0px 0px 0px 1px rgba(0, 0, 0, 0.05)"
                          }}>
                            <div className="p-16 flex gap-12 items-start w-full relative">
                              <div className="mt-2 flex-shrink-0">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="opacity-40"
                                >
                                  <path d="M5 5H15M5 10H15M5 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </div>
                              <textarea
                                value={additionalInstructions}
                                onChange={(e) => setAdditionalInstructions(e.target.value)}
                                placeholder="Describe your customizations..."
                                className="flex-1 bg-transparent text-body-input text-accent-black placeholder:text-black-alpha-48 focus:outline-none focus:ring-0 focus:border-transparent resize-none min-h-[60px]"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    e.stopPropagation();
                                    setShowInstructionsForIndex(null);
                                    setAdditionalInstructions('');
                                  }
                                }}
                              />
                            </div>
                            <div className="border-t border-black-alpha-5" />
                            <div className="p-10 flex justify-between items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInstructionsForIndex(null);
                                  setAdditionalInstructions('');
                                }}
                                className="button relative rounded-10 px-8 py-8 text-label-medium font-medium flex items-center justify-center bg-black-alpha-4 hover:bg-black-alpha-6 text-black-alpha-48 active:scale-[0.995] transition-all"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M12 5L7 10L12 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (additionalInstructions.trim()) {
                                    sessionStorage.setItem('additionalInstructions', additionalInstructions);
                                    handleSubmit(result);
                                  }
                                }}
                                disabled={!additionalInstructions.trim()}
                                className={`
                                    button relative rounded-10 px-8 py-8 text-label-medium font-medium
                                    flex items-center justify-center gap-6
                                    ${additionalInstructions.trim()
                                    ? 'button-primary text-accent-white active:scale-[0.995]'
                                    : 'bg-black-alpha-4 text-black-alpha-24 cursor-not-allowed'}
                                  `}
                              >
                                {additionalInstructions.trim() && <div className="button-background absolute inset-0 rounded-10 pointer-events-none" />}
                                <span className="px-6 relative">Apply & Clone</span>
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="relative"
                                >
                                  <path d="M11.6667 4.79163L16.875 9.99994M16.875 9.99994L11.6667 15.2083M16.875 9.99994H3.125" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-white text-center mb-3">
                            <p className="text-base font-semibold mb-0.5">{result.title}</p>
                            <p className="text-[11px] opacity-80">Choose how to clone this site</p>
                          </div>
                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubmit(result);
                              }}
                              className="bg-orange-500 hover:bg-orange-600 flex items-center justify-center button relative text-label-medium button-primary group/button rounded-10 p-8 gap-2 text-white active:scale-[0.995]"
                            >
                              <div className="button-background absolute inset-0 rounded-10 pointer-events-none" />
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="relative"
                              >
                                <path d="M11.6667 4.79163L16.875 9.99994M16.875 9.99994L11.6667 15.2083M16.875 9.99994H3.125" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                              </svg>
                              <span className="px-6 relative">Instant Clone</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowInstructionsForIndex(index);
                                setAdditionalInstructions('');
                              }}
                              className="bg-gray-100 hover:bg-gray-200 flex items-center justify-center button relative text-label-medium rounded-10 p-8 gap-2 text-gray-700 active:scale-[0.995]"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="opacity-60"
                              >
                                <path d="M5 5H15M5 10H15M5 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M14 14L16 16L14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="px-6">Add Instructions</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {result.screenshot ? (
                      <img
                        src={result.screenshot}
                        alt={result.title}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-gray-400"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
                              <circle cx="6" cy="6" r="1" fill="currentColor" />
                              <circle cx="9" cy="6" r="1" fill="currentColor" />
                              <circle cx="12" cy="6" r="1" fill="currentColor" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-sm font-medium">{result.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative h-[250px] flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No results found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
              </div>
            </div>
          )}
        </section>
      )}
      <style jsx>{`
        @keyframes infiniteScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .carousel-container {
          animation: infiniteScroll 30s linear infinite;
        }

        .carousel-container:hover {
          animation-play-state: paused;
        }

        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }

        .skeleton-gradient {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}

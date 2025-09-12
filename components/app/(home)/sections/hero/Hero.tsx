"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from '@/config/app.config';
import { toast } from "sonner";

import { Connector } from "@/components/shared/layout/curvy-rect";
import HeroFlame from "@/components/shared/effects/flame/hero-flame";

import HomeHeroBackground from "./Background/Background";
import { BackgroundOuterPiece } from "./Background/BackgroundOuterPiece";
import HomeHeroBadge from "./Badge/Badge";
import HomeHeroPixi from "./Pixi/Pixi";
import HomeHeroTitle from "./Title/Title";
import HeroInput from "../hero-input/HeroInput";
import HeroScraping from "../hero-scraping/HeroScraping";

interface SearchResult {
  url: string;
  title: string;
  description: string;
  screenshot: string | null;
  markdown: string;
}

export default function HomeHero() {
  const [url, setUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("1");
  const [selectedModel, setSelectedModel] = useState<string>(appConfig.ai.defaultModel);
  const [isValidUrl, setIsValidUrl] = useState<boolean>(false);
  const [showSearchTiles, setShowSearchTiles] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [showSelectMessage, setShowSelectMessage] = useState<boolean>(false);
  const [showInstructionsForIndex, setShowInstructionsForIndex] = useState<number | null>(null);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const router = useRouter();

  const validateUrl = (urlString: string) => {
    if (!urlString) return false;
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(urlString.toLowerCase());
  };

  const isURL = (str: string): boolean => {
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    return urlPattern.test(str.trim());
  };

  const handleSubmit = async (selectedResult?: SearchResult) => {
    const inputValue = url.trim();
    
    if (!inputValue) {
      toast.error("Please enter a URL or search term");
      return;
    }
    
    if (selectedResult) {
      setIsFadingOut(true);
      
      setTimeout(() => {
        sessionStorage.setItem('targetUrl', selectedResult.url);
        sessionStorage.setItem('selectedStyle', selectedStyle);
        sessionStorage.setItem('selectedModel', selectedModel);
        sessionStorage.setItem('autoStart', 'true');
        if (selectedResult.markdown) {
          sessionStorage.setItem('siteMarkdown', selectedResult.markdown);
        }
        router.push('/generation');
      }, 500);
      return;
    }
    
    if (isURL(inputValue)) {
      sessionStorage.setItem('targetUrl', inputValue);
      sessionStorage.setItem('selectedStyle', selectedStyle);
      sessionStorage.setItem('selectedModel', selectedModel);
      sessionStorage.setItem('autoStart', 'true');
      router.push('/generation');
    } else {
      if (hasSearched && searchResults.length > 0) {
        setIsFadingOut(true);
        
        setTimeout(async () => {
          setSearchResults([]);
          setIsFadingOut(false);
          setShowSelectMessage(true);
          
          await performSearch(inputValue);
          setHasSearched(true);
          setShowSearchTiles(true);
          setShowSelectMessage(false);
          
          setTimeout(() => {
            const carouselSection = document.querySelector('.carousel-section');
            if (carouselSection) {
              carouselSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }, 500);
      } else {
        setShowSelectMessage(true);
        setIsSearching(true);
        setHasSearched(true);
        setShowSearchTiles(true);
        
        setTimeout(() => {
          const carouselSection = document.querySelector('.carousel-section');
          if (carouselSection) {
            carouselSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        await performSearch(inputValue);
        setShowSelectMessage(false);
        setIsSearching(false);
        
        setTimeout(() => {
          const carouselSection = document.querySelector('.carousel-section');
          if (carouselSection) {
            carouselSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isURL(searchQuery)) {
      setSearchResults([]);
      setShowSearchTiles(false);
      return;
    }

    setIsSearching(true);
    setShowSearchTiles(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowSearchTiles(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchAgain = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setSearchResults([]);
      setHasSearched(false);
      setShowSearchTiles(false);
      setIsFadingOut(false);
      setUrl('');
    }, 500);
  };

  return (
    <section className="overflow-x-clip" id="home-hero">
      <div
        className="pt-28 lg:pt-254 lg:-mt-100 pb-115 relative"
        id="hero-content"
      >
        <HomeHeroPixi />
        <HeroFlame />

        <BackgroundOuterPiece />

        <HomeHeroBackground />

        <div className="relative container px-16">
          <HomeHeroBadge />
          <HomeHeroTitle />

          <p className="text-center text-body-large">
            Power your AI apps with clean data crawled
            <br className="lg-max:hidden" />
            from any website.
            <Link
              className="bg-black-alpha-4 hover:bg-black-alpha-6 lg:ml-4 rounded-6 px-8 lg:px-6 text-label-large lg-max:py-2 h-30 lg:h-24 block lg-max:mt-8 lg-max:mx-auto lg-max:w-max lg:inline-block gap-4 transition-all"
              href="https://github.com/Gerome-Elassaad/CodingIT"
              target="_blank"
            >
              It's also open source.
            </Link>
          </p>
        </div>
      </div>

      <div className="container lg:contents !p-16 relative -mt-90">
        <div className="absolute top-0 left-[calc(50%-50vw)] w-screen h-1 bg-border-faint lg:hidden" />
        <div className="absolute bottom-0 left-[calc(50%-50vw)] w-screen h-1 bg-border-faint lg:hidden" />

        <Connector className="-top-10 -left-[10.5px] lg:hidden" />
        <Connector className="-top-10 -right-[10.5px] lg:hidden" />
        <Connector className="-bottom-10 -left-[10.5px] lg:hidden" />
        <Connector className="-bottom-10 -right-[10.5px] lg:hidden" />

        <HeroInput
          url={url}
          setUrl={setUrl}
          isSearching={isSearching}
          hasSearched={hasSearched}
          searchResults={searchResults}
          isFadingOut={isFadingOut}
          handleSubmit={handleSubmit}
          handleSearchAgain={handleSearchAgain}
          validateUrl={validateUrl}
          isURL={isURL}
          selectedStyle={selectedStyle}
          setSelectedStyle={setSelectedStyle}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
        />
      </div>

      <HeroScraping
        showSearchTiles={showSearchTiles}
        hasSearched={hasSearched}
        isFadingOut={isFadingOut}
        isSearching={isSearching}
        searchResults={searchResults}
        handleSubmit={handleSubmit}
        showInstructionsForIndex={showInstructionsForIndex}
        setShowInstructionsForIndex={setShowInstructionsForIndex}
        additionalInstructions={additionalInstructions}
        setAdditionalInstructions={setAdditionalInstructions}
      />
    </section>
  );
}

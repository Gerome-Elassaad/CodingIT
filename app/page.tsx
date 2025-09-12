"use client";

import { Connector } from "@/components/shared/layout/curvy-rect";
import HomeHero from "@/components/app/(home)/sections/hero/Hero";
import HeaderWrapper from "@/components/shared/header/Wrapper/Wrapper";
import HeaderDropdownWrapper from "@/components/shared/header/Dropdown/Wrapper/Wrapper";

export default function HomePage() {
  return (
    <><div className="min-h-screen bg-background-base">
      {/* Header/Navigation Section */}
      <HeaderDropdownWrapper />

      <div className="sticky top-0 left-0 w-full z-[101] bg-background-base header">
        <div className="absolute top-0 cmw-container border-x border-border-faint h-full pointer-events-none" />
        <div className="h-1 bg-border-faint w-full left-0 -bottom-1 absolute" />
        <div className="cmw-container absolute h-full pointer-events-none top-0">
          <Connector className="absolute -left-[10.5px] -bottom-11" />
          <Connector className="absolute -right-[10.5px] -bottom-11" />
        </div>

        <HeaderWrapper>
          <div className="max-w-[900px] mx-auto w-full flex justify-between items-center">
            <div className="flex gap-8">
              <a
                className="contents"
                href="https://github.com/Gerome-Elassaad/CodingIT"
                target="_blank"
              >
              </a>
            </div>
          </div>
        </HeaderWrapper>
      </div>

      {/* Hero Section */}
      <HomeHero />
      
    </div><style jsx>{`
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

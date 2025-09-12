"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHeaderObserver } from "@/hooks/useHeaderObserver";

interface HeaderContextType {
  dropdownContent: React.ReactNode;
  setDropdownContent: (content: React.ReactNode, element: HTMLElement) => void;
  clearDropdown: (force?: boolean) => void;
  resetDropdownTimeout: () => void;
  dropdownKey: number;
  headerHeight: React.RefObject<number>;
  headerTop: React.RefObject<number>;
  hoveredItemRef: React.RefObject<HTMLElement | null>;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [dropdownContent, setDropdownContent] = useState<React.ReactNode>(null);
  const hoveredItemRef = useRef<HTMLElement | null>(null);
  const [dropdownKey, setDropdownKey] = useState(0);
  const headerHeight = useRef(0);
  const headerTop = useRef(0);
  const timeout = useRef<number | null>(null);
  useHeaderObserver();

  const clearDropdown = (force?: boolean) => {
    if (force) {
      setDropdownContent(null);

      return;
    }

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = window.setTimeout(() => {
      setDropdownContent(null);
    }, 500);
  };

  const resetDropdownTimeout = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  };


  return (
    <HeaderContext.Provider
      value={{
        dropdownContent,
        setDropdownContent: (content, element) => {
          resetDropdownTimeout();
          hoveredItemRef.current = element;

          if (content === dropdownContent) return;
          setDropdownKey((prev) => prev + 1);
          setDropdownContent(content);
        },
        clearDropdown,
        hoveredItemRef,
        resetDropdownTimeout,
        dropdownKey,
        headerHeight,
        headerTop,
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderContext = () => {
  const context = useContext(HeaderContext);

  if (!context) {
    throw new Error("useHeaderContext must be used within a HeaderProvider");
  }

  return context;
};

export const useHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Only run this effect on the client after mounting

    const header = document.querySelector(".header");

    if (header) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setHeaderHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(header);
      setHeaderHeight(header.clientHeight);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return { headerHeight };
};

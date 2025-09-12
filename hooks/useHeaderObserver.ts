"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const useHeaderObserver = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const header = document.querySelector(".header") as HTMLElement;

    if (header) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          (header as any).style.height = `${entry.contentRect.height}px`;
        }
      });

      resizeObserver.observe(header);

      const onScroll = () => {
        (header as any).style.top = `${header.getBoundingClientRect().top}px`;
      };

      window.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("scroll", onScroll);
      };
    }
  }, [pathname]);
};

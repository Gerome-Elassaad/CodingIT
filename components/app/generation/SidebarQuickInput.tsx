"use client";

import { useState } from "react";
import HeroInputSubmitButton from "@/components/app/(home)/sections/hero-input/Button/Button";

interface SidebarQuickInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export default function SidebarQuickInput({ onSubmit, disabled = false }: SidebarQuickInputProps) {
  const [url, setUrl] = useState<string>("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || disabled) return;
    
    onSubmit(url.trim());
    setUrl("");
  };

  return (
    <div className="w-full">
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <div className="p-3 flex items-center gap-3">
          <input
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            placeholder="Enter a new URL to regenerate..."
            type="text"
            value={url}
            disabled={disabled}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div onClick={handleSubmit}>
            <HeroInputSubmitButton dirty={url.length > 0} />
          </div>
        </div>
      </div>
    </div>
  );
}
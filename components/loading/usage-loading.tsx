"use client";

import { useState, useEffect } from "react";

export function UsageLoadingText({ text = "Loading..." }: { text?: string }) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setIsInView(true);
  }, []);

  return (
    <div className="text-xs text-zinc-500">
      {text}
    </div>
  );
}

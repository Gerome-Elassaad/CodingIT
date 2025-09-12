import React, { useEffect, useState } from 'react';

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  isInView?: boolean;
}

export default function ScrambleText({ text, className = '', duration = 1, delay = 0, isInView = true }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    if (isScrambling) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const durationMs = duration * 1000; // Convert seconds to milliseconds
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((char) => (Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : char))
            .join('')
        );
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }, durationMs);

      return () => clearInterval(interval);
    }
  }, [text, isScrambling, duration]);

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        setIsScrambling(true);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [text, delay, isInView]);

  return <span className={className}>{displayText}</span>;
}
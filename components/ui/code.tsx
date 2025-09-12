import React from 'react';

interface CodeProps {
  code: string;
  language?: string;
  className?: string;
}

export default function Code({ code, language = 'json', className = '' }: CodeProps) {
  return (
    <pre className={`overflow-auto ${className}`}>
      <code className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}
import React from 'react';
import {
  FiFile,
  SiJavascript,
  SiReact,
  SiCss3,
  SiJson
} from './icons';

export const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop();
  switch (extension) {
    case 'js':
    case 'jsx':
      return <SiJavascript style={{ width: '16px', height: '16px' }} className="text-yellow-500" />;
    case 'tsx':
      return <SiReact style={{ width: '16px', height: '16px' }} className="text-blue-500" />;
    case 'css':
      return <SiCss3 style={{ width: '16px', height: '16px' }} className="text-blue-400" />;
    case 'json':
      return <SiJson style={{ width: '16px', height: '16px' }} className="text-green-500" />;
    default:
      return <FiFile style={{ width: '16px', height: '16px' }} className="text-gray-500" />;
  }
};

export const startGeneration = async () => {
  console.log('startGeneration called');
  // This function triggers the URL-based website generation process
  // The actual generation logic is handled by the AI chat system
  return new Promise((resolve) => {
    // This is called when user wants to start generation from URL screenshot
    console.log('[startGeneration] Starting URL-based generation process');
    resolve(true);
  });
};

export const reapplyLastGeneration = async (conversationContext: any, applyGeneratedCode: any) => {
  if (conversationContext.lastGeneratedCode) {
    await applyGeneratedCode(conversationContext.lastGeneratedCode, true);
  }
};

export const downloadZip = (sandboxData: any) => {
  if (sandboxData) {
    window.open(`/api/download-zip?sandboxId=${sandboxData.sandboxId}`, '_blank');
  }
};

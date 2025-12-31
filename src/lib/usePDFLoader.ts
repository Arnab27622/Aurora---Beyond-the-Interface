'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLazyResource } from '@/lib/useLazyLoad';
import { logError } from '@/lib/errorHandler';

/**
 * Configuration for PDF.js loading
 */
export const PDF_WORKER_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
export const PDF_LIBRARY_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

/**
 * Hook for lazy loading PDF.js library
 * Loads only when needed (on first PDF upload)
 */
export const usePDFLoader = () => {
  const [isPdfReady, setIsPdfReady] = useState(false);

  const loadPdfJs = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        setIsPdfReady(true);
        resolve();
        return;
      }

      // Load PDF.js from CDN
      const script = document.createElement('script');
      script.src = PDF_LIBRARY_URL;

      script.onload = () => {
        try {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
          setIsPdfReady(true);
          resolve();
        } catch (error) {
          logError(error, 'PDF.js initialization');
          reject(error);
        }
      };

      script.onerror = () => {
        const error = new Error('Failed to load PDF.js library');
        logError(error, 'PDF.js library loading');
        reject(error);
      };

      document.head.appendChild(script);
    });
  }, []);

  return {
    loadPdfJs,
    isPdfReady,
  };
};

/**
 * Extract text from PDF file
 * This heavy operation is done lazily when needed
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library not loaded');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
    let extractedText = '';

    // Limit to first 5 pages to prevent excessive processing
    const pageLimit = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= pageLimit; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const strings = textContent.items.map((item: any) => item.str);
      extractedText += strings.join(' ') + '\n';

      // Stop if text is getting too long
      if (extractedText.length > 5000) break;
    }

    return extractedText;
  } catch (error) {
    logError(error, 'PDF text extraction');
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Hook combining PDF loading and extraction
 */
export const usePDFProcessing = (shouldLoad: boolean = false) => {
  const { loadPdfJs, isPdfReady } = usePDFLoader();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processPDF = useCallback(
    async (file: File): Promise<string | null> => {
      if (!shouldLoad || !file.type.includes('pdf')) {
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Load PDF.js if not already loaded
        if (!isPdfReady) {
          await loadPdfJs();
        }

        // Extract text
        const text = await extractTextFromPDF(file);
        return text.substring(0, 50000); // Limit to 50k characters
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logError(error, 'PDF processing');
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [shouldLoad, isPdfReady, loadPdfJs]
  );

  return {
    processPDF,
    isProcessing,
    error,
    isPdfReady,
  };
};

/**
 * File Text Extraction Hook
 * 
 * Extracts text content from various file formats:
 * - TXT: Plain text files
 * - DOCX: Word documents (via mammoth)
 * - XLSX: Excel spreadsheets (via xlsx)
 * - CSV: Comma-separated values
 * - PPTX: PowerPoint presentations (via pptx-parser)
 * 
 * Features:
 * - Lazy library loading (libraries loaded on demand)
 * - 50k character limit per file
 * - Error handling with user-friendly messages
 * - useFileLoader hook for state management
 */

'use client';

import { useCallback, useState } from 'react';
import { logError } from '@/lib/errorHandler';

// Type declarations for libraries without TypeScript support are handled inline

/**
 * Supported file types for text extraction
 */
export type SupportedFileType = 'txt' | 'docx' | 'xlsx' | 'csv' | 'pptx';

/**
 * Extract text from text-based files
 * Now supports all file types with appropriate libraries
 */
export const extractTextFromFile = async (
    file: File,
    fileType: SupportedFileType
): Promise<string> => {
    try {
        switch (fileType) {
            case 'txt':
                return await extractTextFromTxt(file);

            case 'docx':
                return await extractTextFromDocx(file);

            case 'xlsx':
                return await extractTextFromXlsx(file);

            case 'csv':
                return await extractTextFromCsv(file);

            case 'pptx':
                return await extractTextFromPptx(file);

            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
    } catch (error) {
        logError(error, `File text extraction for ${fileType}`);
        throw error;
    }
};

/**
 * Extract text from plain text files
 */
const extractTextFromTxt = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            resolve(text.substring(0, 50000)); // Limit to 50k characters
        };
        reader.onerror = () => reject(new Error('Failed to read text file'));
        reader.readAsText(file);
    });
};

/**
 * Extract text from CSV files (basic implementation)
 */
const extractTextFromCsv = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            // Basic CSV parsing - just return first few lines
            const lines = text.split('\n').slice(0, 50); // First 50 lines
            resolve(lines.join('\n').substring(0, 10000));
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
    });
};

/**
 * Extract text from DOCX files using mammoth
 */
const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value.substring(0, 50000); // Limit to 50k characters
    } catch (error) {
        throw new Error('Failed to extract text from DOCX file. Please ensure the file is not corrupted.');
    }
};

/**
 * Extract text from XLSX files using xlsx
 */
const extractTextFromXlsx = async (file: File): Promise<string> => {
    try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        let extractedText = '';

        // Extract text from all worksheets
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetText = XLSX.utils.sheet_to_csv(worksheet);
            if (sheetText) {
                extractedText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
            }
        });

        return extractedText.substring(0, 50000); // Limit to 50k characters
    } catch (error) {
        throw new Error('Failed to extract text from Excel file. Please ensure the file is not corrupted.');
    }
};

/**
 * Extract text from PPTX files using pptx-parser
 */
const extractTextFromPptx = async (file: File): Promise<string> => {
    try {
        // @ts-ignore
        const pptxParser = await import('pptx-parser');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await (pptxParser as any).default(buffer);

        // Extract text from slides
        let extractedText = '';
        if (result && result.slides) {
            result.slides.forEach((slide: any, index: number) => {
                extractedText += `Slide ${index + 1}:\n`;
                if (slide.text) {
                    extractedText += slide.text.join(' ') + '\n\n';
                }
            });
        }

        return extractedText.substring(0, 50000); // Limit to 50k characters
    } catch (error) {
        // Fallback: return basic message if extraction fails
        return `PowerPoint file "${file.name}" uploaded. Text extraction not available for this file type.`;
    }
};

/**
 * Hook for processing text-based files
 */
export const useFileLoader = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const processFile = useCallback(
        async (file: File, fileType: SupportedFileType): Promise<string | null> => {
            setIsProcessing(true);
            setError(null);

            try {
                const text = await extractTextFromFile(file, fileType);
                return text;
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                logError(error, `File processing for ${fileType}`);
                return null;
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    return {
        processFile,
        isProcessing,
        error,
    };
};

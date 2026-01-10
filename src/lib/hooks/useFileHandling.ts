import { useRef } from "react";
import { FileContextType } from "@/lib/types";
import { useFileLoader, SupportedFileType } from "@/lib/useFileLoader";
import { usePDFProcessing } from "@/lib/usePDFLoader";
import { logError } from "@/lib/errorHandler";

export const useFileHandling = (
  setFileContext: (context: FileContextType) => void,
  setIsFileLoading: (loading: boolean) => void
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { processPDF } = usePDFProcessing(true);
  const { processFile } = useFileLoader();

  const getFileType = (file: File): SupportedFileType | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'txt':
        return 'txt';
      case 'docx':
        return 'docx';
      case 'xlsx':
        return 'xlsx';
      case 'csv':
        return 'csv';
      case 'pptx':
        return 'pptx';
      default:
        if (file.type === 'application/pdf') {
          return null;
        }
        return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileLoading(true);

    try {
      let fileType: SupportedFileType | "pdf" = "txt";
      let fileData: string = "";
      let binaryData: string = "";

      // Read file as base64 for binaryData
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      await new Promise<void>((resolve, reject) => {
        base64Reader.onload = () => {
          const base64 = base64Reader.result as string;
          binaryData = base64.split(",")[1];
          resolve();
        };
        base64Reader.onerror = () => reject(new Error('Failed to read file as base64'));
      });

      if (file.type === "application/pdf") {
        fileType = "pdf";
        const extractedText = await processPDF(file);
        if (extractedText) {
          fileData = extractedText;
        } else {
          fileData = `[Failed to extract text from PDF file: ${file.name}]`;
        }
      } else {
        const detectedType = getFileType(file);
        if (detectedType) {
          fileType = detectedType;
          const extractedText = await processFile(file, detectedType);
          if (extractedText) {
            fileData = extractedText;
          } else {
            fileData = `[Failed to extract text from ${fileType.toUpperCase()} file: ${file.name}]`;
          }
        } else {
          const reader = new FileReader();
          reader.readAsText(file);

          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              fileData = reader.result as string;
              resolve();
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
          });
        }
      }

      setFileContext({
        type: fileType,
        data: fileData,
        binaryData,
        filename: file.name
      });

      setIsFileLoading(false);
    } catch (error) {
      logError(error, 'File upload');
      const detectedType = getFileType(file) || "txt";
      setFileContext({
        type: detectedType,
        data: `[Failed to process file: ${file.name}]`,
        filename: file.name
      });
      setIsFileLoading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setIsFileLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1];
        setFileContext({
          type: "image",
          data: base64Data,
          binaryData: base64Data,
          filename: file.name
        });
        setIsFileLoading(false);
      };

      reader.onerror = (error) => {
        logError(error, 'Image read');
        setIsFileLoading(false);
      };
    } catch (error) {
      logError(error, 'Image upload');
      setIsFileLoading(false);
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const clearFileContext = () => {
    setFileContext(null);
  };

  return {
    fileInputRef,
    imageInputRef,
    handleFileUpload,
    handleImageUpload,
    clearFileContext,
  };
};

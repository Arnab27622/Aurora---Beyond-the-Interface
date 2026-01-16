/**
 * HiddenFileInputs Component
 * 
 * Renders hidden file input elements for document and image uploads.
 * Accepts specific file types:
 * - Documents: PDF, TXT, DOCX, XLSX, CSV, PPTX
 * - Images: All image formats
 * Controlled by refs from parent component.
 */

import React from "react";

interface HiddenFileInputsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isFileLoading: boolean;
  loading: boolean;
}

export const HiddenFileInputs = ({
  fileInputRef,
  imageInputRef,
  handleFileUpload,
  handleImageUpload,
  isFileLoading,
  loading,
}: HiddenFileInputsProps) => {
  return (
    <>
      <input
        type="file"
        accept=".pdf,.txt,.docx,.xlsx,.csv,.pptx"
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleFileUpload}
        className="hidden"
        disabled={isFileLoading || loading}
        aria-label="Upload document file"
      />
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleImageUpload}
        className="hidden"
        disabled={isFileLoading || loading}
        aria-label="Upload image file"
      />
    </>
  );
};

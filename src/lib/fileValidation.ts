/**
 * File type validation utilities with MIME type and magic bytes verification
 */

/**
 * Magic bytes (file signatures) for different file types
 * Used to verify actual file content regardless of extension
 */
const MAGIC_BYTES: Record<string, Buffer[]> = {
  pdf: [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  image: [
    Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG
    Buffer.from([0x89, 0x50, 0x4E, 0x47]), // PNG
    Buffer.from([0x47, 0x49, 0x46]), // GIF
    Buffer.from([0x42, 0x4D]), // BMP
  ],
  docx: [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (DOCX is a ZIP archive)
  ],
  xlsx: [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (XLSX is a ZIP archive)
  ],
  pptx: [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (PPTX is a ZIP archive)
  ],
  csv: [], // CSV has no specific magic bytes - plain text
  txt: [], // TXT has no specific magic bytes - plain text
};

/**
 * MIME types mapping for file extensions
 */
const MIME_TYPES: Record<string, string[]> = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv', 'text/plain'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt: ['text/plain'],
};

/**
 * Validate file by checking magic bytes (file signature)
 * This confirms the actual file type regardless of extension
 */
export function validateFileMagicBytes(
  data: Buffer,
  fileType: string
): { valid: boolean; error?: string } {
  if (!MAGIC_BYTES[fileType] || MAGIC_BYTES[fileType].length === 0) {
    // No magic bytes defined for this type (e.g., plain text files)
    // For plain text files, we'll accept as long as it's valid data
    if (['txt', 'csv'].includes(fileType)) {
      return { valid: true };
    }
    return { valid: true }; // Unknown type, let validation pass
  }

  const expectedSignatures = MAGIC_BYTES[fileType];
  const hasMagicBytes = expectedSignatures.some((signature) =>
    data.slice(0, signature.length).equals(signature)
  );

  if (!hasMagicBytes) {
    return {
      valid: false,
      error: `File signature does not match ${fileType} file type. File may be corrupted or misidentified.`,
    };
  }

  return { valid: true };
}

/**
 * Validate MIME type for file
 */
export function validateMimeType(
  mimeType: string,
  fileType: string
): { valid: boolean; error?: string } {
  const allowedMimes = MIME_TYPES[fileType];

  if (!allowedMimes || allowedMimes.length === 0) {
    return { valid: true }; // No MIME type restrictions
  }

  if (!mimeType || !allowedMimes.some((mime) => mimeType.toLowerCase().startsWith(mime))) {
    return {
      valid: false,
      error: `Invalid MIME type "${mimeType}" for ${fileType} file. Expected: ${allowedMimes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file extension matches expected type
 */
export function validateFileExtension(
  filename: string,
  expectedType: string
): { valid: boolean; error?: string } {
  if (!filename) {
    return { valid: false, error: 'Filename is required' };
  }

  const ext = filename.toLowerCase().split('.').pop();

  if (!ext) {
    return { valid: false, error: 'File must have an extension' };
  }

  // Map extensions to file types
  const extensionMap: Record<string, string> = {
    pdf: 'pdf',
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    doc: 'docx',
    docx: 'docx',
    xls: 'xlsx',
    xlsx: 'xlsx',
    ppt: 'pptx',
    pptx: 'pptx',
    csv: 'csv',
    txt: 'txt',
  };

  const detectedType = extensionMap[ext];

  if (!detectedType) {
    return { valid: false, error: `Unsupported file extension: .${ext}` };
  }

  if (detectedType !== expectedType) {
    return {
      valid: false,
      error: `File extension .${ext} does not match expected type ${expectedType}`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive file validation
 * Checks extension, MIME type, and magic bytes
 */
export function validateFileComprehensive(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  fileType: string
): { valid: boolean; error?: string } {
  // 1. Validate extension
  const extValidation = validateFileExtension(filename, fileType);
  if (!extValidation.valid) {
    return extValidation;
  }

  // 2. Validate MIME type
  const mimeValidation = validateMimeType(mimeType, fileType);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  // 3. Validate magic bytes
  const magicValidation = validateFileMagicBytes(fileBuffer, fileType);
  if (!magicValidation.valid) {
    return magicValidation;
  }

  return { valid: true };
}

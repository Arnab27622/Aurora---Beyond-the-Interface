import { FileContextType } from "@/lib/types";

export const getMimeType = (fileType: string): string => {
    const mimeTypeMap: Record<string, string> = {
        pdf: "application/pdf",
        txt: "text/plain",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        csv: "text/csv",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    return mimeTypeMap[fileType] || "application/octet-stream";
};

export const downloadFile = (file: FileContextType | null): void => {
    if (!file) return;

    if (file.type === "image") {
        downloadImageFile(file);
    } else {
        downloadBinaryFile(file);
    }
};

const downloadImageFile = (file: Exclude<FileContextType, null>): void => {
    const link = document.createElement("a");
    link.href = `data:image/*;base64,${file.data}`;
    link.download = file.filename;
    link.click();
};

const downloadBinaryFile = (file: Exclude<FileContextType, null>): void => {
    try {
        const binaryString = atob(file.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const mimeType = getMimeType(file.type);
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.filename;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download file:", error);
        // Fallback: create text file with error message
        const blob = new Blob([`Failed to download ${file.filename}: ${error}`], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};

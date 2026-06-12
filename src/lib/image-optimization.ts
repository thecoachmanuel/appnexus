/**
 * Client-side image optimization utilities
 * Uses Canvas API for resizing and compression
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: "jpeg" | "png" | "webp";
  maintainAspectRatio?: boolean;
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: OptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 80,
  format: "webp",
  maintainAspectRatio: true,
};

/**
 * Load an image from a File object
 */
export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  let width = originalWidth;
  let height = originalHeight;

  // Only resize if the image is larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);
    
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  return { width, height };
};

/**
 * Get MIME type from format
 */
const getMimeType = (format: string): string => {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/webp";
  }
};

/**
 * Get file extension from format
 */
const getExtension = (format: string): string => {
  switch (format) {
    case "jpeg":
      return ".jpg";
    case "png":
      return ".png";
    case "webp":
      return ".webp";
    default:
      return ".webp";
  }
};

/**
 * Optimize an image file
 */
export const optimizeImage = async (
  file: File,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Only process images
  if (!file.type.startsWith("image/")) {
    throw new Error("File is not an image");
  }

  const img = await loadImage(file);
  const originalWidth = img.width;
  const originalHeight = img.height;

  const { width, height } = calculateDimensions(
    originalWidth,
    originalHeight,
    opts.maxWidth!,
    opts.maxHeight!,
    opts.maintainAspectRatio
  );

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the image
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  // Convert to blob
  const mimeType = getMimeType(opts.format!);
  const quality = opts.quality! / 100;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      mimeType,
      quality
    );
  });

  // Create new file with optimized content
  const extension = getExtension(opts.format!);
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const optimizedFile = new File([blob], `${baseName}${extension}`, {
    type: mimeType,
  });

  return {
    file: optimizedFile,
    originalSize: file.size,
    optimizedSize: optimizedFile.size,
    width,
    height,
    compressionRatio: Math.round((1 - optimizedFile.size / file.size) * 100),
  };
};

/**
 * Create a preview of an optimized image
 */
export const createPreview = async (
  file: File,
  options: OptimizationOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; estimatedSize: number }> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const img = await loadImage(file);
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    opts.maxWidth!,
    opts.maxHeight!,
    opts.maintainAspectRatio
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  const mimeType = getMimeType(opts.format!);
  const quality = opts.quality! / 100;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  // Estimate file size from base64 length
  const base64Length = dataUrl.split(",")[1]?.length || 0;
  const estimatedSize = Math.round((base64Length * 3) / 4);

  return { dataUrl, width, height, estimatedSize };
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Preset optimization options
 */
export const OPTIMIZATION_PRESETS = {
  original: {
    label: "Original",
    description: "No optimization",
    options: { maxWidth: 10000, maxHeight: 10000, quality: 100 },
  },
  high: {
    label: "High Quality",
    description: "Minimal compression, best for photos",
    options: { maxWidth: 2560, maxHeight: 2560, quality: 90, format: "webp" as const },
  },
  balanced: {
    label: "Balanced",
    description: "Good quality with smaller file size",
    options: { maxWidth: 1920, maxHeight: 1920, quality: 80, format: "webp" as const },
  },
  web: {
    label: "Web Optimized",
    description: "Smaller files, faster loading",
    options: { maxWidth: 1280, maxHeight: 1280, quality: 70, format: "webp" as const },
  },
  thumbnail: {
    label: "Thumbnail",
    description: "Small preview images",
    options: { maxWidth: 400, maxHeight: 400, quality: 60, format: "webp" as const },
  },
};

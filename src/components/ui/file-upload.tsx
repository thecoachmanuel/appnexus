"use client";

/**
 * FileUpload Component
 * 
 * A reusable drag-and-drop file upload component with preview support,
 * multi-file uploads, and progress indicators.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useStorage, StorageBucket } from '@/hooks/useStorage';
import { ImageOptimizationDialog } from '@/components/ImageOptimizationDialog';
import { optimizeImage, OptimizationOptions } from '@/lib/image-optimization';

interface UploadedFile {
  file: File;
  url?: string;
  path?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  previewUrl?: string;
}

interface FileUploadProps {
  bucket: StorageBucket;
  onUploadComplete?: (url: string, path: string) => void;
  onMultiUploadComplete?: (files: Array<{ url: string; path: string }>) => void;
  onRemove?: (path: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  placeholder?: string;
  previewUrl?: string;
  showPreview?: boolean;
  disabled?: boolean;
  /** Enable image optimization dialog for image uploads */
  enableOptimization?: boolean;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Maximum number of files (for multi-upload) */
  maxFiles?: number;
}

export function FileUpload({
  bucket,
  onUploadComplete,
  onMultiUploadComplete,
  onRemove,
  accept = 'image/*',
  maxSizeMB,
  className,
  placeholder = 'Drop files here or click to upload',
  previewUrl,
  showPreview = true,
  disabled = false,
  enableOptimization = false,
  multiple = false,
  maxFiles = 10,
}: FileUploadProps) {
  const { upload, remove, isUploading } = useStorage();
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    // Show local preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    const result = await upload(file, { 
      bucket, 
      maxSizeMB,
      allowedTypes: accept.split(',').map(t => t.trim()),
    });

    if (result.error) {
      setPreview(previewUrl || null);
      return;
    }

    setUploadedPath(result.path);
    onUploadComplete?.(result.url, result.path);
  }, [bucket, upload, maxSizeMB, accept, showPreview, previewUrl, onUploadComplete]);

  const uploadMultipleFiles = useCallback(async (files: File[]) => {
    const limited = files.slice(0, maxFiles);
    const newFiles: UploadedFile[] = limited.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    
    setMultiFiles(prev => [...prev, ...newFiles]);
    
    const results: Array<{ url: string; path: string }> = [];
    
    for (let i = 0; i < newFiles.length; i++) {
      const fileEntry = newFiles[i];
      setMultiFiles(prev => prev.map(f => 
        f.file === fileEntry.file ? { ...f, status: 'uploading', progress: 30 } : f
      ));

      const result = await upload(fileEntry.file, {
        bucket,
        maxSizeMB,
        allowedTypes: accept.split(',').map(t => t.trim()),
      });

      if (result.error) {
        setMultiFiles(prev => prev.map(f => 
          f.file === fileEntry.file ? { ...f, status: 'error', progress: 0, error: 'Upload failed' } : f
        ));
      } else {
        setMultiFiles(prev => prev.map(f => 
          f.file === fileEntry.file ? { ...f, status: 'success', progress: 100, url: result.url, path: result.path } : f
        ));
        results.push({ url: result.url, path: result.path });
        onUploadComplete?.(result.url, result.path);
      }
    }

    if (results.length > 0) {
      onMultiUploadComplete?.(results);
    }
  }, [bucket, upload, maxSizeMB, accept, maxFiles, onUploadComplete, onMultiUploadComplete]);

  const handleFile = useCallback(async (file: File) => {
    if (disabled || isUploading || isOptimizing) return;

    // Check if optimization should be shown for images
    const isImage = file.type.startsWith('image/');
    if (enableOptimization && isImage && !multiple) {
      setPendingFile(file);
      setShowOptimizationDialog(true);
      return;
    }

    await uploadFile(file);
  }, [disabled, isUploading, isOptimizing, enableOptimization, multiple, uploadFile]);

  const handleFiles = useCallback(async (fileList: FileList) => {
    if (disabled || isOptimizing) return;
    
    if (multiple) {
      await uploadMultipleFiles(Array.from(fileList));
    } else {
      const file = fileList[0];
      if (file) await handleFile(file);
    }
  }, [disabled, isOptimizing, multiple, uploadMultipleFiles, handleFile]);

  const handleOptimizationConfirm = useCallback(async (
    files: File[],
    options: OptimizationOptions | null
  ) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setIsOptimizing(true);
    
    try {
      let fileToUpload = file;
      
      if (options && file.type.startsWith('image/')) {
        const optimized = await optimizeImage(file, options);
        fileToUpload = optimized.file;
      }
      
      await uploadFile(fileToUpload);
    } finally {
      setIsOptimizing(false);
      setPendingFile(null);
    }
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const isProcessing = isUploading || isOptimizing;

  const handleRemove = useCallback(async () => {
    if (uploadedPath) {
      await remove(bucket, uploadedPath);
      onRemove?.(uploadedPath);
    }
    setPreview(null);
    setUploadedPath(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [bucket, uploadedPath, remove, onRemove]);

  const removeMultiFile = useCallback(async (fileEntry: UploadedFile) => {
    if (fileEntry.path) {
      await remove(bucket, fileEntry.path);
      onRemove?.(fileEntry.path);
    }
    if (fileEntry.previewUrl) {
      URL.revokeObjectURL(fileEntry.previewUrl);
    }
    setMultiFiles(prev => prev.filter(f => f !== fileEntry));
  }, [bucket, remove, onRemove]);

  const isImage = preview?.startsWith('data:image') || preview?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Upload Area */}
        <div
          onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
            'hover:border-primary/50 hover:bg-primary/5',
            isDragging && 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/10',
            disabled && 'opacity-50 cursor-not-allowed',
            isProcessing && 'pointer-events-none',
            preview && showPreview && !multiple ? 'border-solid border-border' : 'border-border/50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isProcessing}
            multiple={multiple}
          />

          {isProcessing && !multiple ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isOptimizing ? 'Optimizing...' : 'Uploading...'}
              </p>
            </div>
          ) : preview && showPreview && !multiple ? (
            <div className="relative">
              {isImage ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
              ) : (
                <div className="flex items-center justify-center gap-2 py-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">File uploaded</span>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted"
              )}>
                {accept.includes('image') ? (
                  <Image className={cn("w-6 h-6", isDragging ? "text-primary" : "text-muted-foreground")} />
                ) : (
                  <Upload className={cn("w-6 h-6", isDragging ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? 'Drop to upload' : placeholder}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {multiple ? `Up to ${maxFiles} files • ` : ''}Max {maxSizeMB || 10}MB{multiple ? ' each' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Multi-file progress list */}
        {multiple && multiFiles.length > 0 && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {multiFiles.map((fileEntry, index) => (
              <div
                key={`${fileEntry.file.name}-${index}`}
                className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card"
              >
                {fileEntry.previewUrl ? (
                  <img src={fileEntry.previewUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{fileEntry.file.name}</p>
                  {fileEntry.status === 'uploading' && (
                    <Progress value={fileEntry.progress} className="h-1 mt-1" />
                  )}
                  {fileEntry.status === 'error' && (
                    <p className="text-xs text-destructive mt-0.5">{fileEntry.error}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {fileEntry.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                  {fileEntry.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {fileEntry.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  {(fileEntry.status === 'success' || fileEntry.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      onClick={() => removeMultiFile(fileEntry)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimization Dialog */}
      {enableOptimization && (
        <ImageOptimizationDialog
          open={showOptimizationDialog}
          onOpenChange={setShowOptimizationDialog}
          files={pendingFile ? [pendingFile] : []}
          onConfirm={handleOptimizationConfirm}
        />
      )}
    </>
  );
}

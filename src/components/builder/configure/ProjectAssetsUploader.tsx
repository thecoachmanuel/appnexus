"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, FileImage, FileText, File, Trash2 } from "lucide-react";
import type { AppConfig, ProjectAsset } from "@/stores/useAppStore";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageOptimizationDialog } from "@/components/ImageOptimizationDialog";
import { optimizeImage, OptimizationOptions } from "@/lib/image-optimization";

interface ProjectAssetsUploaderProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return FileImage;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
};

const ProjectAssetsUploader = ({ config, onUpdate }: ProjectAssetsUploaderProps) => {
  const { upload, remove, isUploading } = useStorage();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const assets = config.projectAssets || [];

  const uploadFiles = useCallback(async (
    files: File[],
    optimizationOptions: OptimizationOptions | null
  ) => {
    for (const file of files) {
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }

      setUploadingFiles(prev => [...prev, file.name]);

      try {
        let fileToUpload = file;
        
        // Optimize images if options provided
        if (optimizationOptions && file.type.startsWith("image/")) {
          setIsOptimizing(true);
          const optimized = await optimizeImage(file, optimizationOptions);
          fileToUpload = optimized.file;
          setIsOptimizing(false);
        }

        const result = await upload(fileToUpload, {
          bucket: "project-assets",
          maxSizeMB: 20,
        });

        if (result.error) {
          setUploadingFiles(prev => prev.filter(f => f !== file.name));
          continue;
        }

        const newAsset: ProjectAsset = {
          id: crypto.randomUUID(),
          name: file.name,
          url: result.url,
          path: result.path,
          type: fileToUpload.type,
          size: fileToUpload.size,
        };

        onUpdate({
          projectAssets: [...assets, newAsset],
        });
      } finally {
        setUploadingFiles(prev => prev.filter(f => f !== file.name));
      }
    }
  }, [upload, onUpdate, assets]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check if any files are images
    const hasImages = fileArray.some(f => f.type.startsWith("image/"));
    
    if (hasImages) {
      setPendingFiles(fileArray);
      setShowOptimizationDialog(true);
    } else {
      await uploadFiles(fileArray, null);
    }
  }, [uploadFiles]);

  const handleOptimizationConfirm = useCallback(async (
    files: File[],
    options: OptimizationOptions | null
  ) => {
    await uploadFiles(files, options);
    setPendingFiles([]);
  }, [uploadFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAsset = async (asset: ProjectAsset) => {
    await remove("project-assets", asset.path);
    onUpdate({
      projectAssets: assets.filter(a => a.id !== asset.id),
    });
    toast.success(`Removed ${asset.name}`);
  };

  const isCurrentlyUploading = isUploading || uploadingFiles.length > 0 || isOptimizing;

  return (
    <>
      <div className="space-y-4">
        {/* Upload Zone */}
        <div className="relative">
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.json,.svg"
            onChange={handleFileChange}
            className="hidden"
            id="project-assets-upload"
            multiple
            disabled={isCurrentlyUploading}
          />
          <label
            htmlFor="project-assets-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "w-full p-6 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center gap-3",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30",
              isCurrentlyUploading && "opacity-50 pointer-events-none"
            )}
          >
            {isCurrentlyUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {isOptimizing ? "Optimizing..." : "Uploading..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadingFiles.join(", ")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Upload Project Assets
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drag & drop or click to upload images, documents, and more (max 20MB each)
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

      {/* Assets List */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Uploaded Assets ({assets.length})
            </p>
            {assets.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={async () => {
                  for (const asset of assets) {
                    await remove("project-assets", asset.path);
                  }
                  onUpdate({ projectAssets: [] });
                  toast.success("All assets removed");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {assets.map((asset) => {
              const FileIcon = getFileIcon(asset.type);
              const isImage = asset.type.startsWith("image/");
              
              return (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 group"
                >
                  {/* Preview */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {isImage ? (
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {asset.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(asset.size)}
                    </p>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveAsset(asset)}
                    className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Empty State */}
        {assets.length === 0 && !isCurrentlyUploading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No assets uploaded yet. Upload images, icons, or documents for your app.
          </p>
        )}
      </div>

      {/* Image Optimization Dialog */}
      <ImageOptimizationDialog
        open={showOptimizationDialog}
        onOpenChange={setShowOptimizationDialog}
        files={pendingFiles}
        onConfirm={handleOptimizationConfirm}
      />
    </>
  );
};

export default ProjectAssetsUploader;

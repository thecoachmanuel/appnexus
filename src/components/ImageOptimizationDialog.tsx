"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Image as ImageIcon, Maximize2, FileDown, Sparkles } from "lucide-react";
import {
  OptimizationOptions,
  createPreview,
  formatBytes,
  OPTIMIZATION_PRESETS,
  loadImage,
} from "@/lib/image-optimization";
import { cn } from "@/lib/utils";

interface ImageOptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  onConfirm: (files: File[], options: OptimizationOptions | null) => void;
}

type PresetKey = keyof typeof OPTIMIZATION_PRESETS;

export function ImageOptimizationDialog({
  open,
  onOpenChange,
  files,
  onConfirm,
}: ImageOptimizationDialogProps) {
  const [preset, setPreset] = useState<PresetKey>("balanced");
  const [customMode, setCustomMode] = useState(false);
  const [options, setOptions] = useState<OptimizationOptions>(
    OPTIMIZATION_PRESETS.balanced.options
  );
  const [preview, setPreview] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    estimatedSize: number;
  } | null>(null);
  const [originalInfo, setOriginalInfo] = useState<{
    width: number;
    height: number;
    size: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [skipOptimization, setSkipOptimization] = useState(false);

  const firstImageFile = files.find((f) => f.type.startsWith("image/"));
  const imageCount = files.filter((f) => f.type.startsWith("image/")).length;
  const nonImageCount = files.length - imageCount;

  // Load original image info
  useEffect(() => {
    if (!firstImageFile || !open) return;

    const loadOriginal = async () => {
      try {
        const img = await loadImage(firstImageFile);
        setOriginalInfo({
          width: img.width,
          height: img.height,
          size: firstImageFile.size,
        });
        URL.revokeObjectURL(img.src);
      } catch (error) {
        console.error("Error loading image:", error);
      }
    };

    loadOriginal();
  }, [firstImageFile, open]);

  // Generate preview when options change
  const updatePreview = useCallback(async () => {
    if (!firstImageFile || skipOptimization) {
      setPreview(null);
      return;
    }

    setLoading(true);
    try {
      const previewResult = await createPreview(firstImageFile, options);
      setPreview(previewResult);
    } catch (error) {
      console.error("Error creating preview:", error);
    } finally {
      setLoading(false);
    }
  }, [firstImageFile, options, skipOptimization]);

  useEffect(() => {
    if (open && firstImageFile) {
      updatePreview();
    }
  }, [open, updatePreview, firstImageFile]);

  const handlePresetChange = (newPreset: PresetKey) => {
    setPreset(newPreset);
    setOptions(OPTIMIZATION_PRESETS[newPreset].options);
    setCustomMode(false);
  };

  const handleOptionChange = (key: keyof OptimizationOptions, value: number | string | boolean) => {
    setCustomMode(true);
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(files, skipOptimization ? null : options);
    onOpenChange(false);
  };

  const savings = preview && originalInfo
    ? Math.round((1 - preview.estimatedSize / originalInfo.size) * 100)
    : 0;

  if (!firstImageFile && imageCount === 0) {
    // No images to optimize, just confirm
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {files.length} file(s) ready to upload. No images to optimize.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => { onConfirm(files, null); onOpenChange(false); }}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Optimize Images
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {imageCount} image{imageCount > 1 ? "s" : ""} selected
                {nonImageCount > 0 && ` + ${nonImageCount} other file(s)`}
              </p>
              {originalInfo && (
                <p className="text-xs text-muted-foreground">
                  Original: {originalInfo.width} × {originalInfo.height} • {formatBytes(originalInfo.size)}
                </p>
              )}
            </div>
          </div>

          {/* Skip optimization toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium">Upload without optimization</p>
              <p className="text-xs text-muted-foreground">Keep original file size and quality</p>
            </div>
            <Switch
              checked={skipOptimization}
              onCheckedChange={setSkipOptimization}
            />
          </div>

          {!skipOptimization && (
            <>
              {/* Preset Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Optimization Preset</Label>
                <RadioGroup
                  value={customMode ? "" : preset}
                  onValueChange={(v) => handlePresetChange(v as PresetKey)}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                >
                  {(Object.entries(OPTIMIZATION_PRESETS) as [PresetKey, typeof OPTIMIZATION_PRESETS.balanced][]).map(
                    ([key, { label, description }]) => (
                      <div key={key}>
                        <RadioGroupItem value={key} id={key} className="peer sr-only" />
                        <Label
                          htmlFor={key}
                          className={cn(
                            "flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all",
                            "hover:border-primary/50 hover:bg-secondary/50",
                            preset === key && !customMode
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
              </div>

              {/* Custom Options */}
              <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Fine-tune Settings</Label>
                  {customMode && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                      Custom
                    </span>
                  )}
                </div>

                {/* Max Width */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Max Width</Label>
                    <span className="text-xs font-mono">{options.maxWidth}px</span>
                  </div>
                  <Slider
                    value={[options.maxWidth || 1920]}
                    min={200}
                    max={4000}
                    step={100}
                    onValueChange={([v]) => handleOptionChange("maxWidth", v)}
                  />
                </div>

                {/* Max Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Max Height</Label>
                    <span className="text-xs font-mono">{options.maxHeight}px</span>
                  </div>
                  <Slider
                    value={[options.maxHeight || 1920]}
                    min={200}
                    max={4000}
                    step={100}
                    onValueChange={([v]) => handleOptionChange("maxHeight", v)}
                  />
                </div>

                {/* Quality */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Quality</Label>
                    <span className="text-xs font-mono">{options.quality}%</span>
                  </div>
                  <Slider
                    value={[options.quality || 80]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([v]) => handleOptionChange("quality", v)}
                  />
                </div>

                {/* Format */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Format</Label>
                  <Select
                    value={options.format || "webp"}
                    onValueChange={(v) => handleOptionChange("format", v)}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              {firstImageFile && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Original</p>
                      <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(firstImageFile)}
                          alt="Original"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {originalInfo && (
                        <div className="text-center">
                          <p className="text-xs font-medium">{formatBytes(originalInfo.size)}</p>
                          <p className="text-xs text-muted-foreground">
                            {originalInfo.width} × {originalInfo.height}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Optimized */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Optimized</p>
                      <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : preview ? (
                          <img
                            src={preview.dataUrl}
                            alt="Optimized"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">No preview</p>
                        )}
                      </div>
                      {preview && (
                        <div className="text-center">
                          <p className="text-xs font-medium">
                            ~{formatBytes(preview.estimatedSize)}
                            {savings > 0 && (
                              <span className="text-accent ml-1">(-{savings}%)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {preview.width} × {preview.height}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : skipOptimization ? (
              <FileDown className="w-4 h-4 mr-2" />
            ) : (
              <Maximize2 className="w-4 h-4 mr-2" />
            )}
            {skipOptimization ? "Upload Original" : `Optimize & Upload`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

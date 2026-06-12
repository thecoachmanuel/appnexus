"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeviceRotationIndicatorProps {
  isRotated: boolean;
  onRotate: () => void;
  disabled?: boolean;
}

const DeviceRotationIndicator = ({
  isRotated,
  onRotate,
  disabled = false,
}: DeviceRotationIndicatorProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onRotate}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="gap-2 relative overflow-hidden group"
        >
          <RotateCcw
            className={`w-4 h-4 transition-transform duration-500 ${
              isRotated ? "rotate-90" : ""
            }`}
          />
          <span className="hidden sm:inline">
            {isRotated ? "Portrait" : "Landscape"}
          </span>
          
          {/* Rotation animation indicator */}
          <div
            className={`absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 transition-transform duration-500 ${
              isRotated ? "translate-x-full" : "-translate-x-full"
            } group-hover:translate-x-0`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <span>Rotate to {isRotated ? "portrait" : "landscape"}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded">
            ⌘O
          </kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default DeviceRotationIndicator;

"use client";

import { RefreshCw, Camera, LayoutGrid, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

interface QuickActionsProps {
  actions: QuickAction[];
  size?: "sm" | "default";
  className?: string;
}

const QuickActions = ({ actions, size = "sm", className = "" }: QuickActionsProps) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                variant={action.variant || "outline"}
                size={size}
                className="gap-2"
              >
                <Icon
                  className={`w-4 h-4 ${action.loading ? "animate-spin" : ""}`}
                />
                <span className="hidden md:inline">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded">
                    {action.shortcut}
                  </kbd>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

// Pre-configured action sets
export const createPreviewActions = (handlers: {
  onRefresh: () => void;
  onScreenshot: () => void;
  onCompare: () => void;
  onFullscreen: () => void;
  onOpenExternal: () => void;
  isRefreshing?: boolean;
  isCapturing?: boolean;
}): QuickAction[] => [
  {
    icon: RefreshCw,
    label: "Refresh",
    shortcut: "⌘R",
    onClick: handlers.onRefresh,
    loading: handlers.isRefreshing,
  },
  {
    icon: Camera,
    label: "Screenshot",
    shortcut: "⌘S",
    onClick: handlers.onScreenshot,
    loading: handlers.isCapturing,
  },
  {
    icon: LayoutGrid,
    label: "Compare",
    shortcut: "⌘G",
    onClick: handlers.onCompare,
  },
  {
    icon: Maximize2,
    label: "Fullscreen",
    onClick: handlers.onFullscreen,
  },
  {
    icon: ExternalLink,
    label: "Open",
    onClick: handlers.onOpenExternal,
    variant: "ghost",
  },
];

export default QuickActions;

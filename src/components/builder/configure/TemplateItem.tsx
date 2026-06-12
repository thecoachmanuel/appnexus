"use client";

import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { AppConfig } from "@/stores/useAppStore";
import TemplatePreview from "./TemplatePreview";

interface TemplateItemProps {
  templateConfig: AppConfig;
  name: string;
  description: string | null;
  onApply: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

const TemplateItem = ({ 
  templateConfig, 
  name, 
  description,
  onApply,
  onDuplicate,
  onDelete,
  showDelete = false,
}: TemplateItemProps) => (
  <HoverCard openDelay={200} closeDelay={100}>
    <HoverCardTrigger asChild>
      <DropdownMenuItem
        className="flex items-center justify-between group cursor-pointer"
        onSelect={(e) => e.preventDefault()}
      >
        <button onClick={onApply} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: templateConfig.primaryColor }}
            />
            <p className="font-medium">{name}</p>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground truncate ml-5">
              {description}
            </p>
          )}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate template"
          >
            <Copy className="w-3 h-3 text-primary" />
          </Button>
          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete template"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          )}
        </div>
      </DropdownMenuItem>
    </HoverCardTrigger>
    <HoverCardContent 
      side="left" 
      align="start" 
      className="w-auto p-3 bg-popover border shadow-xl"
      sideOffset={10}
    >
      <div className="space-y-2">
        <div>
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{templateConfig.appCategory || "General"}</p>
        </div>
        <TemplatePreview templateConfig={templateConfig} />
        <div className="flex gap-1 flex-wrap max-w-32">
          {templateConfig.suggestedFeatures.slice(0, 4).map((f, i) => (
            <span key={i} className="text-[8px] px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

export default TemplateItem;
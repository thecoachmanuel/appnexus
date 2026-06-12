"use client";

import { Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface Shortcut {
  keys: string[];
  label: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["←", "→"], label: "Navigate steps" },
  { keys: ["1", "2", "3", "4"], label: "Jump to step" },
  { keys: ["⌘", "R"], label: "Refresh preview" },
  { keys: ["⌘", "S"], label: "Screenshot" },
  { keys: ["⌘", "O"], label: "Rotate device" },
  { keys: ["⌘", "G"], label: "Comparison mode" },
  { keys: ["?"], label: "Show shortcuts" },
];

const KeyboardShortcutsHelp = () => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="w-64 p-4">
        <p className="font-semibold text-sm mb-3">Keyboard Shortcuts</p>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">{shortcut.label}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default KeyboardShortcutsHelp;

"use client";

import { useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseBuilderKeyboardShortcutsProps {
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onRefresh?: () => void;
  onScreenshot?: () => void;
  onRotate?: () => void;
  onToggleComparison?: () => void;
  enabled?: boolean;
}

export const useBuilderKeyboardShortcuts = ({
  currentStep,
  onNextStep,
  onPrevStep,
  onRefresh,
  onScreenshot,
  onRotate,
  onToggleComparison,
  enabled = true,
}: UseBuilderKeyboardShortcutsProps) => {
  const { toast } = useToast();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isModKey = event.metaKey || event.ctrlKey;

      // Navigation shortcuts
      if (event.key === "ArrowRight" && !isModKey) {
        event.preventDefault();
        if (currentStep < 4) onNextStep();
      }
      
      if (event.key === "ArrowLeft" && !isModKey) {
        event.preventDefault();
        if (currentStep > 1) onPrevStep();
      }

      // Step-specific shortcuts (with Cmd/Ctrl)
      if (isModKey) {
        switch (event.key) {
          case "r":
            if (onRefresh) {
              event.preventDefault();
              onRefresh();
            }
            break;
          case "s":
            if (onScreenshot) {
              event.preventDefault();
              onScreenshot();
            }
            break;
          case "o":
            if (onRotate) {
              event.preventDefault();
              onRotate();
            }
            break;
          case "g":
            if (onToggleComparison) {
              event.preventDefault();
              onToggleComparison();
            }
            break;
        }
      }

      // Quick step jump (1-4)
      if (!isModKey && ["1", "2", "3", "4"].includes(event.key)) {
        const step = parseInt(event.key);
        if (step <= currentStep + 1) {
          event.preventDefault();
          if (step > currentStep) onNextStep();
          else if (step < currentStep) onPrevStep();
        }
      }

      // Show shortcuts help
      if (event.key === "?" && !isModKey) {
        toast({
          title: "Keyboard Shortcuts",
          description: "← → Navigate steps • 1-4 Jump to step • ⌘R Refresh • ⌘S Screenshot • ⌘O Rotate • ⌘G Compare",
        });
      }
    },
    [enabled, currentStep, onNextStep, onPrevStep, onRefresh, onScreenshot, onRotate, onToggleComparison, toast]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export default useBuilderKeyboardShortcuts;

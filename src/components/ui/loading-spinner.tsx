"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: { ring: "w-10 h-10", border: "border-[2px]" },
  md: { ring: "w-[60px] h-[60px]", border: "border-[3px]" },
  lg: { ring: "w-20 h-20", border: "border-[4px]" },
};

const paddingClasses = {
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

export const LoadingSpinner = ({ 
  className, 
  size = "md", 
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const { ring, border } = sizeClasses[size];
  
  const spinner = (
    <div className={cn(paddingClasses[size], className)}>
      <div 
        className={cn(
          "rounded-full animate-spin",
          ring,
          border,
          "border-muted border-t-primary"
        )} 
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

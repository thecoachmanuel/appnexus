"use client";

import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
}

const ShimmerSkeleton = ({ className }: ShimmerSkeletonProps) => {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer rounded",
        className
      )}
    />
  );
};

export default ShimmerSkeleton;

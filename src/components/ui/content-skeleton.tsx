"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ContentSkeletonProps {
  className?: string;
}

// Text line skeleton
export const SkeletonText = ({ className, lines = 3 }: ContentSkeletonProps & { lines?: number }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} 
      />
    ))}
  </div>
);

// Avatar skeleton
export const SkeletonAvatar = ({ className, size = "md" }: ContentSkeletonProps & { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  return <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />;
};

// Card skeleton
export const SkeletonCard = ({ className }: ContentSkeletonProps) => (
  <div className={cn("p-6 border rounded-lg space-y-4", className)}>
    <div className="flex items-center gap-4">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

// Table row skeleton
export const SkeletonTableRow = ({ className, columns = 4 }: ContentSkeletonProps & { columns?: number }) => (
  <div className={cn("flex items-center gap-4 py-4 border-b", className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn("h-4", i === 0 ? "w-1/4" : "flex-1")} 
      />
    ))}
  </div>
);

// Table skeleton
export const SkeletonTable = ({ className, rows = 5, columns = 4 }: ContentSkeletonProps & { rows?: number; columns?: number }) => (
  <div className={cn("space-y-0", className)}>
    {/* Header */}
    <div className="flex items-center gap-4 py-3 border-b-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-1/4" : "flex-1")} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonTableRow key={i} columns={columns} />
    ))}
  </div>
);

// List item skeleton
export const SkeletonListItem = ({ className }: ContentSkeletonProps) => (
  <div className={cn("flex items-center gap-4 py-3", className)}>
    <Skeleton className="w-10 h-10 rounded" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20 rounded" />
  </div>
);

// List skeleton
export const SkeletonList = ({ className, items = 5 }: ContentSkeletonProps & { items?: number }) => (
  <div className={cn("divide-y", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonListItem key={i} />
    ))}
  </div>
);

// Stats card skeleton
export const SkeletonStats = ({ className }: ContentSkeletonProps) => (
  <div className={cn("p-6 border rounded-lg space-y-3", className)}>
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

// Grid of stats
export const SkeletonStatsGrid = ({ className, count = 4 }: ContentSkeletonProps & { count?: number }) => (
  <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStats key={i} />
    ))}
  </div>
);

// Form skeleton
export const SkeletonForm = ({ className, fields = 4 }: ContentSkeletonProps & { fields?: number }) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
    ))}
    <Skeleton className="h-10 w-32 rounded" />
  </div>
);

// Page header skeleton
export const SkeletonPageHeader = ({ className }: ContentSkeletonProps) => (
  <div className={cn("space-y-4 mb-8", className)}>
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

// Full page skeleton
export const SkeletonPage = ({ className }: ContentSkeletonProps) => (
  <div className={cn("space-y-8", className)}>
    <SkeletonPageHeader />
    <SkeletonStatsGrid />
    <SkeletonTable />
  </div>
);

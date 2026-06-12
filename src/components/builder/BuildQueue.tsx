"use client";

import { CheckCircle, XCircle, Loader2, Clock, Trash2, X, Smartphone, Apple, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getPlatformById } from "@/config/platforms";
import type { QueuedBuild } from "@/hooks/useBuildQueue";
import type { PlatformId } from "@/types/platforms";
import { formatDistanceToNow } from "date-fns";
import type { LucideIcon } from "lucide-react";

const platformIcons: Record<PlatformId, LucideIcon> = {
  android: Smartphone,
  ios: Apple,
  windows: Monitor,
  macos: Apple,
  linux: Monitor,
  pwa: Globe,
};

interface BuildQueueProps {
  queue: QueuedBuild[];
  onRemove: (id: string) => void;
  onClearCompleted: () => void;
}

const BuildQueue = ({ queue, onRemove, onClearCompleted }: BuildQueueProps) => {
  if (queue.length === 0) return null;

  const activeBuilds = queue.filter((b) => b.status === "building");
  const queuedBuilds = queue.filter((b) => b.status === "queued");
  const completedBuilds = queue.filter((b) => b.status === "complete" || b.status === "failed");

  const getStatusIcon = (status: QueuedBuild["status"]) => {
    switch (status) {
      case "queued":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "building":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "complete":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = (status: QueuedBuild["status"]) => {
    switch (status) {
      case "queued":
        return "Queued";
      case "building":
        return "Building";
      case "complete":
        return "Complete";
      case "failed":
        return "Failed";
    }
  };

  return (
    <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-display font-bold text-foreground">Build Queue</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            {activeBuilds.length} active · {queuedBuilds.length} queued
          </span>
        </div>
        {completedBuilds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompleted}
            className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Completed
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {queue.map((build) => {
          const platform = getPlatformById(build.platform);
          const PlatformIcon = platformIcons[build.platform];

          return (
            <div
              key={build.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                build.status === "building"
                  ? "bg-primary/10 border border-primary/20"
                  : build.status === "complete"
                  ? "bg-primary/10 border border-primary/20"
                  : build.status === "failed"
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-secondary/50 border border-transparent"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center">
                <PlatformIcon className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {build.appName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {platform?.name}
                  </span>
                </div>

                {build.status === "building" && (
                  <div className="mt-1.5">
                    <Progress value={build.progress} className="h-1.5" />
                  </div>
                )}

                {build.status === "failed" && build.errorMessage && (
                  <p className="text-xs text-destructive mt-1 truncate">
                    {build.errorMessage}
                  </p>
                )}

                {build.completedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(build.completedAt, { addSuffix: true })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {getStatusIcon(build.status)}
                  <span className="text-muted-foreground">{getStatusText(build.status)}</span>
                </div>

                {(build.status === "queued" || build.status === "complete" || build.status === "failed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onRemove(build.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {queuedBuilds.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Up to 2 builds can run simultaneously
        </p>
      )}
    </div>
  );
};

export default BuildQueue;

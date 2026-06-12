"use client";

import { useState, useCallback } from "react";
import type { PlatformId } from "@/types/platforms";

export interface QueuedBuild {
  id: string;
  appName: string;
  platform: PlatformId;
  status: "queued" | "building" | "complete" | "failed";
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  downloadUrl?: string;
  errorMessage?: string;
}

export const useBuildQueue = () => {
  const [queue, setQueue] = useState<QueuedBuild[]>([]);
  const [maxConcurrent] = useState(2);

  const addToQueue = useCallback((build: Omit<QueuedBuild, "id" | "status" | "progress">) => {
    const newBuild: QueuedBuild = {
      ...build,
      id: crypto.randomUUID(),
      status: "queued",
      progress: 0,
    };
    setQueue((prev) => [...prev, newBuild]);
    return newBuild.id;
  }, []);

  const updateBuild = useCallback((id: string, updates: Partial<QueuedBuild>) => {
    setQueue((prev) =>
      prev.map((build) => (build.id === id ? { ...build, ...updates } : build))
    );
  }, []);

  const removeBuild = useCallback((id: string) => {
    setQueue((prev) => prev.filter((build) => build.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((build) => build.status !== "complete" && build.status !== "failed"));
  }, []);

  const getActiveBuilds = useCallback(() => {
    return queue.filter((build) => build.status === "building");
  }, [queue]);

  const getQueuedBuilds = useCallback(() => {
    return queue.filter((build) => build.status === "queued");
  }, [queue]);

  const getCompletedBuilds = useCallback(() => {
    return queue.filter((build) => build.status === "complete" || build.status === "failed");
  }, [queue]);

  const canStartNewBuild = useCallback(() => {
    return getActiveBuilds().length < maxConcurrent;
  }, [getActiveBuilds, maxConcurrent]);

  const getNextInQueue = useCallback(() => {
    const queued = getQueuedBuilds();
    return queued.length > 0 ? queued[0] : null;
  }, [getQueuedBuilds]);

  return {
    queue,
    maxConcurrent,
    addToQueue,
    updateBuild,
    removeBuild,
    clearCompleted,
    getActiveBuilds,
    getQueuedBuilds,
    getCompletedBuilds,
    canStartNewBuild,
    getNextInQueue,
  };
};

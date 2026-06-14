"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Zap, Package, Shield, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BuildProgressAnimationProps {
  progress: number;
  status: "idle" | "building" | "complete" | "failed";
  platform: string;
  currentStepLabel?: string;
  buildSteps?: { progress: number; label: string }[];
}

const buildPhases = [
  { icon: Zap, label: "Initializing", range: [0, 15], color: "text-primary" },
  { icon: Package, label: "Compiling", range: [15, 50], color: "text-primary" },
  { icon: Shield, label: "Signing", range: [50, 85], color: "text-primary" },
  { icon: Upload, label: "Finalizing", range: [85, 100], color: "text-primary" },
];

const BuildProgressAnimation = ({
  progress,
  status,
  platform,
  currentStepLabel,
  buildSteps,
}: BuildProgressAnimationProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [animatedDots, setAnimatedDots] = useState("");

  // Smooth progress animation with simulated advancement
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        // If server reported higher progress, catch up quickly
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        }
        // Simulate progress while building (never exceeds 95 on its own)
        if (status === "building" && prev < 95) {
          // Slow down as we get higher to feel realistic
          const increment = prev < 30 ? 0.3 : prev < 60 ? 0.15 : prev < 80 ? 0.08 : 0.03;
          return Math.min(prev + increment, 95);
        }
        // Jump to 100 when complete
        if (status === "complete" && prev < 100) {
          return Math.min(prev + 2, 100);
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [progress, status]);

  // Animated dots for loading
  useEffect(() => {
    if (status !== "building") return;
    const timer = setInterval(() => {
      setAnimatedDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(timer);
  }, [status]);

  const currentPhase = buildPhases.find(
    (phase) => displayProgress >= phase.range[0] && displayProgress < phase.range[1]
  ) || buildPhases[buildPhases.length - 1];

  const PhaseIcon = currentPhase.icon;

  const computedStepLabel = buildSteps 
    ? buildSteps.find((s) => displayProgress <= s.progress)?.label || "Finishing up..."
    : currentStepLabel;

  if (status === "idle") return null;

  return (
    <div className="space-y-6">
      {/* Main Progress Bar */}
      <div className="relative">
        <Progress 
          value={displayProgress} 
          className="h-3 bg-muted"
        />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 animate-pulse"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* Phase Indicators */}
      <div className="flex items-center justify-between">
        {buildPhases.map((phase, index) => {
          const isActive = displayProgress >= phase.range[0];
          const isComplete = displayProgress >= phase.range[1];
          const Icon = phase.icon;

          return (
            <div
              key={phase.label}
              className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                isActive ? "opacity-100 scale-100" : "opacity-40 scale-95"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? "bg-primary/20 text-primary"
                    : isActive
                    ? `bg-primary/20 ${phase.color}`
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isActive && currentPhase === phase ? (
                  <Icon className="w-5 h-5 animate-pulse" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      <div className="text-center">
        {status === "building" && (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {computedStepLabel || `Building for ${platform}`}{animatedDots}
            </span>
          </div>
        )}
        {status === "complete" && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Build Complete!</span>
          </div>
        )}
        {status === "failed" && (
          <div className="flex items-center justify-center gap-2 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Build Failed</span>
          </div>
        )}
      </div>

      {/* Progress Percentage */}
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-muted rounded-full">
          <span className="text-2xl font-bold tabular-nums">
            {Math.round(displayProgress)}
          </span>
          <span className="text-sm text-muted-foreground ml-1">%</span>
        </div>
      </div>
    </div>
  );
};

export default BuildProgressAnimation;

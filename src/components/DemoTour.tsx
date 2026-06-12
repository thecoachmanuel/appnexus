"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Rocket,
  Smartphone,
  Palette,
  Zap,
  Download,
  Settings,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { isDemoAccount as checkDemoAccount, isAdminDemoAccount } from "@/lib/demo-mode";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const TOUR_STORAGE_KEY = "demo_tour_completed";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features?: string[];
}

const getTourSteps = (appName: string): TourStep[] => [
  {
    id: "welcome",
    title: `Welcome to ${appName}!`,
    description: "Transform any website into a native mobile app in minutes. Let's take a quick tour of the key features.",
    icon: <Rocket className="w-8 h-8" />,
    color: "from-accent to-accent/60",
    features: [
      "AI-powered app configuration",
      "Cross-platform builds (iOS & Android)",
      "No coding required",
    ],
  },
  {
    id: "builder",
    title: "App Builder",
    description: "Enter any website URL and our AI will automatically analyze it and configure your mobile app settings.",
    icon: <Smartphone className="w-8 h-8" />,
    color: "from-blue-500 to-blue-400",
    features: [
      "Paste your website URL",
      "AI analyzes colors, icons & structure",
      "Customize app name & branding",
    ],
  },
  {
    id: "customize",
    title: "Customization",
    description: "Fine-tune every aspect of your app with our visual configuration tools and preset templates.",
    icon: <Palette className="w-8 h-8" />,
    color: "from-purple-500 to-purple-400",
    features: [
      "Choose navigation styles",
      "Customize splash screens",
      "Apply preset templates",
    ],
  },
  {
    id: "automations",
    title: "Automations",
    description: "Set up powerful workflows to automate push notifications, data sync, and scheduled tasks.",
    icon: <Zap className="w-8 h-8" />,
    color: "from-amber-500 to-amber-400",
    features: [
      "Push notification workflows",
      "Scheduled data syncing",
      "Event-triggered actions",
    ],
  },
  {
    id: "builds",
    title: "Build & Download",
    description: "Generate production-ready APK and IPA files. Track build progress in real-time with notifications.",
    icon: <Download className="w-8 h-8" />,
    color: "from-green-500 to-green-400",
    features: [
      "Real-time build progress",
      "Download APK/IPA files",
      "View build history",
    ],
  },
  {
    id: "admin",
    title: "Admin Panel",
    description: "As a demo admin, you have access to the full admin panel to manage users, plans, and system settings.",
    icon: <Shield className="w-8 h-8" />,
    color: "from-red-500 to-red-400",
    features: [
      "User management",
      "Payment tracking",
      "System configuration",
    ],
  },
];

export function DemoTour() {
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const userEmail = user?.email?.toLowerCase();
  const isDemoAccount = checkDemoAccount(userEmail, settings.demo_mode);
  const isAdminDemo = isAdminDemoAccount(userEmail, settings.demo_mode);

  const tourSteps = getTourSteps(settings.app_name);

  // Filter steps based on user type (only show admin step to admin demo)
  const filteredSteps = tourSteps.filter(
    (step) => step.id !== "admin" || isAdminDemo
  );

  useEffect(() => {
    if (isDemoAccount) {
      // Check if tour has been completed
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!tourCompleted) {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isDemoAccount]);

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsOpen(false);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isDemoAccount) return null;

  const step = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border/50">
        {/* Header with gradient */}
        <div className={cn("p-6 bg-gradient-to-br text-white", step.color)}>
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/20 -mt-2 -mr-2"
                onClick={handleSkip}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base mt-2">
              {step.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {step.features && (
                <ul className="space-y-3">
                  {step.features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 text-foreground"
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br",
                        step.color
                      )}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mt-6 mb-4">
            {filteredSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentStep ? 1 : -1);
                  setCurrentStep(index);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === currentStep
                    ? "w-6 bg-accent"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {filteredSteps.length}
            </span>

            {isLastStep ? (
              <Button onClick={handleComplete} className="gap-2 bg-accent hover:bg-accent/90">
                <Sparkles className="w-4 h-4" />
                Get Started
              </Button>
            ) : (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a button to manually trigger the tour
export function DemoTourTrigger() {
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const userEmail = user?.email?.toLowerCase();
  const isDemoAccount = checkDemoAccount(userEmail, settings.demo_mode);

  const handleRestartTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  if (!isDemoAccount) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestartTour}
      className="gap-2"
    >
      <Sparkles className="w-4 h-4" />
      Replay Tour
    </Button>
  );
}

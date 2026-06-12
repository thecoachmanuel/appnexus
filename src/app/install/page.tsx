"use client";

import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Share, Plus, CheckCircle, Apple, Check, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNotificationSounds } from '@/hooks/useNotificationSounds';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Confetti from '@/components/Confetti';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StepItemProps {
  stepNumber: number;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
  title: string;
  description: React.ReactNode;
}

const StepItem = ({ stepNumber, isCompleted, isActive, onClick, title, description }: StepItemProps) => (
  <li 
    className={cn(
      "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
      isActive ? "bg-primary/10 ring-2 ring-primary/30" : "bg-secondary/30 hover:bg-secondary/50",
      isCompleted && !isActive && "opacity-60"
    )}
    onClick={onClick}
  >
    <div 
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-all duration-200",
        isCompleted 
          ? "bg-primary text-primary-foreground" 
          : isActive 
            ? "bg-primary text-primary-foreground animate-pulse" 
            : "bg-primary/20 text-primary"
      )}
    >
      {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
    </div>
    <div className="flex-1">
      <p className={cn(
        "font-medium transition-colors",
        isActive ? "text-foreground" : "text-foreground/80"
      )}>
        {title}
      </p>
      <div className="text-sm text-muted-foreground mt-1">
        {description}
      </div>
    </div>
  </li>
);

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

const StepProgress = ({ currentStep, totalSteps, completedSteps }: StepProgressProps) => (
  <div className="flex items-center gap-2 mb-6">
    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
      <div key={step} className="flex items-center">
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-all duration-300",
            completedSteps.includes(step)
              ? "bg-primary scale-100"
              : step === currentStep
                ? "bg-primary/60 scale-110 animate-pulse"
                : "bg-muted-foreground/30"
          )}
        />
        {index < totalSteps - 1 && (
          <div 
            className={cn(
              "w-8 h-0.5 mx-1 transition-all duration-300",
              completedSteps.includes(step) ? "bg-primary" : "bg-muted-foreground/20"
            )}
          />
        )}
      </div>
    ))}
    <span className="ml-2 text-xs text-muted-foreground">
      {completedSteps.length}/{totalSteps} completed
    </span>
  </div>
);

const Install = () => {
  const { isInstallable, isInstalled, promptInstall, isIOS, isDesktop, isChrome, isEdge } = usePWAInstall();
  const { playStep, playCelebrate } = useNotificationSounds();
  const { settings } = useSystemSettings();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isAllStepsCompleted = completedSteps.length === 3;

  useEffect(() => {
    if (isAllStepsCompleted && !allCompleted) {
      setShowConfetti(true);
      setAllCompleted(true);
      if (soundEnabled) {
        playCelebrate();
      }
      // Reset confetti trigger after animation
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
    if (!isAllStepsCompleted) {
      setAllCompleted(false);
    }
  }, [isAllStepsCompleted, allCompleted, soundEnabled, playCelebrate]);

  const toggleStepComplete = (step: number) => {
    const isCompleting = !completedSteps.includes(step);
    
    setCompletedSteps(prev => 
      prev.includes(step) 
        ? prev.filter(s => s !== step)
        : [...prev, step]
    );
    
    // Play step sound when completing (not uncompleting)
    if (isCompleting && soundEnabled) {
      playStep();
    }
    
    // Auto-advance to next step if completing current
    if (isCompleting && step < 3) {
      setCurrentStep(step + 1);
    }
  };

  const iosSteps = [
    {
      title: "Tap the Share button",
      description: (
        <span className="flex items-center gap-2">
          <Share className="w-4 h-4" />
          Located at the bottom of Safari
        </span>
      )
    },
    {
      title: 'Scroll down and tap "Add to Home Screen"',
      description: (
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Look for the plus icon
        </span>
      )
    },
    {
      title: 'Tap "Add" to confirm',
      description: "The app will appear on your home screen"
    }
  ];

  const androidSteps = [
    {
      title: "Tap the menu button",
      description: "Three dots (⋮) in the top-right corner of Chrome"
    },
    {
      title: 'Tap "Install app" or "Add to Home screen"',
      description: "May also appear as a banner at the bottom"
    },
    {
      title: 'Tap "Install" to confirm',
      description: "The app will be added to your home screen"
    }
  ];

  const chromeDesktopSteps = [
    {
      title: "Click the install icon in the address bar",
      description: (
        <span className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Look for the install icon (⊕) on the right side of the address bar
        </span>
      )
    },
    {
      title: 'Click "Install" in the popup',
      description: "A confirmation dialog will appear — click Install"
    },
    {
      title: "Launch from your desktop or taskbar",
      description: "The app opens in its own window, just like a native app"
    }
  ];

  const edgeDesktopSteps = [
    {
      title: 'Click the "..." menu in the top-right',
      description: "Open the Edge browser menu"
    },
    {
      title: 'Select "Apps" → "Install this site as an app"',
      description: "You can also look for the install icon in the address bar"
    },
    {
      title: 'Click "Install" to confirm',
      description: "The app will be pinned to your taskbar and Start menu"
    }
  ];

  const genericDesktopSteps = [
    {
      title: "Open this page in Chrome or Edge",
      description: "PWA installation works best in Chromium-based browsers"
    },
    {
      title: "Look for the install icon in the address bar",
      description: (
        <span className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          It appears as a small icon (⊕) on the right side
        </span>
      )
    },
    {
      title: 'Click "Install" to confirm',
      description: "The app will open in its own window like a native app"
    }
  ];

  const steps = isIOS 
    ? iosSteps 
    : isDesktop 
      ? (isEdge ? edgeDesktopSteps : isChrome ? chromeDesktopSteps : genericDesktopSteps)
      : androidSteps;

  return (
    <div className="min-h-screen bg-background">
      <Confetti isActive={showConfetti} />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 sm:pt-28 pb-16 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
            <Download className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Install {settings.app_name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Add this app to your home screen for the best experience
          </p>
        </div>

        {isInstalled ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Already Installed!
            </h2>
            <p className="text-muted-foreground">
              {settings.app_name} is installed on your device. Open it from your home screen.
            </p>
          </div>
        ) : isInstallable ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Ready to Install
            </h2>
            <p className="text-muted-foreground mb-6">
              Click the button below to install {settings.app_name} on your device.
            </p>
            <Button variant="hero" size="xl" onClick={promptInstall}>
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isIOS ? (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted-foreground to-foreground flex items-center justify-center">
                    <Apple className="w-6 h-6 text-background" />
                  </div>
                ) : isDesktop ? (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary-foreground" fill="currentColor">
                      <path d="M12 7.5c-3.86 0-7 3.14-7 7v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5c0-3.86-3.14-7-7-7z"/>
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    Install on {isIOS ? 'iOS' : isDesktop ? (isEdge ? 'Edge' : isChrome ? 'Chrome' : 'Desktop') : 'Android'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isIOS ? 'Safari browser required' : isDesktop ? (isEdge ? 'Microsoft Edge' : isChrome ? 'Google Chrome' : 'Chrome or Edge recommended') : 'Chrome browser recommended'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  soundEnabled 
                    ? "bg-primary/10 text-primary hover:bg-primary/20" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                title={soundEnabled ? "Mute sounds" : "Enable sounds"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

            <StepProgress 
              currentStep={currentStep} 
              totalSteps={3} 
              completedSteps={completedSteps} 
            />
            
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <StepItem
                  key={index}
                  stepNumber={index + 1}
                  isCompleted={completedSteps.includes(index + 1)}
                  isActive={currentStep === index + 1}
                  onClick={() => toggleStepComplete(index + 1)}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </ol>

            <AnimatePresence>
              {isAllStepsCompleted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <PartyPopper className="w-5 h-5" />
                    <span>All steps completed! Enjoy your app!</span>
                    <PartyPopper className="w-5 h-5" />
                  </div>
                </motion.div>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-muted-foreground text-center mt-4"
                >
                  Click each step to mark it as complete
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-8 p-6 bg-secondary/20 rounded-2xl">
          <h3 className="font-display font-bold text-foreground mb-2">Why install?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Works offline - access your apps anytime
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Faster loading - no browser overhead
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Full screen experience - no address bar
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Quick access from your home screen
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;

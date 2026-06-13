"use client";

import { useCallback, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import UrlInputStep from "@/components/builder/UrlInputStep";
import ConfigureStep from "@/components/builder/ConfigureStep";
import PreviewStep from "@/components/builder/PreviewStep";
import BuildStep from "@/components/builder/BuildStep";
import BuilderProgress from "@/components/builder/BuilderProgress";
import AIAssistant from "@/components/builder/AIAssistant";
import KeyboardShortcutsHelp from "@/components/builder/KeyboardShortcutsHelp";
import { useAppStore } from "@/stores/useAppStore";
import { useBuilderKeyboardShortcuts } from "@/hooks/useBuilderKeyboardShortcuts";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import ThemeAwareLogo from "@/components/ThemeAwareLogo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { DemoModeBanner } from "@/components/DemoModeBanner";

const steps = [
  { number: 1, title: "Enter URL", description: "Paste your website URL" },
  { number: 2, title: "Configure", description: "AI-powered setup" },
  { number: 3, title: "Preview", description: "Test your app" },
  { number: 4, title: "Build", description: "Generate your app" },
];

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.3,
};

const AppBuilder = () => {
  const { currentStep, goToStep, config, updateConfig, setConfig, isAnalyzing, setIsAnalyzing } = useAppStore();
  const { settings } = useSystemSettings();

  // Update document title with app name
  useEffect(() => {
    document.title = `${settings.app_name} - App Builder`;
  }, [settings.app_name]);

  const handleUrlSubmit = (url: string) => {
    updateConfig({ websiteUrl: url });
  };

  const handleNextStep = useCallback(() => {
    if (currentStep < 4) goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Enable keyboard shortcuts
  useBuilderKeyboardShortcuts({
    currentStep,
    onNextStep: handleNextStep,
    onPrevStep: handlePrevStep,
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
      
        <main className="pt-20 sm:pt-24 md:pt-28 pb-24 md:pb-16">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            {/* Demo Mode Banner */}
            <DemoModeBanner />
            
            {/* Header with Keyboard Help */}
            <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6 md:mb-10 lg:mb-12">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <ThemeAwareLogo className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl" />
                <h1 className="font-display text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  <span className="text-foreground">Create Your</span>{" "}
                  <span className="text-accent">Mobile App</span>
                </h1>
                <KeyboardShortcutsHelp />
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-muted-foreground px-2 sm:px-4">
                Enter your website URL and let AI configure your native app automatically
              </p>
            </div>

            {/* Progress with clickable steps */}
            <BuilderProgress 
              steps={steps} 
              currentStep={currentStep} 
              onStepClick={goToStep}
            />

            {/* Animated Step Content */}
            <div className="max-w-4xl mx-auto mt-6 sm:mt-8 md:mt-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  {currentStep === 1 && (
                    <UrlInputStep
                      websiteUrl={config.websiteUrl}
                      onSubmit={handleUrlSubmit}
                      onNext={() => goToStep(2)}
                      isAnalyzing={isAnalyzing}
                      setIsAnalyzing={setIsAnalyzing}
                      updateConfig={updateConfig}
                    />
                  )}
                  {currentStep === 2 && (
                    <ConfigureStep
                      config={config}
                      onUpdate={updateConfig}
                      onBack={() => goToStep(1)}
                      onNext={() => goToStep(3)}
                    />
                  )}
                  {currentStep === 3 && (
                    <PreviewStep
                      config={config}
                      onBack={() => goToStep(2)}
                      onNext={() => goToStep(4)}
                    />
                  )}
                  {currentStep === 4 && (
                    <BuildStep
                      config={config}
                      onBack={() => goToStep(3)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        <Footer />
        <MobileBottomNav />
        
        <Suspense fallback={null}>
          <AIAssistant currentStep={currentStep} config={config} onUpdateConfig={updateConfig} />
        </Suspense>
      </div>
    </TooltipProvider>
  );
};

export default AppBuilder;

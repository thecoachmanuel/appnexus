"use client";

import { Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface BuilderProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const BuilderProgress = ({ steps, currentStep, onStepClick }: BuilderProgressProps) => {
  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or next step
    if (onStepClick && stepNumber <= currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="flex items-center justify-center px-2">
      <div className="flex items-start gap-1 sm:gap-2 md:gap-6">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = step.number <= currentStep;
          
          return (
            <div key={step.number} className="flex items-start gap-1 sm:gap-2">
              {/* Step Circle with Animation */}
              <motion.div
                className="flex flex-col items-center"
                initial={false}
                animate={{ scale: isCurrent ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-display font-bold text-sm sm:text-base md:text-lg transition-all duration-300 relative overflow-hidden ${
                    isCompleted
                      ? "bg-accent text-accent-foreground cursor-pointer hover:shadow-lg"
                      : isCurrent
                      ? "bg-accent text-accent-foreground shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-accent/30"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="relative z-10"
                      >
                        {step.number}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Step labels - show on sm and up */}
                <motion.div
                  className="mt-1.5 sm:mt-2 text-center hidden sm:block"
                  initial={false}
                  animate={{ opacity: isCurrent ? 1 : 0.7 }}
                >
                  <p
                    className={`font-semibold text-xs sm:text-sm transition-colors ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden md:block">{step.description}</p>
                </motion.div>
                
                {/* Mobile: Show only current step title below the progress bar */}
                {isCurrent && (
                  <p className="sm:hidden mt-1 text-[10px] font-medium text-foreground text-center whitespace-nowrap">
                    {step.title}
                  </p>
                )}
              </motion.div>

              {/* Animated Connector Line - vertically centered with step circle */}
              {index < steps.length - 1 && (
                <div className="flex items-center h-9 sm:h-10 md:h-12">
                  <div className="relative w-6 sm:w-8 md:w-16 h-0.5">
                    <div className="absolute inset-0 bg-border rounded-full" />
                    <motion.div
                      className="absolute inset-0 bg-accent rounded-full origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isCompleted ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                    
                    {/* Arrow indicator for next step - hide on mobile */}
                    {!isCompleted && isCurrent && (
                      <motion.div
                        className="absolute -right-1 top-1/2 -translate-y-1/2 text-muted-foreground hidden sm:block"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuilderProgress;
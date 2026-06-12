"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  id?: string;
}

const CollapsibleSection = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  id,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={id} className="border border-border/50 rounded-xl overflow-hidden bg-card/30 scroll-mt-4">
      {/* Header - Always visible, clickable on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 md:hidden hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
            {icon}
          </div>
          <span className="font-medium text-sm sm:text-base text-foreground truncate">{title}</span>
          <div className="flex-shrink-0">{badge}</div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Desktop: Always show content */}
      <div className="hidden md:block p-4">
        {children}
      </div>

      {/* Mobile: Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-border/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSection;

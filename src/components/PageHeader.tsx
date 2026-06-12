"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import ThemeAwareLogo from "@/components/ThemeAwareLogo";

interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const PageHeader = ({
  title,
  description,
  backLink,
  children,
  className,
  titleClassName,
}: PageHeaderProps) => {
  const { settings } = useSystemSettings();

  return (
    <div className={cn("flex flex-col gap-4 mb-8 sm:mb-10", className)}>
      <div className="flex items-start gap-3 sm:gap-4">
        {backLink && (
          <Button variant="ghost" size="icon" className="shrink-0 mt-1" asChild>
            <Link to={backLink}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
        )}
        <ThemeAwareLogo className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
        <div className="min-w-0">
          <h1 className={cn(
            "font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground",
            titleClassName
          )}>
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

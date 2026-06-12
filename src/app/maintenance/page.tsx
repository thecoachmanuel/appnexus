"use client";

import { Construction } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const Maintenance = () => {
  const { settings } = useSystemSettings();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Construction className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">We'll Be Right Back</h1>
        <p className="text-muted-foreground text-lg">
          {settings.app_name} is currently undergoing scheduled maintenance. We're working hard to improve your experience.
        </p>
        <p className="text-sm text-muted-foreground/70">
          Please check back shortly. We apologize for the inconvenience.
        </p>
        {settings.support_email && (
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href={`mailto:${settings.support_email}`} className="text-primary underline">
              Contact support
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default Maintenance;

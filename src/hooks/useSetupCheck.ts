"use client";

import { useState, useEffect } from "react";

interface SetupStatus {
  needsSetup: boolean | null;
  loading: boolean;
  error: string | null;
}

export const useSetupCheck = () => {
  const [status, setStatus] = useState<SetupStatus>({
    needsSetup: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
        const res = await fetch(`${API_URL}/api/auth/no-admin-exists`);
        
        if (!res.ok) {
          throw new Error("Failed to check setup status");
        }
        
        const data = await res.json();
        setStatus({ needsSetup: data.needsSetup === true, loading: false, error: null });
      } catch (err) {
        console.error("Setup check failed:", err);
        setStatus({ needsSetup: false, loading: false, error: "Failed to check setup status" });
      }
    };

    checkSetupStatus();
  }, []);

  return status;
};

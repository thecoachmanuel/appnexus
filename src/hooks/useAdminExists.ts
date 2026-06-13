"use client";

import { useState, useEffect } from "react";

export const useAdminExists = () => {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkForAdmin = async () => {
      try {
        const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
        const res = await fetch(`${API_URL}/api/auth/no-admin-exists`);
        
        if (!res.ok) {
          throw new Error("Failed to check for admin");
        }
        
        const data = await res.json();
        setHasAdmin(!data.needsSetup);
      } catch (error) {
        console.error("Error:", error);
        setHasAdmin(true);
      } finally {
        setLoading(false);
      }
    };

    checkForAdmin();
  }, []);

  return { hasAdmin, loading };
};

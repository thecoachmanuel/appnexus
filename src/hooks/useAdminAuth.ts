"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "user";

interface AdminAuthState {
  isAdmin: boolean;
  isModerator: boolean;
  role: AppRole | null;
  loading: boolean;
}

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isModerator: false,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setState({ isAdmin: false, isModerator: false, role: null, loading: false });
        return;
      }

      try {
        const token = localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }
        
        const data = await res.json();
        const role = data.role || "user";

        setState({
          isAdmin: role === "admin",
          isModerator: role === "admin" || role === "moderator",
          role,
          loading: false,
        });
      } catch (error) {
        console.error("Error in checkRole:", error);
        setState({ isAdmin: false, isModerator: false, role: null, loading: false });
      }
    };

    checkRole();
  }, [user]);

  return state;
};

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
  const { user, loading: ctxLoading } = useAuth();
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isModerator: false,
    role: null,
    loading: true,
  });

  useEffect(() => {
    if (ctxLoading) return;

    if (!user) {
      setState({ isAdmin: false, isModerator: false, role: null, loading: false });
    } else {
      const role = user.role || "user";
      setState({
        isAdmin: role === "admin",
        isModerator: role === "admin" || role === "moderator",
        role: role as AppRole,
        loading: false,
      });
    }
  }, [user, ctxLoading]);

  return state;
};

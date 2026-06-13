"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const REMEMBER_ME_KEY = 'app_remember_me';
const TOKEN_KEY = 'app_auth_token';

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface Session {
  access_token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  loading: false,
  signUp: async () => ({ error: new Error("AuthProvider is not mounted") }),
  signIn: async () => ({ error: new Error("AuthProvider is not mounted") }),
  signInWithGoogle: async () => ({ error: new Error("AuthProvider is not mounted") }),
  signInWithMagicLink: async () => ({ error: new Error("AuthProvider is not mounted") }),
  resendVerificationEmail: async () => ({ error: new Error("AuthProvider is not mounted") }),
  signOut: async () => {
    throw new Error("AuthProvider is not mounted");
  },
  resetPassword: async () => ({ error: new Error("AuthProvider is not mounted") }),
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === defaultAuthContext) {
    console.error("useAuth called outside AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setSession({ access_token: token, user: userData });
          } else {
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
          }
        } catch (error) {
          console.error("Failed to load user", error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [API_URL]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName })
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Failed to create account') };
      }

      setUser({ id: data.id, email: data.email, display_name: data.display_name });
      setSession({ access_token: data.token, user: { id: data.id, email: data.email, display_name: data.display_name } });
      sessionStorage.setItem(TOKEN_KEY, data.token);
      document.cookie = `${TOKEN_KEY}=${data.token}; path=/; SameSite=Lax`;

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to create account') };
    }
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Failed to sign in') };
      }

      setUser({ id: data.id, email: data.email, display_name: data.display_name });
      setSession({ access_token: data.token, user: { id: data.id, email: data.email, display_name: data.display_name } });
      
      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, data.token);
        document.cookie = `${TOKEN_KEY}=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        document.cookie = `${TOKEN_KEY}=${data.token}; path=/; SameSite=Lax`;
      }
      
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to sign in') };
    }
  };

  const signInWithGoogle = async () => {
    return { error: new Error('Google sign-in is not implemented on the custom backend yet') };
  };

  const signInWithMagicLink = async (email: string) => {
    return { error: new Error('Magic link sign-in is not implemented on the custom backend yet') };
  };

  const resendVerificationEmail = async (email: string) => {
    return { error: new Error('Email verification is not implemented on the custom backend yet') };
  };

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    return { error: new Error('Password reset is not implemented on the custom backend yet') };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signUp, 
      signIn, 
      signInWithGoogle,
      signInWithMagicLink,
      resendVerificationEmail,
      signOut,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

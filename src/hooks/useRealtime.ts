"use client";

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseRealtimeOptions {
  channel?: string;
  table?: string;
  onMessage?: (message: Record<string, unknown>) => void;
  onInsert?: (data: Record<string, unknown>) => void;
  onUpdate?: (data: Record<string, unknown>) => void;
  onDelete?: (data: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { user } = useAuth();
  const { table, onInsert, onUpdate, onDelete, enabled = true } = options;

  // Subscribe to table changes via Supabase Realtime
  useEffect(() => {
    // MongoDB migration: Realtime removed. Implement WebSockets if needed.
  }, [table, enabled, user, onInsert, onUpdate, onDelete]);

  const subscribe = useCallback((channelName: string, handler: (message: Record<string, unknown>) => void) => {
    return () => {};
  }, []);

  return {
    isConnected: true, // Supabase manages connection state internally
    subscribe,
  };
}

export default useRealtime;

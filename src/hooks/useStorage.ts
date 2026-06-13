"use client";

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type StorageBucket = 'avatars' | 'app-icons' | 'splash-screens' | 'apk-builds' | 'project-assets';

interface UploadOptions {
  bucket: StorageBucket;
  path?: string;
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

interface UploadResult {
  url: string;
  path: string;
  error: Error | null;
}

interface UseStorageReturn {
  upload: (file: File, options: UploadOptions) => Promise<UploadResult>;
  remove: (bucket: StorageBucket, path: string) => Promise<{ error: Error | null }>;
  getPublicUrl: (bucket: StorageBucket, path: string) => string;
  getSignedUrl: (bucket: StorageBucket, path: string, expiresIn?: number) => Promise<string | null>;
  listFiles: (bucket: StorageBucket, folder?: string) => Promise<{ name: string; url: string }[]>;
  isUploading: boolean;
  uploadProgress: number;
}

const DEFAULT_ALLOWED_TYPES: Record<StorageBucket, string[]> = {
  'avatars': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'app-icons': ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  'splash-screens': ['image/png', 'image/jpeg', 'image/webp'],
  'apk-builds': ['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip'],
  'project-assets': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf', 'application/json'],
};

const DEFAULT_MAX_SIZES: Record<StorageBucket, number> = {
  'avatars': 5,
  'app-icons': 10,
  'splash-screens': 10,
  'apk-builds': 500,
  'project-assets': 50,
};

export function useStorage(): UseStorageReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getApiUrl = () => typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
  const getToken = () => localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token');

  const upload = useCallback(async (file: File, options: UploadOptions): Promise<UploadResult> => {
    const { bucket, maxSizeMB, allowedTypes } = options;
    
    if (!user) return { url: '', path: '', error: new Error('You must be logged in to upload files') };

    const allowedMimeTypes = allowedTypes || DEFAULT_ALLOWED_TYPES[bucket];
    if (!allowedMimeTypes.includes(file.type)) {
      const error = new Error(`File type not allowed. Accepted: ${allowedMimeTypes.join(', ')}`);
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      return { url: '', path: '', error };
    }

    const maxSize = (maxSizeMB || DEFAULT_MAX_SIZES[bucket]) * 1024 * 1024;
    if (file.size > maxSize) {
      const error = new Error(`File too large.`);
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
      return { url: '', path: '', error };
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${getApiUrl()}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      setUploadProgress(100);
      toast({ title: 'Upload Complete', description: 'File uploaded successfully' });

      return { url: data.url, path: data.url, error: null };
    } catch (error) {
      const err = error as Error;
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
      return { url: '', path: '', error: err };
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  const remove = useCallback(async (bucket: StorageBucket, path: string) => {
    return { error: null }; // Mock deletion for now
  }, []);

  const getPublicUrl = useCallback((bucket: StorageBucket, path: string): string => {
    return path.startsWith('http') ? path : `${getApiUrl()}${path}`;
  }, []);

  const getSignedUrl = useCallback(async (bucket: StorageBucket, path: string, expiresIn?: number) => {
    return path.startsWith('http') ? path : `${getApiUrl()}${path}`;
  }, []);

  const listFiles = useCallback(async (bucket: StorageBucket, folder?: string) => {
    return []; // Mock list files
  }, []);

  return { upload, remove, getPublicUrl, getSignedUrl, listFiles, isUploading, uploadProgress };
}

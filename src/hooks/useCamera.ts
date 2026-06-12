"use client";

import { useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

interface CameraState {
  isSupported: boolean;
  photo: Photo | null;
  error: string | null;
  isLoading: boolean;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isSupported: Capacitor.isNativePlatform(),
    photo: null,
    error: null,
    isLoading: false,
  });

  const takePhoto = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, error: 'Camera only works on native devices' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera === 'prompt' || permissions.camera === 'prompt-with-rationale') {
        const result = await Camera.requestPermissions({ permissions: ['camera'] });
        if (result.camera !== 'granted') {
          setState(prev => ({ ...prev, isLoading: false, error: 'Camera permission denied' }));
          return null;
        }
      } else if (permissions.camera !== 'granted') {
        setState(prev => ({ ...prev, isLoading: false, error: 'Camera permission denied' }));
        return null;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      setState(prev => ({ ...prev, photo, isLoading: false, error: null }));
      return photo;
    } catch (error) {
      console.error('Camera error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to take photo' 
      }));
      return null;
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, error: 'Gallery only works on native devices' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permissions = await Camera.checkPermissions();
      
      if (permissions.photos === 'prompt' || permissions.photos === 'prompt-with-rationale') {
        const result = await Camera.requestPermissions({ permissions: ['photos'] });
        if (result.photos !== 'granted' && result.photos !== 'limited') {
          setState(prev => ({ ...prev, isLoading: false, error: 'Photo library permission denied' }));
          return null;
        }
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      setState(prev => ({ ...prev, photo, isLoading: false, error: null }));
      return photo;
    } catch (error) {
      console.error('Gallery error:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to pick photo' 
      }));
      return null;
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setState(prev => ({ ...prev, photo: null, error: null }));
  }, []);

  return {
    ...state,
    takePhoto,
    pickFromGallery,
    clearPhoto,
  };
};

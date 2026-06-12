"use client";

import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const useHaptics = () => {
  const isSupported = Capacitor.isNativePlatform();

  const impact = useCallback(async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isSupported) return;
    
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Haptic impact error:', error);
    }
  }, [isSupported]);

  const notification = useCallback(async (type: NotificationType = NotificationType.Success) => {
    if (!isSupported) return;
    
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.error('Haptic notification error:', error);
    }
  }, [isSupported]);

  const vibrate = useCallback(async (duration: number = 300) => {
    if (!isSupported) return;
    
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Haptic vibrate error:', error);
    }
  }, [isSupported]);

  const selectionStart = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.error('Haptic selection start error:', error);
    }
  }, [isSupported]);

  const selectionChanged = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error('Haptic selection changed error:', error);
    }
  }, [isSupported]);

  const selectionEnd = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('Haptic selection end error:', error);
    }
  }, [isSupported]);

  // Convenience methods
  const lightImpact = useCallback(() => impact(ImpactStyle.Light), [impact]);
  const mediumImpact = useCallback(() => impact(ImpactStyle.Medium), [impact]);
  const heavyImpact = useCallback(() => impact(ImpactStyle.Heavy), [impact]);

  const successNotification = useCallback(() => notification(NotificationType.Success), [notification]);
  const warningNotification = useCallback(() => notification(NotificationType.Warning), [notification]);
  const errorNotification = useCallback(() => notification(NotificationType.Error), [notification]);

  return {
    isSupported,
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    // Convenience methods
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    warningNotification,
    errorNotification,
  };
};

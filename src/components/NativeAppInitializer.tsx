'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Dialog } from '@capacitor/dialog';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function NativeAppInitializer() {
  useEffect(() => {
    const initNativeFeatures = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Style status bar for dark mode or primary theme
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' }); // Assuming a dark theme base
      } catch (e) {
        console.log('StatusBar configuration not supported', e);
      }

      // Override window.alert to use native Dialog
      window.alert = async (message: string) => {
        await Dialog.alert({
          title: 'Alert',
          message,
        });
      };

      // Override window.confirm to use native Dialog
      window.confirm = (message: string): any => {
        // Note: window.confirm is synchronous in standard DOM, but Capacitor Dialog is async.
        // We can't perfectly polyfill it synchronously. 
        // Best approach for Next.js is to avoid window.confirm and use a custom UI or this async wrapper if accepted
        console.warn('window.confirm cannot be fully polyfilled synchronously. Consider using Dialog.confirm directly.');
        return false;
      };

      // Add global click listener for generic button haptic feedback
      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isClickable = 
          target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.closest('button') || 
          target.closest('a');

        if (isClickable) {
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
      };

      document.addEventListener('click', handleGlobalClick);

      return () => {
        document.removeEventListener('click', handleGlobalClick);
      };
    };

    initNativeFeatures();
  }, []);

  return null;
}

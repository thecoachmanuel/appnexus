"use client";

import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isRegistered: false,
    token: null,
    error: null,
  });

  const isNativePlatform = Capacitor.isNativePlatform();

  const requestPermission = useCallback(async () => {
    if (!isNativePlatform) {
      setState(prev => ({ ...prev, error: 'Push notifications only work on native devices' }));
      return false;
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          setState(prev => ({ ...prev, error: 'Push notification permission denied' }));
          return false;
        }
      } else if (permStatus.receive !== 'granted') {
        setState(prev => ({ ...prev, error: 'Push notification permission denied' }));
        return false;
      }

      await PushNotifications.register();
      return true;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      setState(prev => ({ ...prev, error: 'Failed to request push permissions' }));
      return false;
    }
  }, [isNativePlatform]);

  useEffect(() => {
    if (!isNativePlatform) {
      setState(prev => ({ ...prev, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isSupported: true }));

    // Registration success handler
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      setState(prev => ({
        ...prev,
        isRegistered: true,
        token: token.value,
        error: null,
      }));
    });

    // Registration error handler
    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({
        ...prev,
        isRegistered: false,
        error: error.error || 'Registration failed',
      }));
    });

    // Notification received while app is in foreground
    const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
    });

    // Notification action performed (user tapped notification)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
    });

    return () => {
      registrationListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNativePlatform]);

  return {
    ...state,
    requestPermission,
  };
};

"use client";

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  BiometricAuth, 
  BiometryType, 
  CheckBiometryResult 
} from '@aparajita/capacitor-biometric-auth';

interface BiometricState {
  isSupported: boolean;
  isAvailable: boolean;
  biometryType: BiometryType;
  error: string | null;
  isAuthenticating: boolean;
}

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricState>({
    isSupported: Capacitor.isNativePlatform(),
    isAvailable: false,
    biometryType: BiometryType.none,
    error: null,
    isAuthenticating: false,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const checkBiometry = async () => {
      try {
        const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
        setState(prev => ({
          ...prev,
          isAvailable: result.isAvailable,
          biometryType: result.biometryType,
        }));
      } catch (error) {
        console.error('Biometry check error:', error);
        setState(prev => ({
          ...prev,
          isAvailable: false,
          error: 'Failed to check biometric availability',
        }));
      }
    };

    checkBiometry();
  }, []);

  const authenticate = useCallback(async (reason?: string) => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, error: 'Biometric auth only works on native devices' }));
      return false;
    }

    if (!state.isAvailable) {
      setState(prev => ({ ...prev, error: 'Biometric authentication not available' }));
      return false;
    }

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      await BiometricAuth.authenticate({
        reason: reason || 'Please authenticate to continue',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
      });

      setState(prev => ({ ...prev, isAuthenticating: false, error: null }));
      return true;
    } catch (error) {
      console.error('Biometric auth error:', error);
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
      return false;
    }
  }, [state.isAvailable]);

  const getBiometryTypeName = useCallback(() => {
    switch (state.biometryType) {
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.faceId:
        return 'Face ID';
      case BiometryType.fingerprintAuthentication:
        return 'Fingerprint';
      case BiometryType.faceAuthentication:
        return 'Face Recognition';
      case BiometryType.irisAuthentication:
        return 'Iris Scanner';
      default:
        return 'Biometric';
    }
  }, [state.biometryType]);

  return {
    ...state,
    authenticate,
    getBiometryTypeName,
  };
};

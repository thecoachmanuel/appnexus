"use client";

import { Bell, BellOff, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const PushNotificationSetup = () => {
  const { isSupported, isRegistered, token, error, requestPermission } = usePushNotifications();

  return (
    <div className="bg-secondary/30 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="font-display font-bold text-foreground">Push Notifications</h4>
          <p className="text-xs text-muted-foreground">
            {isSupported ? 'Available on this device' : 'Requires native app'}
          </p>
        </div>
      </div>

      {!isSupported ? (
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
          <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              Push notifications are only available when running as a native iOS or Android app. 
              Build and install the app on your device to enable this feature.
            </p>
          </div>
        </div>
      ) : isRegistered ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Push notifications enabled</span>
          </div>
          {token && (
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Device Token</p>
              <code className="text-xs text-foreground break-all">{token.slice(0, 40)}...</code>
            </div>
          )}
        </div>
      ) : error ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={requestPermission}>
            <Bell className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={requestPermission}>
          <Bell className="w-4 h-4 mr-2" />
          Enable Push Notifications
        </Button>
      )}
    </div>
  );
};

export default PushNotificationSetup;

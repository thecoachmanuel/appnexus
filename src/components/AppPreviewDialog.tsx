"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, RotateCcw, ExternalLink, TabletSmartphone, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteUrl: string;
  appName: string;
  primaryColor?: string;
}

type DeviceType = 'iphone' | 'android' | 'tablet';

const DEVICES = {
  iphone: { name: 'iPhone 15', width: 393, height: 852, frame: 'rounded-[44px]' },
  android: { name: 'Pixel 7', width: 412, height: 915, frame: 'rounded-[32px]' },
  tablet: { name: 'iPad', width: 820, height: 580, frame: 'rounded-[20px]' },
};

const AppPreviewDialog = ({ 
  open, 
  onOpenChange, 
  websiteUrl, 
  appName, 
}: AppPreviewDialogProps) => {
  const [device, setDevice] = useState<DeviceType>('android');
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentDevice = DEVICES[device];
  const scale = device === 'tablet' ? 0.7 : 0.5;
  const containerWidth = currentDevice.width * scale;
  const containerHeight = currentDevice.height * scale;

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    setKey(prev => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Smartphone className="w-5 h-5 text-accent" />
              {appName} - App Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Device Switcher */}
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={device === 'android' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setDevice('android'); setHasError(false); }}
                >
                  <Smartphone className="w-3 h-3 mr-1" />
                  Android
                </Button>
                <Button
                  variant={device === 'iphone' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setDevice('iphone'); setHasError(false); }}
                >
                  <Smartphone className="w-3 h-3 mr-1" />
                  iOS
                </Button>
                <Button
                  variant={device === 'tablet' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => { setDevice('tablet'); setHasError(false); }}
                >
                  <TabletSmartphone className="w-3 h-3 mr-1" />
                  Tablet
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center p-6">
          {/* Device Frame */}
          <div 
            className={`relative bg-gray-900 ${currentDevice.frame} p-2 shadow-2xl border-4 border-gray-800`}
            style={{ width: containerWidth + 16, height: containerHeight + 16 }}
          >
            {/* Screen */}
            <div 
              className={`bg-white ${currentDevice.frame} overflow-hidden relative`}
              style={{ width: containerWidth, height: containerHeight }}
            >
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading preview...</span>
                  </div>
                </div>
              )}
              
              {hasError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 p-4">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="w-10 h-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Preview Blocked</p>
                      <p className="text-xs text-muted-foreground max-w-[180px]">
                        This website doesn't allow iframe previews. Open it directly instead.
                      </p>
                    </div>
                    <Button 
                      variant="accent" 
                      size="sm" 
                      onClick={() => window.open(websiteUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open Website
                    </Button>
                  </div>
                </div>
              ) : (
                <iframe
                  key={`${device}-${key}`}
                  src={websiteUrl}
                  style={{
                    width: currentDevice.width,
                    height: currentDevice.height,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                  }}
                  frameBorder="0"
                  onLoad={handleLoad}
                  onError={handleError}
                  className="bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              )}
            </div>

            {/* Notch for iPhone */}
            {device === 'iphone' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-20" />
            )}
          </div>

          {/* Device Name */}
          <p className="text-sm text-muted-foreground mt-4">
            {currentDevice.name} Preview
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(websiteUrl, '_blank')}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Open Website
            </Button>
          </div>
          
          {/* Info text */}
          <p className="text-xs text-muted-foreground mt-3 text-center max-w-md">
            💡 This simulates how your app will look on mobile devices. The actual APK will display the website in a native WebView.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppPreviewDialog;

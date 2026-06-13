"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Smartphone, Tablet, Monitor, X, Loader2, Check, Plus, Camera, Link2, Link2Off } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { AppConfig } from "@/stores/useAppStore";

interface DevicePreset {
  id: string;
  name: string;
  type: "phone" | "tablet" | "desktop";
  width: number;
  height: number;
  scale: number;
  notch: boolean;
  dynamicIsland?: boolean;
  borderRadius: number;
}

interface DeviceComparisonModeProps {
  config: AppConfig;
  devicePresets: DevicePreset[];
  onClose: () => void;
}

const DeviceComparisonMode = ({ config, devicePresets, onClose }: DeviceComparisonModeProps) => {
  const comparisonGridRef = useRef<HTMLDivElement>(null);
  const [selectedDevices, setSelectedDevices] = useState<DevicePreset[]>([
    devicePresets.find(d => d.id === "iphone-15-pro") || devicePresets[0],
    devicePresets.find(d => d.id === "ipad-pro-11") || devicePresets[10],
    devicePresets.find(d => d.id === "desktop-1080p") || devicePresets[15],
  ]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSyncScrollEnabled, setIsSyncScrollEnabled] = useState(false);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const isSyncing = useRef(false);

  const handleCaptureAll = async () => {
    if (!comparisonGridRef.current) return;

    // Check if any devices are still loading
    const stillLoading = Object.values(loadingStates).some(loading => loading);
    if (stillLoading) {
      toast.error("Please wait for all previews to load before capturing");
      return;
    }

    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(comparisonGridRef.current, {
        backgroundColor: "#09090b", // Dark background
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: comparisonGridRef.current.scrollWidth,
        height: comparisonGridRef.current.scrollHeight,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const deviceNames = selectedDevices.map(d => d.id).join("-");
          link.download = `${config.appName || "app"}-comparison-${deviceNames}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Comparison screenshot saved!", {
            description: `Captured ${selectedDevices.length} device previews`,
          });
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot error:", error);
      toast.error("Failed to capture screenshot", {
        description: "Please try again",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Sync scroll handler using postMessage
  const handleSyncScroll = useCallback((sourceDeviceId: string, scrollPercentX: number, scrollPercentY: number) => {
    if (!isSyncScrollEnabled || isSyncing.current) return;
    
    isSyncing.current = true;
    
    selectedDevices.forEach((device) => {
      if (device.id !== sourceDeviceId) {
        const iframe = iframeRefs.current[device.id];
        if (iframe?.contentWindow) {
          try {
            iframe.contentWindow.postMessage({
              type: 'syncScroll',
              scrollPercentX,
              scrollPercentY
            }, '*');
          } catch (e) {
            // Cross-origin restriction, ignore
          }
        }
      }
    });
    
    setTimeout(() => {
      isSyncing.current = false;
    }, 50);
  }, [isSyncScrollEnabled, selectedDevices]);

  // Listen for scroll messages from iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'scrollUpdate' && isSyncScrollEnabled) {
        const { deviceId, scrollPercentX, scrollPercentY } = event.data;
        handleSyncScroll(deviceId, scrollPercentX, scrollPercentY);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleSyncScroll, isSyncScrollEnabled]);

  // Inject scroll listener into iframes when sync is enabled
  useEffect(() => {
    if (!isSyncScrollEnabled) return;

    const injectScrollListener = (iframe: HTMLIFrameElement, deviceId: string) => {
      try {
        const script = `
          if (!window.__syncScrollInitialized) {
            window.__syncScrollInitialized = true;
            window.addEventListener('scroll', function() {
              const scrollPercentX = window.scrollX / (document.documentElement.scrollWidth - window.innerWidth) || 0;
              const scrollPercentY = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) || 0;
              window.parent.postMessage({
                type: 'scrollUpdate',
                deviceId: '${deviceId}',
                scrollPercentX: scrollPercentX,
                scrollPercentY: scrollPercentY
              }, '*');
            });
            window.addEventListener('message', function(e) {
              if (e.data?.type === 'syncScroll') {
                const maxX = document.documentElement.scrollWidth - window.innerWidth;
                const maxY = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo(e.data.scrollPercentX * maxX, e.data.scrollPercentY * maxY);
              }
            });
          }
        `;
        
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'injectScript', script }, '*');
        }
      } catch (e) {
        // Cross-origin restriction
      }
    };

    // Try to inject into all loaded iframes
    selectedDevices.forEach((device) => {
      const iframe = iframeRefs.current[device.id];
      if (iframe && !loadingStates[device.id]) {
        injectScrollListener(iframe, device.id);
      }
    });
  }, [isSyncScrollEnabled, selectedDevices, loadingStates]);

  useEffect(() => {
    // Initialize loading states for all selected devices
    const initialLoadingStates: Record<string, boolean> = {};
    selectedDevices.forEach(device => {
      initialLoadingStates[device.id] = true;
    });
    setLoadingStates(initialLoadingStates);
  }, []);

  const handleIframeLoad = (deviceId: string) => {
    setLoadingStates(prev => ({ ...prev, [deviceId]: false }));
  };

  const toggleDevice = (device: DevicePreset) => {
    const isSelected = selectedDevices.some(d => d.id === device.id);
    if (isSelected) {
      if (selectedDevices.length > 1) {
        setSelectedDevices(prev => prev.filter(d => d.id !== device.id));
      }
    } else {
      if (selectedDevices.length < 4) {
        setSelectedDevices(prev => [...prev, device]);
        setLoadingStates(prev => ({ ...prev, [device.id]: true }));
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "phone": return <Smartphone className="w-3 h-3" />;
      case "tablet": return <Tablet className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;
    }
  };

  // Calculate responsive scale based on number of devices
  const getComparisonScale = (device: DevicePreset) => {
    const baseScale = selectedDevices.length <= 2 ? 0.35 : selectedDevices.length === 3 ? 0.28 : 0.22;
    return device.type === "desktop" ? baseScale * 0.6 : baseScale;
  };

  const phoneDevices = devicePresets.filter(d => d.type === "phone");
  const tabletDevices = devicePresets.filter(d => d.type === "tablet");
  const desktopDevices = devicePresets.filter(d => d.type === "desktop");

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="font-display font-bold text-lg">Device Comparison</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedDevices.length}/4 devices selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDevicePicker(!showDevicePicker)}
              className="h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              {showDevicePicker ? "Hide" : "Add"} Devices
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={isSyncScrollEnabled ? "default" : "outline"}
            size="sm" 
            onClick={() => {
              setIsSyncScrollEnabled(!isSyncScrollEnabled);
              toast.success(isSyncScrollEnabled ? "Sync scroll disabled" : "Sync scroll enabled", {
                description: isSyncScrollEnabled ? "Devices scroll independently" : "Scrolling syncs across all devices"
              });
            }}
            className={isSyncScrollEnabled ? "bg-primary text-primary-foreground" : ""}
          >
            {isSyncScrollEnabled ? (
              <Link2 className="w-4 h-4 mr-1" />
            ) : (
              <Link2Off className="w-4 h-4 mr-1" />
            )}
            {isSyncScrollEnabled ? "Sync On" : "Sync Off"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCaptureAll}
            disabled={isCapturing || Object.values(loadingStates).some(l => l)}
          >
            {isCapturing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-1" />
            )}
            {isCapturing ? "Capturing..." : "Screenshot All"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </div>

      {/* Device Picker Panel */}
      {showDevicePicker && (
        <div className="border-b border-border bg-secondary/30 p-4">
          <div className="flex gap-8 max-w-6xl mx-auto">
            {/* Phones */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Phones
              </h4>
              <div className="space-y-1">
                {phoneDevices.map(device => (
                  <label
                    key={device.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedDevices.some(d => d.id === device.id)}
                      onCheckedChange={() => toggleDevice(device)}
                      disabled={!selectedDevices.some(d => d.id === device.id) && selectedDevices.length >= 4}
                    />
                    <span className="truncate">{device.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tablets */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Tablet className="w-3 h-3" /> Tablets
              </h4>
              <div className="space-y-1">
                {tabletDevices.map(device => (
                  <label
                    key={device.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedDevices.some(d => d.id === device.id)}
                      onCheckedChange={() => toggleDevice(device)}
                      disabled={!selectedDevices.some(d => d.id === device.id) && selectedDevices.length >= 4}
                    />
                    <span className="truncate">{device.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Desktops */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Monitor className="w-3 h-3" /> Desktop
              </h4>
              <div className="space-y-1">
                {desktopDevices.map(device => (
                  <label
                    key={device.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-background/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={selectedDevices.some(d => d.id === device.id)}
                      onCheckedChange={() => toggleDevice(device)}
                      disabled={!selectedDevices.some(d => d.id === device.id) && selectedDevices.length >= 4}
                    />
                    <span className="truncate">{device.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <ScrollArea className="flex-1">
        <div ref={comparisonGridRef} className="p-6 flex items-start justify-center gap-6 min-h-full bg-zinc-950">
          {selectedDevices.map((device) => {
            const scale = getComparisonScale(device);
            const frameWidth = device.width * scale;
            const frameHeight = device.height * scale;
            const borderRadius = device.borderRadius * scale;

            return (
              <div key={device.id} className="flex flex-col items-center gap-3">
                {/* Device Label */}
                <div className="flex items-center gap-2 text-sm">
                  {getDeviceIcon(device.type)}
                  <span className="font-medium">{device.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {device.width}×{device.height}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => toggleDevice(device)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Device Frame */}
                <div
                  className="bg-gradient-to-b from-gray-800 to-gray-900 p-1.5 shadow-2xl transition-all duration-300"
                  style={{
                    width: frameWidth + 12,
                    height: frameHeight + 12,
                    borderRadius: borderRadius + 6,
                  }}
                >
                  <div
                    className="w-full h-full bg-background overflow-hidden relative"
                    style={{ borderRadius }}
                  >
                    {/* Dynamic Island */}
                    {device.dynamicIsland && (
                      <div
                        className="absolute top-1 left-1/2 -translate-x-1/2 bg-gray-900 rounded-full z-20"
                        style={{ width: 24 * scale * 3, height: 6 * scale * 3 }}
                      />
                    )}

                    {/* Notch */}
                    {device.notch && device.type === "phone" && !device.dynamicIsland && (
                      <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 rounded-b-lg z-20"
                        style={{ width: 32 * scale * 3, height: 7 * scale * 3 }}
                      />
                    )}

                    {/* Status Bar (mobile) */}
                    {device.type !== "desktop" && (
                      <div
                        className="flex items-center justify-between px-2 relative z-10"
                        style={{
                          backgroundColor: config.primaryColor,
                          height: Math.max(12, 6 * scale * 3),
                        }}
                      >
                        <span className="text-white" style={{ fontSize: Math.max(6, 8 * scale) }}>9:41</span>
                        <span className="text-white" style={{ fontSize: Math.max(6, 8 * scale) }}>●●●●</span>
                      </div>
                    )}

                    {/* App Header (mobile) */}
                    {device.type !== "desktop" && (
                      <div
                        className="px-2 py-0.5 relative z-10"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <h3
                          className="font-bold text-white truncate"
                          style={{ fontSize: Math.max(8, 10 * scale) }}
                        >
                          {config.appName || "AppNexus"}
                        </h3>
                      </div>
                    )}

                    {/* Loading State */}
                    {loadingStates[device.id] && (
                      <div className="absolute inset-0 bg-background/80 z-30 flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      </div>
                    )}

                    {/* Iframe */}
                    <div
                      className="relative"
                      style={{
                        height: device.type === "desktop" ? "100%" : `calc(100% - ${Math.max(20, 18 * scale * 3)}px)`,
                      }}
                    >
                      {config.websiteUrl && (
                        <iframe
                          ref={(el) => { iframeRefs.current[device.id] = el; }}
                          src={config.websiteUrl}
                          className="w-full h-full border-0"
                          onLoad={() => handleIframeLoad(device.id)}
                          title={`Preview on ${device.name}`}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "top left",
                            width: `${100 / scale}%`,
                            height: `${100 / scale}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Compare how your app looks across different devices
        </p>
        <Button variant="hero" size="sm" onClick={onClose}>
          <Check className="w-4 h-4 mr-1" />
          Done
        </Button>
      </div>
    </div>
  );
};

export default DeviceComparisonMode;

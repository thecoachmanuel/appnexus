"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, RotateCcw, ExternalLink, Play, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AppetizePreviewProps {
  publicKey: string;
  appName: string;
  primaryColor?: string;
  platform?: "android" | "ios";
  websiteUrl?: string;
}

const EMBED_TIMEOUT_MS = 12000;

const AppetizePreview = ({ publicKey, appName, primaryColor, platform = "android", websiteUrl }: AppetizePreviewProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const device = platform === "ios" ? "iphone15pro" : "pixel7";
  const fullUrl = `https://appetize.io/app/${publicKey}`;

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setEmbedError(true);
        setIsLoading(false);
      }
    }, EMBED_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [key]);

  const handleRefresh = () => {
    setIsLoading(true);
    setEmbedError(false);
    setKey(prev => prev + 1);
  };

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin?.includes("appetize.io")) {
        if (typeof event.data === "object" && event.data?.type) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setEmbedError(false);
        }
        if (
          typeof event.data === "string" &&
          (event.data.includes("embed") || event.data.includes("not enabled"))
        ) {
          setEmbedError(true);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Website preview fallback — shows a static mockup when embeds aren't available
  const WebsiteMockup = ({ compact = false }: { compact?: boolean }) => (
    <div className="absolute inset-0 flex flex-col z-20 rounded-2xl overflow-hidden bg-black">
      {/* Status bar mockup */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/90 text-white/80 shrink-0" style={{ fontSize: 10 }}>
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 border border-white/60 rounded-[2px] relative">
            <div className="absolute inset-[1px] right-[2px] bg-green-400 rounded-[1px]" />
          </div>
        </div>
      </div>
      {/* URL bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 border-b border-white/5 shrink-0">
        <Globe className="w-3 h-3 text-white/40 shrink-0" />
        <div className="flex-1 bg-zinc-800 rounded-md px-2 py-0.5 text-[10px] text-white/50 truncate font-mono">
          {websiteUrl || 'https://example.com'}
        </div>
      </div>
      {/* Preview unavailable message */}
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 px-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-white/40" />
        </div>
        <p className="text-sm text-white/60 font-medium">Preview Unavailable</p>
        <p className="text-xs text-white/40 max-w-[200px]">
          The live emulator requires an Appetize.io configuration. Open externally to test.
        </p>
      </div>
      {/* Bottom action bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 bg-black/90 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={() => window.open(fullUrl, '_blank')}
          className="gap-1.5 rounded-xl shadow-md hover:shadow-lg transition-shadow text-xs h-7"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Appetize
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Card that opens the modal */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${primaryColor || '#10b981'}, ${primaryColor ? primaryColor + 'cc' : '#059669'})` }}
        >
          <Play className="w-8 h-8 text-white" />
        </div>
        <h4 className="font-display font-bold text-foreground mb-2">Live Preview</h4>
        <p className="text-sm text-muted-foreground mb-1">
          Test your {platform === "ios" ? "iOS" : "Android"} app in the browser
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          No {platform === "ios" ? "Mac or iPhone" : "device"} needed
        </p>

        <Button onClick={() => setIsExpanded(true)} className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <Smartphone className="w-4 h-4" />
          Open Live Preview
        </Button>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-[420px] sm:max-w-lg md:max-w-2xl p-0 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
          <DialogHeader className="p-3 sm:p-4 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                {appName} - {platform === "ios" ? "iOS" : "Android"} Preview
              </DialogTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-xs sm:text-sm">
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Restart</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(fullUrl, '_blank')} className="text-xs sm:text-sm">
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Open in Appetize</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-3 sm:p-4 overflow-auto">
            <div className="relative rounded-[36px] sm:rounded-[44px] bg-gradient-to-b from-zinc-600 to-zinc-900 p-[4px] sm:p-[5px] shadow-2xl ring-1 ring-white/10" style={{ maxHeight: '100%' }}>
              {/* Notch */}
              <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-[6px] sm:h-[7px] rounded-full bg-black/90 z-30" />
              <div className="relative bg-black rounded-[32px] sm:rounded-[40px] overflow-hidden" style={{ width: 'min(320px, 70vw)', height: 'min(640px, calc(70vh - 60px))' }}>
                {embedError && <WebsiteMockup />}
                <iframe
                  key={`fullscreen-${key}`}
                  src={`https://appetize.io/embed/${publicKey}?device=${device}&scale=auto&autoplay=true&orientation=portrait&deviceColor=black&screenOnly=true`}
                  frameBorder="0"
                  scrolling="no"
                  onLoad={handleIframeLoad}
                  onError={() => setEmbedError(true)}
                  className="w-full h-full"
                  allow="cross-origin-isolated"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppetizePreview;

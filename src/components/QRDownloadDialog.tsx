"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface QRDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadUrl: string;
  appName: string;
}

const QRDownloadDialog = ({ open, onOpenChange, downloadUrl, appName }: QRDownloadDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Download link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-accent" />
            Download {appName}
          </DialogTitle>
          <DialogDescription>
            Scan the QR code with your phone to download the app, or use the link below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <QRCodeSVG
              value={downloadUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">📱 Open your phone camera and point it at the QR code</p>
            <p>The download will start automatically</p>
          </div>

          {/* Download Link */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={downloadUrl}
                readOnly
                className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border truncate"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Direct Download */}
            <Button variant="accent" className="w-full" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download APK
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRDownloadDialog;

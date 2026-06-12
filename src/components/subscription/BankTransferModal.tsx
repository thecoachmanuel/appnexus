"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Copy, Check, Upload, Loader2 } from "lucide-react";
import { bankTransferApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface BankTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "subscription" | "credits";
  itemId: string;
  itemName: string;
  amount: number;
}

const getBankDetails = (appName: string) => ({
  bankName: "Example Bank",
  accountName: `${appName} Inc.`,
  accountNumber: "1234567890",
  routingNumber: "021000021",
  swiftCode: "EXAMUS33",
  reference: `${appName.toUpperCase().replace(/\s+/g, '')}-`,
});

export const BankTransferModal = ({
  open,
  onOpenChange,
  type,
  itemId,
  itemName,
  amount,
}: BankTransferModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  const BANK_DETAILS = getBankDetails(settings.app_name);
  const reference = `${BANK_DETAILS.reference}${user?.id?.slice(0, 8).toUpperCase()}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await bankTransferApi.create({
        amount,
        currency: "USD",
        [type === "subscription" ? "plan_id" : "credit_pack_id"]: itemId,
        proof_of_payment_url: proofUrl || undefined,
      });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "We'll verify your payment and activate your account within 24-48 hours.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting bank transfer:", error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const BankField = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm text-foreground">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => copyToClipboard(value, field)}
      >
        {copied === field ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Bank Transfer Payment
          </DialogTitle>
          <DialogDescription>
            Transfer ${amount} USD for {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-foreground">
              Please transfer exactly <strong>${amount} USD</strong> to the account below
              and include the reference number.
            </p>
          </div>

          <div className="space-y-2">
            <BankField label="Bank Name" value={BANK_DETAILS.bankName} field="bank" />
            <BankField label="Account Name" value={BANK_DETAILS.accountName} field="name" />
            <BankField label="Account Number" value={BANK_DETAILS.accountNumber} field="account" />
            <BankField label="Routing Number" value={BANK_DETAILS.routingNumber} field="routing" />
            <BankField label="SWIFT Code" value={BANK_DETAILS.swiftCode} field="swift" />
            <BankField label="Reference (Required)" value={reference} field="reference" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Proof of Payment URL (Optional)</Label>
            <Input
              id="proof"
              placeholder="https://..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Upload your payment confirmation to any file hosting service and paste the link here.
            </p>
          </div>

          <Button
            className="w-full"
            variant="hero"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                I've Made the Transfer
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Processing time: 24-48 hours after payment verification
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

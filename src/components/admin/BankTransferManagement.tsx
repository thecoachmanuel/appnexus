"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { 
  Building2, 
  Check, 
  X, 
  Eye, 
  RefreshCw, 
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle 
} from "lucide-react";

interface BankTransferRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string | null;
  credit_pack_id: string | null;
  proof_of_payment_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; display_name: string | null } | null;
  subscription_plans?: { name: string } | null;
  credit_packs?: { name: string; credits: number } | null;
}

interface BankTransferManagementProps {
  transfers: BankTransferRequest[];
  onRefresh: () => void;
  onApprove: (id: string, notes: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  loading?: boolean;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/10 text-red-500 border-red-500/20" },
} as const;

export const BankTransferManagement = ({
  transfers,
  onRefresh,
  onApprove,
  onReject,
  loading = false,
}: BankTransferManagementProps) => {
  const { toast } = useToast();
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransferRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!selectedTransfer || !actionType || actionType === "view") return;

    setProcessing(true);
    try {
      if (actionType === "approve") {
        await onApprove(selectedTransfer.id, adminNotes);
        toast({
          title: "Transfer Approved",
          description: "Credits have been added to the user's account.",
        });
      } else {
        await onReject(selectedTransfer.id, adminNotes);
        toast({
          title: "Transfer Rejected",
          description: "The user has been notified.",
        });
      }
      setSelectedTransfer(null);
      setActionType(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error processing transfer:", error);
      toast({
        title: "Error",
        description: "Failed to process the transfer request.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (transfer: BankTransferRequest, type: "approve" | "reject" | "view") => {
    setSelectedTransfer(transfer);
    setActionType(type);
    setAdminNotes(transfer.admin_notes || "");
  };

  const getItemName = (transfer: BankTransferRequest) => {
    if (transfer.subscription_plans?.name) return transfer.subscription_plans.name;
    if (transfer.credit_packs?.name) return `${transfer.credit_packs.name} (${transfer.credit_packs.credits} credits)`;
    return "Unknown item";
  };

  const pendingCount = transfers.filter(t => t.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Bank Transfer Requests
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingCount} pending
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Review and process bank transfer payment requests
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bank transfer requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const status = statusConfig[transfer.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {transfer.profiles?.display_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transfer.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{getItemName(transfer)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">
                          ${transfer.amount.toFixed(2)} {transfer.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(transfer.createdAt || transfer.created_at || new Date()), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDialog(transfer, "view")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {transfer.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                onClick={() => openDialog(transfer, "approve")}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => openDialog(transfer, "reject")}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {actionType === "reject" && <XCircle className="w-5 h-5 text-red-500" />}
              {actionType === "view" && <Eye className="w-5 h-5 text-primary" />}
              {actionType === "approve" && "Approve Transfer"}
              {actionType === "reject" && "Reject Transfer"}
              {actionType === "view" && "Transfer Details"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "Approve this transfer and add credits to the user's account."}
              {actionType === "reject" && "Reject this transfer request with a reason."}
              {actionType === "view" && "View details of this bank transfer request."}
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTransfer.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium font-mono">
                    ${selectedTransfer.amount.toFixed(2)} {selectedTransfer.currency}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Item</p>
                  <p className="font-medium">{getItemName(selectedTransfer)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedTransfer.createdAt || selectedTransfer.created_at || new Date()), "PPP")}
                  </p>
                </div>
              </div>

              {selectedTransfer.proof_of_payment_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Proof of Payment</p>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTransfer.proof_of_payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Proof
                    </a>
                  </Button>
                </div>
              )}

              {actionType !== "view" && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Admin Notes {actionType === "reject" && "(required)"}
                  </p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      actionType === "approve"
                        ? "Optional notes about this approval..."
                        : "Reason for rejection..."
                    }
                    rows={3}
                  />
                </div>
              )}

              {actionType === "view" && selectedTransfer.admin_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedTransfer.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {actionType === "view" ? (
              <Button variant="outline" onClick={() => setSelectedTransfer(null)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSelectedTransfer(null)}>
                  Cancel
                </Button>
                <Button
                  variant={actionType === "approve" ? "default" : "destructive"}
                  onClick={handleAction}
                  disabled={processing || (actionType === "reject" && !adminNotes.trim())}
                >
                  {processing && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {!processing && actionType === "approve" && <Check className="w-4 h-4 mr-2" />}
                  {!processing && actionType === "reject" && <X className="w-4 h-4 mr-2" />}
                  {actionType === "approve" ? "Approve & Add Credits" : "Reject Request"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

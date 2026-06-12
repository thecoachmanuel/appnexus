"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransactionFormDialog } from "./TransactionFormDialog";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_type: string;
  created_at: string;
}

interface PaymentTrackingProps {
  transactions: Transaction[];
  stats: { totalRevenue: number; monthlyRevenue: number };
  onRefresh: () => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const PaymentTracking = ({ transactions, stats, onRefresh, loading }: PaymentTrackingProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-primary/10 text-primary";
      case "pending": return "bg-accent/10 text-accent";
      case "failed": return "bg-destructive/10 text-destructive";
      case "refunded": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCreate = async (data: Partial<Transaction>) => {
    const { error } = await supabase.from("payment_transactions").insert({
      user_id: data.user_id!, amount: data.amount!, currency: data.currency || "USD",
      payment_method: data.payment_method as any, status: data.status as any,
      transaction_type: data.transaction_type!,
    });
    if (error) { toast.error("Failed to create transaction: " + error.message); throw error; }
    toast.success("Transaction created"); onRefresh();
  };

  const handleUpdate = async (data: Partial<Transaction>) => {
    if (!editingTransaction) return;
    const { error } = await supabase.from("payment_transactions").update({
      amount: data.amount, currency: data.currency, payment_method: data.payment_method as any,
      status: data.status as any, transaction_type: data.transaction_type,
    }).eq("id", editingTransaction.id);
    if (error) { toast.error("Failed to update transaction: " + error.message); throw error; }
    toast.success("Transaction updated"); onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("payment_transactions").delete().eq("id", deleteId);
    if (error) toast.error("Failed to delete transaction: " + error.message);
    else { toast.success("Transaction deleted"); onRefresh(); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">All payment transactions across gateways</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={() => { setEditingTransaction(null); setFormOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by ID..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead>
                <TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No transactions found</TableCell></TableRow>
              ) : (
                paginatedTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-sm">{t.id.slice(0, 8)}...</TableCell>
                    <TableCell className="capitalize">{t.transaction_type}</TableCell>
                    <TableCell>${Number(t.amount).toFixed(2)} {t.currency}</TableCell>
                    <TableCell className="capitalize">{t.payment_method.replace("_", " ")}</TableCell>
                    <TableCell><Badge className={getStatusColor(t.status)}>{t.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(t.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingTransaction(t); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} transaction={editingTransaction} onSave={editingTransaction ? handleUpdate : handleCreate} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

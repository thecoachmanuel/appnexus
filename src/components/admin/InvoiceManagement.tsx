"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  RefreshCw,
  Plus,
  CheckCircle,
  Send,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  user_email?: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  due_date: string | null;
  paid_at: string | null;
  items: InvoiceItem[];
  notes: string | null;
  created_at: string;
}

interface InvoiceManagementProps {
  invoices: Invoice[];
  users: { id: string; email: string }[];
  onCreate: (invoice: Omit<Invoice, "id" | "created_at" | "paid_at">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<Invoice>) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

export const InvoiceManagement = ({
  invoices,
  users,
  onCreate,
  onUpdate,
  onRefresh,
  loading,
}: InvoiceManagementProps) => {
  const PAGE_SIZE = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };
  const [newInvoice, setNewInvoice] = useState({
    user_id: "",
    due_date: "",
    notes: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }] as InvoiceItem[],
  });

  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const date = format(new Date(), "yyyyMM");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}-${date}-${random}`;
  };

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: "", quantity: 1, unit_price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...newInvoice.items];
    items[index] = { ...items[index], [field]: value };
    setNewInvoice({ ...newInvoice, items });
  };

  const handleCreate = async () => {
    if (!newInvoice.user_id || newInvoice.items.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const success = await onCreate({
      invoice_number: generateInvoiceNumber(),
      user_id: newInvoice.user_id,
      amount: calculateTotal(newInvoice.items),
      currency: "USD",
      status: "draft",
      due_date: newInvoice.due_date || null,
      items: newInvoice.items,
      notes: newInvoice.notes || null,
    });

    if (success) {
      toast.success("Invoice created successfully");
      setIsCreateOpen(false);
      setNewInvoice({
        user_id: "",
        due_date: "",
        notes: "",
        items: [{ description: "", quantity: 1, unit_price: 0 }],
      });
    }
  };

  const handleStatusChange = async (invoice: Invoice, status: Invoice["status"]) => {
    const updates: Partial<Invoice> = { status };
    if (status === "paid") {
      updates.paid_at = new Date().toISOString();
    }
    const success = await onUpdate(invoice.id, updates);
    if (success) {
      toast.success(`Invoice ${status === "sent" ? "sent" : status}`);
    }
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-primary/10 text-primary";
      case "sent":
        return "bg-accent/10 text-accent";
      case "overdue":
        return "bg-destructive/10 text-destructive";
      case "cancelled":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedInvoices = filteredInvoices.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);


  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPending = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Total: <strong className="text-foreground">{invoices.length}</strong></span>
          <span>Paid: <strong className="text-primary">${totalPaid.toLocaleString()}</strong></span>
          <span>Pending: <strong className="text-accent">${totalPending.toLocaleString()}</strong></span>
          {totalOverdue > 0 && <span>Overdue: <strong className="text-destructive">${totalOverdue.toLocaleString()}</strong></span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select
                      value={newInvoice.user_id}
                      onValueChange={(value) => setNewInvoice({ ...newInvoice, user_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <Input
                          className="col-span-6"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        />
                        <Input
                          className="col-span-2"
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        />
                        <Input
                          className="col-span-3"
                          type="number"
                          placeholder="Price"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="col-span-1"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-lg font-semibold">
                    Total: ${calculateTotal(newInvoice.items).toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  />
                </div>

                <Button onClick={handleCreate} className="w-full">
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.user_email || invoice.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-semibold">
                      ${Number(invoice.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.due_date
                        ? format(new Date(invoice.due_date), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invoice.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(invoice, "sent")}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.status === "sent" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(invoice, "paid")}
                          >
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </Button>
                        )}
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
            totalItems={filteredInvoices.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewInvoice.user_email || viewInvoice.user_id}</p>
                </div>
                <Badge className={getStatusColor(viewInvoice.status)}>{viewInvoice.status}</Badge>
              </div>

              <div className="border rounded-lg divide-y">
                {viewInvoice.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ${item.unit_price}
                      </p>
                    </div>
                    <p className="font-medium">${(item.quantity * item.unit_price).toFixed(2)}</p>
                  </div>
                ))}
                <div className="p-3 flex justify-between bg-muted/50">
                  <p className="font-semibold">Total</p>
                  <p className="font-bold text-lg">${Number(viewInvoice.amount).toFixed(2)}</p>
                </div>
              </div>

              {viewInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{viewInvoice.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                {viewInvoice.status === "draft" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(viewInvoice, "sent");
                      setViewInvoice(null);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
                  </Button>
                )}
                {viewInvoice.status === "sent" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleStatusChange(viewInvoice, "paid");
                      setViewInvoice(null);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { format } from "date-fns";
import { userApi, Transaction, Invoice } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt,
  FileText,
  Download,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { PaginationControls } from "@/components/ui/pagination-controls";

const PAGE_SIZE = 10;

const PaymentHistory = () => {
  const { settings } = useSystemSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
    fetchInvoices();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await userApi.getTransactions();
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await userApi.getInvoices();
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      // Generate a simple invoice as downloadable content
      const invoiceContent = generateInvoiceContent(invoice);
      const blob = new Blob([invoiceContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the invoice.",
        variant: "destructive",
      });
    }
  };

  const generateInvoiceContent = (invoice: Invoice) => {
    const items = (invoice.items || []) as { description: string; quantity: number; unit_price: number }[];
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 40px; color: #1f2937; }
    h1 { color: #111827; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .invoice-details { text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; }
    .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 14px; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .notes { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>INVOICE</h1>
      <p><strong>${settings.app_name}</strong></p>
    </div>
    <div class="invoice-details">
      <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
      <p><strong>Date:</strong> ${format(new Date(invoice.createdAt || invoice.created_at || new Date()), "MMMM d, yyyy")}</p>
      ${invoice.due_date ? `<p><strong>Due Date:</strong> ${format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>` : ""}
      <p><span class="status ${invoice.status === "paid" ? "status-paid" : "status-pending"}">${invoice.status.toUpperCase()}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="total">
    Total: ${invoice.currency.toUpperCase()} $${invoice.amount.toFixed(2)}
  </div>

  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong><br>${invoice.notes}</div>` : ""}

  <div style="margin-top: 60px; text-align: center; color: #6b7280; font-size: 14px;">
    <p>Thank you for your business!</p>
    <p>${settings.app_name} - Build Mobile Apps from Any Website</p>
  </div>
</body>
</html>
    `;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return (
          <Badge variant="default" className="bg-accent/10 text-accent border-accent/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status === "paid" ? "Paid" : "Completed"}
          </Badge>
        );
      case "pending":
      case "sent":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {status === "sent" ? "Sent" : "Pending"}
          </Badge>
        );
      case "failed":
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {status === "cancelled" ? "Cancelled" : "Failed"}
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "stripe":
        return <CreditCard className="w-4 h-4" />;
      case "bank_transfer":
        return <Wallet className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const TransactionSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-20 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-24 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <DemoModeBanner />
          
          <PageHeader
            title="Payment History"
            description="View your transactions and download invoices"
          >
            <Button variant="outline" asChild>
              <Link href="/subscription">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Subscription
              </Link>
            </Button>
          </PageHeader>

          <Tabs defaultValue="transactions" className="mt-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="transactions" className="gap-2">
                <Receipt className="w-4 h-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <FileText className="w-4 h-4" />
                Invoices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-6">
              {loadingTransactions ? (
                <TransactionSkeleton />
              ) : transactions.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    No Transactions Yet
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your payment history will appear here after your first purchase.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions
                    .slice((txPage - 1) * PAGE_SIZE, txPage * PAGE_SIZE)
                    .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="glass-card rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          {getPaymentMethodIcon(transaction.payment_method)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {transaction.transaction_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date((transaction as any).createdAt || transaction.created_at || new Date()), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {transaction.currency.toUpperCase()} ${transaction.amount.toFixed(2)}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationControls
                currentPage={txPage}
                totalPages={Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))}
                totalItems={transactions.length}
                pageSize={PAGE_SIZE}
                onPageChange={setTxPage}
              />
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              {loadingInvoices ? (
                <TransactionSkeleton />
              ) : invoices.length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    No Invoices Yet
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Your invoices will appear here after your first purchase.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices
                    .slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE)
                    .map((invoice) => (
                    <div
                      key={invoice.id}
                      className="glass-card rounded-xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Invoice #{invoice.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(invoice.createdAt || invoice.created_at || new Date()), "MMM d, yyyy")}
                            {invoice.due_date && (
                              <span> · Due {format(new Date(invoice.due_date), "MMM d, yyyy")}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {invoice.currency.toUpperCase()} ${invoice.amount.toFixed(2)}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => downloadInvoice(invoice)}
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <PaginationControls
                currentPage={invPage}
                totalPages={Math.max(1, Math.ceil(invoices.length / PAGE_SIZE))}
                totalItems={invoices.length}
                pageSize={PAGE_SIZE}
                onPageChange={setInvPage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default PaymentHistory;

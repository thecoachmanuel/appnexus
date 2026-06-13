"use client";

import { useState, useEffect, useCallback } from "react";
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RefreshCw, Eye, Trash2, Clock, AlertCircle, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface WebhookLog {
  id: string;
  gateway: string;
  event_type: string;
  event_id: string | null;
  status: string;
  payload: any;
  response_status: number | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, string> = {
  processed: "bg-primary/10 text-primary",
  received: "bg-accent/10 text-accent",
  failed: "bg-destructive/10 text-destructive",
};

const GATEWAY_COLORS: Record<string, string> = {
  stripe: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  paypal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  coinbase: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export const WebhookEventLogs = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await apiClient
      .from("webhook_event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast.error("Failed to load webhook logs");
      console.error(error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      search === "" ||
      l.event_type.toLowerCase().includes(search.toLowerCase()) ||
      l.event_id?.toLowerCase().includes(search.toLowerCase()) ||
      l.error_message?.toLowerCase().includes(search.toLowerCase());
    const matchesGateway = gatewayFilter === "all" || l.gateway === gatewayFilter;
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesGateway && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleGatewayFilter = (value: string) => { setGatewayFilter(value); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };

  const handleRetry = async (log: WebhookLog) => {
    setRetrying(log.id);
    try {
      const { data, error } = await apiClient.functions.invoke("retry-webhook", {
        body: { webhook_log_id: log.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Webhook replayed successfully");
      } else {
        toast.error(`Retry returned status ${data?.response_status}`);
      }
      await fetchLogs();
    } catch (err: any) {
      toast.error(err.message || "Failed to retry webhook");
    } finally {
      setRetrying(null);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Delete all webhook event logs? This cannot be undone.")) return;
    const { error } = await apiClient.from("webhook_event_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Failed to clear logs");
    } else {
      toast.success("Webhook logs cleared");
      setLogs([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Webhook Event Logs</h3>
          <p className="text-sm text-muted-foreground">Debug incoming webhook deliveries from payment gateways</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearLogs} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search event type, ID, error..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={gatewayFilter} onValueChange={handleGatewayFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Gateway" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gateway</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                      <p>No webhook events logged yet</p>
                      <p className="text-xs">Events will appear here when your payment gateways send webhooks</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((log) => (
                  <TableRow key={log.id} className={log.status === "failed" ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <Badge variant="outline" className={GATEWAY_COLORS[log.gateway] || ""}>
                        {log.gateway}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">{log.event_type}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[log.status] || "bg-muted text-muted-foreground"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.response_status && (
                        <span className={`text-sm font-mono ${log.response_status >= 400 ? "text-destructive" : "text-primary"}`}>
                          {log.response_status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.processing_time_ms != null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.processing_time_ms}ms
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt || log.created_at || new Date()), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                      {log.status === "failed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRetry(log)}
                          disabled={retrying === log.id}
                          title="Retry webhook"
                        >
                          <RotateCcw className={`w-4 h-4 ${retrying === log.id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Webhook Event Detail</span>
              {selectedLog && (
                <Badge variant="outline" className={GATEWAY_COLORS[selectedLog.gateway] || ""}>
                  {selectedLog.gateway}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Event Type</p>
                  <p className="font-mono text-sm">{selectedLog.event_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Event ID</p>
                  <p className="font-mono text-sm">{selectedLog.event_id || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <Badge className={STATUS_COLORS[selectedLog.status] || ""}>{selectedLog.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Response Status</p>
                  <p className="font-mono">{selectedLog.response_status ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Processing Time</p>
                  <p>{selectedLog.processing_time_ms != null ? `${selectedLog.processing_time_ms}ms` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Received At</p>
                  <p>{format(new Date(selectedLog.createdAt || selectedLog.created_at || new Date()), "MMM d, yyyy HH:mm:ss")}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Error Message</p>
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-mono">
                    {selectedLog.error_message}
                  </div>
                </div>
              )}

              {selectedLog.status === "failed" && (
                <Button
                  onClick={() => handleRetry(selectedLog)}
                  disabled={retrying === selectedLog.id}
                  className="w-full"
                >
                  <RotateCcw className={`w-4 h-4 mr-2 ${retrying === selectedLog.id ? "animate-spin" : ""}`} />
                  {retrying === selectedLog.id ? "Retrying..." : "Retry This Webhook"}
                </Button>
              )}

              <div>
                <p className="text-muted-foreground text-xs mb-1">Payload</p>
                <ScrollArea className="h-[200px]">
                  <pre className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search, RefreshCw, Hammer, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Build {
  id: string;
  app_name: string;
  website_url?: string;
  status: string;
  progress?: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

interface BuildMonitoringProps {
  builds: Build[];
  activeBuilds: number;
  onRefresh: () => void;
  loading?: boolean;
}

const PAGE_SIZE = 10;

export const BuildMonitoring = ({ builds, activeBuilds, onRefresh, loading }: BuildMonitoringProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filteredBuilds = builds.filter((b) => {
    const matchesSearch =
      b.app_name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.website_url?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBuilds = filteredBuilds.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleStatusFilter = (value: string) => { setStatusFilter(value); setPage(1); };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle className="w-4 h-4 text-primary" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      case "building": return <Hammer className="w-4 h-4 text-accent animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "bg-primary/10 text-primary";
      case "failed": return "bg-destructive/10 text-destructive";
      case "building": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const statusCounts = builds.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Build Monitoring</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track all app builds and their status</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Builds", value: activeBuilds, color: "text-primary" },
          { label: "Completed", value: statusCounts["complete"] || 0, color: "text-primary" },
          { label: "Failed", value: statusCounts["failed"] || 0, color: "text-destructive" },
          { label: "Pending", value: statusCounts["pending"] || 0, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8 w-12" /> : <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search builds..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Name</TableHead><TableHead>Website</TableHead><TableHead>Status</TableHead>
                <TableHead>Progress</TableHead><TableHead>Started</TableHead><TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-2 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredBuilds.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No builds found</TableCell></TableRow>
              ) : (
                paginatedBuilds.map((build) => (
                  <TableRow key={build.id}>
                    <TableCell className="font-medium">{build.app_name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{build.website_url}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(build.status)}
                        <Badge className={getStatusColor(build.status)}>{build.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={build.progress ?? 0} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground">{build.progress ?? 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(build.created_at), "MMM d, HH:mm")}</TableCell>
                    <TableCell className="text-muted-foreground">{build.updated_at ? format(new Date(build.updated_at), "MMM d, HH:mm") : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredBuilds.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

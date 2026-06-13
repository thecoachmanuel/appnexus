"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription_tier?: string | null;
  total_credits?: number;
  projects_count?: number;
}

interface UserManagementProps {
  users: User[];
  onRefresh: () => void;
  loading?: boolean;
  isDemo?: boolean;
}

type AppRole = "admin" | "moderator" | "user";

const PAGE_SIZE = 10;

const roleConfig: Record<AppRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, color: "bg-destructive/15 text-destructive" },
  moderator: { label: "Moderator", icon: Shield, color: "bg-primary/15 text-primary" },
  user: { label: "User", icon: UserIcon, color: "bg-muted text-muted-foreground" },
};

export const UserManagement = ({ users, onRefresh, loading = false, isDemo = false }: UserManagementProps) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [userRoles, setUserRoles] = useState<Record<string, AppRole>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await apiClient.from("user_roles").select("user_id, role");
      if (!error && data) {
        const map: Record<string, AppRole> = {};
        data.forEach((r: any) => { map[r.user_id] = r.role as AppRole; });
        setUserRoles(map);
      }
    };
    fetchRoles();
  }, [users]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingRole(userId);
    try {
      const currentRole = userRoles[userId];
      if (currentRole) {
        const { error } = await apiClient
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await apiClient
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
      setUserRoles((prev) => ({ ...prev, [userId]: newRole }));
      toast.success(`Role updated to ${roleConfig[newRole].label}`);
    } catch (err: any) {
      toast.error("Failed to update role: " + (err.message || "Unknown error"));
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case "enterprise": return "bg-primary/10 text-primary";
      case "pro": return "bg-primary/15 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const SkeletonRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View and manage all registered users</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
            </div>
            <Badge variant="secondary" className="w-fit">
              {loading ? <Skeleton className="h-4 w-8" /> : `${filteredUsers.length} users`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : (
                paginatedUsers.map((user) => {
                  const role = userRoles[user.id] || "user";
                  const config = roleConfig[role];
                  const RoleIcon = config.icon;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{(user.display_name || user.email || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.display_name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={role}
                          onValueChange={(val) => handleRoleChange(user.id, val as AppRole)}
                          disabled={updatingRole === user.id || isDemo}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
                            <div className="flex items-center gap-1.5">
                              <RoleIcon className="w-3.5 h-3.5" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <UserIcon className="w-3.5 h-3.5" />User
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" />Moderator
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" />Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Badge className={getTierColor(user.subscription_tier ?? null)}>{user.subscription_tier || "free"}</Badge></TableCell>
                      <TableCell>{user.total_credits ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(user.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <PaginationControls
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

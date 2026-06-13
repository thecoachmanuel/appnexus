"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, RefreshCw, Shield, ShieldCheck, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "user";

interface UserWithRole {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole | null;
}

export const RoleManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    newRole: AppRole | "none";
    userName: string;
  } | null>(null);

  const fetchUsersWithRoles = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers();
      const data = response.data || [];
      const usersWithRoles = data.map((user: any) => ({
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        created_at: user.createdAt || user.created_at || new Date().toISOString(),
        role: (user.role as AppRole) || null,
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const handleRoleChange = (userId: string, newRole: AppRole | "none", userName: string) => {
    // Prevent self-demotion
    if (userId === currentUser?.id && newRole !== "admin") {
      toast.error("You cannot remove your own admin role");
      return;
    }

    setConfirmDialog({
      open: true,
      userId,
      newRole,
      userName,
    });
  };

  const confirmRoleChange = async () => {
    if (!confirmDialog) return;

    const { userId, newRole } = confirmDialog;
    setUpdating(userId);

    try {
      await adminApi.updateUserRole(userId, newRole === "none" ? null : newRole);
      toast.success(newRole === "none" ? "Role removed successfully" : `Role updated to ${newRole}`);
      await fetchUsersWithRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
      setConfirmDialog(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: AppRole | null) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-accent/10 text-accent border-accent/20">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Role Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Assign admin and moderator roles to users
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsersWithRoles} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-accent border-accent/20 text-xs sm:text-sm">
                {users.filter((u) => u.role === "admin").length} Admins
              </Badge>
              <Badge variant="outline" className="text-accent border-accent/20 text-xs sm:text-sm">
                {users.filter((u) => u.role === "moderator").length} Moderators
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {users.filter((u) => !u.role).length} Users
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name || user.email || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.display_name || "No name"}
                          {user.id === currentUser?.id && (
                            <span className="text-xs text-muted-foreground ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt || user.created_at || new Date()), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={user.role || "none"}
                      onValueChange={(value) =>
                        handleRoleChange(
                          user.id,
                          value as AppRole | "none",
                          user.display_name || user.email || "User"
                        )
                      }
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-32">
                        {updating === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDialog?.open}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change <strong>{confirmDialog?.userName}</strong>'s
              role to{" "}
              <strong>
                {confirmDialog?.newRole === "none" ? "User" : confirmDialog?.newRole}
              </strong>
              ?
              {confirmDialog?.newRole === "admin" && (
                <span className="block mt-2 text-muted-foreground">
                  ⚠️ Admins have full access to all system settings and user data.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { RefreshCw, Plus, Key, Activity, Settings2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ApiConfig {
  id: string;
  name: string;
  provider: string;
  api_key_masked: string | null;
  is_active: boolean;
  rate_limit?: number | null;
  usage_count?: number | null;
  last_used_at?: string | null;
  config: unknown;
  created_at: string;
}

interface ApiConfigurationProps {
  configs: ApiConfig[];
  onAdd: (config: Omit<ApiConfig, "id" | "created_at" | "usage_count" | "last_used_at">) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<ApiConfig>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

const providers = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google AI" },
  { value: "stripe", label: "Stripe" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "twilio", label: "Twilio" },
  { value: "appetize", label: "Appetize.io" },
  { value: "custom", label: "Custom" },
];

export const ApiConfiguration = ({
  configs,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  loading,
}: ApiConfigurationProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: "",
    provider: "",
    api_key: "",
    rate_limit: 1000,
  });

  const handleAdd = async () => {
    if (!newConfig.name || !newConfig.provider) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Store the actual API key in the config JSON for edge function access
    const configPayload: Record<string, unknown> = {};
    if (newConfig.api_key) {
      configPayload.api_key = newConfig.api_key;
    }

    const success = await onAdd({
      name: newConfig.name,
      provider: newConfig.provider,
      api_key_masked: newConfig.api_key ? `${"*".repeat(20)}${newConfig.api_key.slice(-4)}` : null,
      is_active: false,
      rate_limit: newConfig.rate_limit,
      config: configPayload,
    });

    if (success) {
      toast.success("API configuration added successfully");
      setIsAddOpen(false);
      setNewConfig({ name: "", provider: "", api_key: "", rate_limit: 1000 });
    }
  };

  const handleToggle = async (config: ApiConfig) => {
    const success = await onUpdate(config.id, { is_active: !config.is_active });
    if (success) {
      toast.success(`${config.name} ${!config.is_active ? "enabled" : "disabled"}`);
    }
  };

  const handleDelete = async (config: ApiConfig) => {
    if (confirm(`Are you sure you want to delete ${config.name}?`)) {
      const success = await onDelete(config.id);
      if (success) {
        toast.success("API configuration deleted");
      }
    }
  };

  const activeCount = configs.filter((c) => c.is_active).length;
  const totalUsage = configs.reduce((sum, c) => sum + (c.usage_count ?? 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">API Configuration</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage external API integrations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Production OpenAI"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={newConfig.provider}
                    onValueChange={(value) => setNewConfig({ ...newConfig, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter API key"
                    value={newConfig.api_key}
                    onChange={(e) => setNewConfig({ ...newConfig, api_key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate Limit (requests/hour)</Label>
                  <Input
                    type="number"
                    value={newConfig.rate_limit}
                    onChange={(e) => setNewConfig({ ...newConfig, rate_limit: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total APIs
            </CardTitle>
            <Key className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{configs.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active APIs
            </CardTitle>
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{activeCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usage
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-foreground">
                {totalUsage.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No API configurations found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell className="capitalize">{config.provider}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {config.api_key_masked || "Not set"}
                    </TableCell>
                    <TableCell>{(config.rate_limit ?? 0).toLocaleString()}/hr</TableCell>
                    <TableCell>{(config.usage_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {config.last_used_at
                        ? format(new Date(config.last_used_at), "MMM d, HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => handleToggle(config)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(config)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

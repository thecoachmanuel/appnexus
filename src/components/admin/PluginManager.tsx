"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Smartphone, CreditCard, Plug } from "lucide-react";
import { toast } from "sonner";

interface Plugin {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  config: unknown;
  is_active: boolean;
  version: string | null;
}

interface PluginManagerProps {
  plugins: Plugin[];
  onUpdate: (id: string, updates: Partial<Plugin>) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

export const PluginManager = ({ plugins, onUpdate, onRefresh, loading }: PluginManagerProps) => {
  const handleToggle = async (plugin: Plugin) => {
    const success = await onUpdate(plugin.id, { is_active: !plugin.is_active });
    if (success) {
      toast.success(`${plugin.name} ${!plugin.is_active ? "enabled" : "disabled"}`);
    } else {
      toast.error("Failed to update plugin");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "platform":
        return <Smartphone className="w-5 h-5" />;
      case "payment_gateway":
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Plug className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "platform":
        return "bg-primary/10 text-primary";
      case "payment_gateway":
        return "bg-primary/15 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const groupedPlugins = plugins.reduce(
    (acc, plugin) => {
      if (!acc[plugin.type]) acc[plugin.type] = [];
      acc[plugin.type].push(plugin);
      return acc;
    },
    {} as Record<string, Plugin[]>
  );

  const typeLabels: Record<string, string> = {
    platform: "Build Platforms",
    payment_gateway: "Payment Gateways",
    integration: "Integrations",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Plugin Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Enable or disable platforms and integrations</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        Object.entries(groupedPlugins).map(([type, typePlugins]) => (
          <div key={type} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {typeLabels[type] || type}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typePlugins.map((plugin) => (
                <Card key={plugin.id} className={!plugin.is_active ? "opacity-60" : ""}>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getTypeColor(plugin.type)}`}
                      >
                        {getTypeIcon(plugin.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          v{plugin.version ?? '1.0'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={plugin.is_active}
                      onCheckedChange={() => handleToggle(plugin)}
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {plugin.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

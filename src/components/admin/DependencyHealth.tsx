"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  Globe,
  Shield,
  Terminal,
} from "lucide-react";

// Build timestamp - updated at build time via Next.js
const BUILD_TIMESTAMP = new Date().toISOString();

// Core dependency versions (from package.json)
const dependencies = {
  core: [
    { name: "React", version: "18.3.1", category: "Framework" },
    { name: "Next.js", version: "14.2.3", category: "Framework" },
    { name: "MongoDB", version: "6.0.0", category: "Database" },
    { name: "Mongoose", version: "8.0.0", category: "ORM" },
  ],
  capacitor: [
    { name: "@capacitor/core", version: "8.0.1", category: "Core" },
    { name: "@capacitor/cli", version: "8.0.1", category: "CLI" },
    { name: "@capacitor/android", version: "8.0.1", category: "Platform" },
    { name: "@capacitor/ios", version: "8.0.1", category: "Platform" },
    { name: "@capacitor/camera", version: "8.0.0", category: "Plugin" },
    { name: "@capacitor/haptics", version: "8.0.0", category: "Plugin" },
    { name: "@capacitor/push-notifications", version: "8.0.0", category: "Plugin" },
  ],
  ui: [
    { name: "shadcn/ui (Radix)", version: "Latest", category: "Components" },
    { name: "Lucide React", version: "0.462.0", category: "Icons" },
    { name: "Framer Motion", version: "12.24.12", category: "Animation" },
    { name: "Recharts", version: "2.15.4", category: "Charts" },
  ],
  data: [

    { name: "@tanstack/react-query", version: "5.83.0", category: "State" },
    { name: "Zustand", version: "5.0.9", category: "State" },
    { name: "React Hook Form", version: "7.61.1", category: "Forms" },
    { name: "Zod", version: "3.25.76", category: "Validation" },
  ],
};

const upgradeChecklist = [
  {
    id: "backup",
    label: "Create a backup or commit current state",
    description: "Ensure you have a rollback point before making changes",
    icon: Shield,
    category: "Preparation",
  },
  {
    id: "audit",
    label: "Run npm audit to check for vulnerabilities",
    description: "npm audit --omit=dev --audit-level=high",
    icon: AlertTriangle,
    category: "Preparation",
  },
  {
    id: "update-deps",
    label: "Update dependencies (npm update or npm install)",
    description: "Review breaking changes in release notes first",
    icon: Package,
    category: "Update",
  },
  {
    id: "cap-sync",
    label: "Run npx cap sync after Capacitor updates",
    description: "Syncs web assets and plugins to native projects",
    icon: Smartphone,
    category: "Native",
  },
  {
    id: "cap-update",
    label: "Run npx cap update ios/android if needed",
    description: "Updates native platform dependencies",
    icon: Terminal,
    category: "Native",
  },
  {
    id: "test-build",
    label: "Run npm run build to verify production build",
    description: "Catch TypeScript and bundling errors early",
    icon: CheckCircle2,
    category: "Verification",
  },
  {
    id: "test-native",
    label: "Test on native devices/emulators",
    description: "Run npx cap run android/ios to verify native builds",
    icon: Smartphone,
    category: "Verification",
  },
  {
    id: "pwa-cache",
    label: "Bust PWA cache if service worker updated",
    description: "Clear browser cache or increment SW version",
    icon: Globe,
    category: "PWA",
  },
  {
    id: "deploy",
    label: "Deploy and verify in production",
    description: "Test critical user flows after deployment",
    icon: RefreshCw,
    category: "Deployment",
  },
];

export const DependencyHealth = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const resetChecklist = () => {
    setCheckedItems(new Set());
  };

  const progress = Math.round((checkedItems.size / upgradeChecklist.length) * 100);

  const groupedChecklist = upgradeChecklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof upgradeChecklist>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dependency Health</h2>
        <p className="text-muted-foreground mt-1">
          Monitor frontend versions and follow safe upgrade procedures
        </p>
      </div>

      {/* Build Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Build Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Build Timestamp</p>
              <p className="text-sm font-medium mt-1">
                {new Date(BUILD_TIMESTAMP).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Environment</p>
              <p className="text-sm font-medium mt-1">
                {process.env.MODE === "production" ? "Production" : "Development"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Node Target</p>
              <p className="text-sm font-medium mt-1">ES2020+ / Modern Browsers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Core Dependencies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Core Stack</CardTitle>
            </div>
            <CardDescription>Framework and build tooling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dependencies.core.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{dep.name}</span>
                  <Badge variant="secondary" className="text-xs">{dep.category}</Badge>
                </div>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{dep.version}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Capacitor Dependencies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-accent-foreground" />
              <CardTitle className="text-lg">Capacitor / Native</CardTitle>
            </div>
            <CardDescription>Mobile app and native plugins</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-2 pr-4">
                {dependencies.capacitor.map((dep) => (
                  <div key={dep.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate max-w-[160px]">{dep.name}</span>
                      <Badge variant="secondary" className="text-xs">{dep.category}</Badge>
                    </div>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">{dep.version}</code>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* UI Dependencies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-secondary-foreground" />
              <CardTitle className="text-lg">UI Libraries</CardTitle>
            </div>
            <CardDescription>Components, icons, and animations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dependencies.ui.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{dep.name}</span>
                  <Badge variant="secondary" className="text-xs">{dep.category}</Badge>
                </div>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{dep.version}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Dependencies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Data & State</CardTitle>
            </div>
            <CardDescription>Backend, state management, and forms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dependencies.data.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[160px]">{dep.name}</span>
                  <Badge variant="secondary" className="text-xs">{dep.category}</Badge>
                </div>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{dep.version}</code>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Safe Upgrade Checklist</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={progress === 100 ? "default" : "secondary"}>
                {progress}% Complete
              </Badge>
              <Button variant="outline" size="sm" onClick={resetChecklist}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
          <CardDescription>
            Follow these steps in order when upgrading dependencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedChecklist).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      checkedItems.has(item.id)
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={checkedItems.has(item.id)}
                      onCheckedChange={() => toggleCheck(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={item.id}
                        className={`text-sm font-medium cursor-pointer ${
                          checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {item.description}
                      </p>
                    </div>
                    <item.icon className={`w-4 h-4 shrink-0 ${
                      checkedItems.has(item.id) ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

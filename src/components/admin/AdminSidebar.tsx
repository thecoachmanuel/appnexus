"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Hammer,
  Settings,
  LayoutDashboard,
  Menu,
  Home,
  Coins,
  Plug,
  Banknote,
} from "lucide-react";
import Link from "next/link";

export type AdminSection =
  | "overview"
  | "users"
  | "payments"
  | "pricing"
  | "builds"
  | "integrations"
  | "settings";

const menuItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Payments", icon: Banknote },
  { id: "pricing", label: "Pricing", icon: Coins },
  { id: "builds", label: "Builds", icon: Hammer },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "settings", label: "Settings", icon: Settings },
];

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}


const SidebarContent = ({ 
  activeSection, 
  onSectionChange, 
  onClose 
}: AdminSidebarProps & { onClose?: () => void }) => {

  const renderItem = (item: { id: AdminSection; label: string; icon: React.ElementType }) => (
    <button
      key={item.id}
      onClick={() => {
        onSectionChange(item.id);
        onClose?.();
      }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        activeSection === item.id
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src="/favicon.png" 
            alt="Admin Logo" 
            className="w-8 h-8 rounded-lg"
          />
          <div>
            <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Manage your platform</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {menuItems.map(renderItem)}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <SidebarContent 
              activeSection={activeSection} 
              onSectionChange={onSectionChange}
              onClose={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <img 
          src="/favicon.png" 
          alt="Logo" 
          className="w-7 h-7 rounded-lg"
        />
        <h1 className="font-semibold text-foreground">Admin Panel</h1>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 xl:w-64 h-full bg-card border-r border-border flex-col shrink-0">
        <SidebarContent activeSection={activeSection} onSectionChange={onSectionChange} />
      </aside>
    </>
  );
};

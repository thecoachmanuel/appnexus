"use client";

import { useState, useRef } from "react";
import { Reorder, useDragControls, motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { 
  Home, Search, User, Bell, Settings, Heart, ShoppingBag, MessageCircle,
  Star, Bookmark, Calendar, Camera, Clock, Compass, Edit, File, Filter,
  Gift, Globe, Grid, Image, Inbox, Info, Layers, List, Mail, Map, Menu,
  Music, Package, Phone, Play, Plus, Send, Share, ShoppingCart, Tag, Trash,
  Tv, Video, Wallet, Zap, GripVertical, type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/stores/useAppStore";

const availableIcons: { name: string; icon: LucideIcon }[] = [
  { name: "Home", icon: Home },
  { name: "Search", icon: Search },
  { name: "User", icon: User },
  { name: "Bell", icon: Bell },
  { name: "Settings", icon: Settings },
  { name: "Heart", icon: Heart },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "MessageCircle", icon: MessageCircle },
  { name: "Star", icon: Star },
  { name: "Bookmark", icon: Bookmark },
  { name: "Calendar", icon: Calendar },
  { name: "Camera", icon: Camera },
  { name: "Clock", icon: Clock },
  { name: "Compass", icon: Compass },
  { name: "Edit", icon: Edit },
  { name: "File", icon: File },
  { name: "Filter", icon: Filter },
  { name: "Gift", icon: Gift },
  { name: "Globe", icon: Globe },
  { name: "Grid", icon: Grid },
  { name: "Image", icon: Image },
  { name: "Inbox", icon: Inbox },
  { name: "Info", icon: Info },
  { name: "Layers", icon: Layers },
  { name: "List", icon: List },
  { name: "Mail", icon: Mail },
  { name: "Map", icon: Map },
  { name: "Menu", icon: Menu },
  { name: "Music", icon: Music },
  { name: "Package", icon: Package },
  { name: "Phone", icon: Phone },
  { name: "Play", icon: Play },
  { name: "Plus", icon: Plus },
  { name: "Send", icon: Send },
  { name: "Share", icon: Share },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Tag", icon: Tag },
  { name: "Trash", icon: Trash },
  { name: "Tv", icon: Tv },
  { name: "Video", icon: Video },
  { name: "Wallet", icon: Wallet },
  { name: "Zap", icon: Zap },
];

export const getIconComponent = (iconName: string): LucideIcon => {
  const found = availableIcons.find(i => i.name === iconName);
  return found?.icon || Home;
};

interface NavItemEditorProps {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
  primaryColor: string;
  maxItems?: number;
  type: "bottom-nav" | "drawer" | "tabs";
}

// Draggable Tab Item Component
const DraggableTabItem = ({ 
  item, 
  index, 
  onLabelChange, 
  onRemove, 
  canRemove 
}: { 
  item: NavItem; 
  index: number; 
  onLabelChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      layout
      layoutId={`tab-${item.label}-${index}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        layout: { type: "spring", stiffness: 350, damping: 25 },
        opacity: { duration: 0.2 }
      }}
      className="flex items-center gap-2 bg-background rounded-md"
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 8px 20px -4px hsl(var(--primary) / 0.15), 0 4px 8px -2px hsl(var(--foreground) / 0.1)",
        zIndex: 50 
      }}
      style={{ position: "relative" }}
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <Input
        value={item.label}
        onChange={(e) => onLabelChange(e.target.value)}
        className="h-8 text-xs flex-1"
        placeholder={`Tab ${index + 1}`}
      />
      {canRemove && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="w-3.5 h-3.5" />
        </Button>
      )}
    </Reorder.Item>
  );
};

// Draggable Nav Item Component
const DraggableNavItem = ({ 
  item, 
  index, 
  isEditing,
  primaryColor,
  tempIcon,
  tempLabel,
  setTempIcon,
  setTempLabel,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  canRemove
}: { 
  item: NavItem; 
  index: number;
  isEditing: boolean;
  primaryColor: string;
  tempIcon: string;
  tempLabel: string;
  setTempIcon: (icon: string) => void;
  setTempLabel: (label: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) => {
  const dragControls = useDragControls();
  const IconComponent = getIconComponent(item.icon);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      layout
      layoutId={`nav-${item.icon}-${item.label}-${index}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        layout: { type: "spring", stiffness: 350, damping: 25 },
        opacity: { duration: 0.2 }
      }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
        isEditing 
          ? "border-primary bg-primary/5" 
          : "border-border/50 bg-background hover:bg-secondary/30"
      )}
      whileDrag={{ 
        scale: 1.03, 
        boxShadow: "0 10px 25px -5px hsl(var(--primary) / 0.2), 0 6px 10px -3px hsl(var(--foreground) / 0.1)",
        zIndex: 50,
        cursor: "grabbing"
      }}
      style={{ position: "relative" }}
    >
      {!isEditing && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      
      {isEditing ? (
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-10 h-10 p-0"
                >
                  {(() => {
                    const TempIconComponent = getIconComponent(tempIcon);
                    return <TempIconComponent className="w-5 h-5" style={{ color: primaryColor }} />;
                  })()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <Label className="text-xs text-muted-foreground mb-2 block">Choose Icon</Label>
                <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
                  {availableIcons.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setTempIcon(name)}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        tempIcon === name 
                          ? "bg-primary/20 text-primary" 
                          : "hover:bg-secondary"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              className="h-10 flex-1"
              placeholder="Label"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSaveEdit} className="flex-1 h-7 text-xs">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="flex-1 h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <IconComponent 
            className="w-5 h-5 flex-shrink-0" 
            style={{ color: index === 0 ? primaryColor : "hsl(var(--muted-foreground))" }}
          />
          <span 
            className="flex-1 text-sm font-medium truncate"
            style={{ color: index === 0 ? primaryColor : "hsl(var(--foreground))" }}
          >
            {item.label}
          </span>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onStartEdit}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </Button>
            {canRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </>
      )}
    </Reorder.Item>
  );
};

const NavItemEditor = ({ items, onChange, primaryColor, maxItems = 5, type }: NavItemEditorProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempLabel, setTempLabel] = useState("");
  const [tempIcon, setTempIcon] = useState("");
  const previousOrderRef = useRef<string>(JSON.stringify(items));

  const minItems = type === "tabs" ? 2 : 3;
  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setTempLabel(items[index].label);
    setTempIcon(items[index].icon);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const newItems = [...items];
    newItems[editingIndex] = { icon: tempIcon, label: tempLabel };
    onChange(newItems);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleAddItem = () => {
    if (!canAdd) return;
    const newItem: NavItem = type === "tabs" 
      ? { icon: "", label: `Tab ${items.length + 1}` }
      : { icon: "Star", label: "New Item" };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (!canRemove) return;
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleReorder = (newItems: NavItem[]) => {
    const newOrder = JSON.stringify(newItems);
    const orderChanged = previousOrderRef.current !== newOrder;
    
    onChange(newItems);
    
    // Show toast only when order actually changed
    if (orderChanged) {
      previousOrderRef.current = newOrder;
      toast({
        title: "Order updated",
        description: type === "tabs" ? "Tab order has been changed" : "Navigation order has been changed",
      });
    }
    
    // Update editing index if an item was being edited
    if (editingIndex !== null) {
      const editingItem = items[editingIndex];
      const newIndex = newItems.findIndex(item => item === editingItem);
      if (newIndex !== -1 && newIndex !== editingIndex) {
        setEditingIndex(newIndex);
      }
    }
  };

  if (type === "tabs") {
    return (
      <div className="space-y-2">
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={handleReorder} 
          className="space-y-2 relative"
          as="div"
        >
          {items.map((item, index) => (
            <DraggableTabItem
              key={`${item.label}-${index}`}
              item={item}
              index={index}
              onLabelChange={(value) => {
                const newItems = [...items];
                newItems[index] = { ...item, label: value };
                onChange(newItems);
              }}
              onRemove={() => handleRemoveItem(index)}
              canRemove={canRemove}
            />
          ))}
        </Reorder.Group>
        {canAdd && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddItem}
            className="w-full h-8 text-xs gap-1.5 border-dashed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tab ({items.length}/{maxItems})
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Reorder.Group 
        axis="y" 
        values={items} 
        onReorder={handleReorder} 
        className="space-y-2 relative"
        as="div"
      >
        {items.map((item, index) => (
          <DraggableNavItem
            key={`${item.icon}-${item.label}-${index}`}
            item={item}
            index={index}
            isEditing={editingIndex === index}
            primaryColor={primaryColor}
            tempIcon={tempIcon}
            tempLabel={tempLabel}
            setTempIcon={setTempIcon}
            setTempLabel={setTempLabel}
            onStartEdit={() => handleStartEdit(index)}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onRemove={() => handleRemoveItem(index)}
            canRemove={canRemove}
          />
        ))}
      </Reorder.Group>
      
      {canAdd && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddItem}
          className="w-full h-9 text-xs gap-1.5 border-dashed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item ({items.length}/{maxItems})
        </Button>
      )}
    </div>
  );
};

export default NavItemEditor;
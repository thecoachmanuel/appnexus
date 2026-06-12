"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, RefreshCw, Trash2, Coins, Star, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface CreditPack {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price: number;
  is_active: boolean;
  stripe_price_id?: string | null;
}

interface CreditPacksManagerProps {
  packs: CreditPack[];
  onUpdate: (id: string, updates: Partial<CreditPack>) => Promise<boolean>;
  onCreate: (pack: Omit<CreditPack, "id">) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

function getPricePerCredit(price: number, credits: number): number {
  if (credits <= 0) return 0;
  return price / credits;
}

export const CreditPacksManager = ({
  packs,
  onUpdate,
  onCreate,
  onDelete,
  onRefresh,
  loading,
}: CreditPacksManagerProps) => {
  const [editingPack, setEditingPack] = useState<CreditPack | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<CreditPack>>({});

  const handleSave = async () => {
    if (editingPack) {
      const success = await onUpdate(editingPack.id, formData);
      if (success) {
        toast.success("Credit pack updated successfully");
        setEditingPack(null);
      } else {
        toast.error("Failed to update credit pack");
      }
    } else if (isCreating) {
      const success = await onCreate({
        name: formData.name || "",
        description: formData.description || null,
        credits: formData.credits || 0,
        price: formData.price || 0,
        is_active: formData.is_active ?? true,
        stripe_price_id: formData.stripe_price_id || null,
      });
      if (success) {
        toast.success("Credit pack created successfully");
        setIsCreating(false);
      } else {
        toast.error("Failed to create credit pack");
      }
    }
    setFormData({});
  };

  const handleDelete = async (id: string) => {
    const success = await onDelete(id);
    if (success) {
      toast.success("Credit pack deleted");
    } else {
      toast.error("Failed to delete credit pack");
    }
  };

  const openEdit = (pack: CreditPack) => {
    setEditingPack(pack);
    setFormData(pack);
  };

  const openCreate = () => {
    setIsCreating(true);
    setFormData({
      name: "",
      description: "",
      credits: 100,
      price: 10,
      is_active: true,
      stripe_price_id: "",
    });
  };

  // Determine best value pack (lowest price per credit)
  const activePacks = packs.filter(p => p.is_active && p.credits > 0 && p.price > 0);
  const bestValueId = activePacks.length > 0
    ? activePacks.sort((a, b) => getPricePerCredit(a.price, a.credits) - getPricePerCredit(b.price, b.credits))[0]?.id
    : null;

  // Get the highest price per credit for computing savings
  const maxPricePerCredit = activePacks.length > 0
    ? Math.max(...activePacks.map(p => getPricePerCredit(p.price, p.credits)))
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Credit Packs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage one-time credit purchases — users buy credits to build apps</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Pack
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Credit Pack</DialogTitle>
              </DialogHeader>
              <CreditPackForm formData={formData} setFormData={setFormData} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          packs.map((pack) => {
            const ppc = getPricePerCredit(pack.price, pack.credits);
            const isBestValue = pack.id === bestValueId;
            const savingsPct = maxPricePerCredit > 0 && ppc > 0 && ppc < maxPricePerCredit
              ? Math.round(((maxPricePerCredit - ppc) / maxPricePerCredit) * 100)
              : 0;

            return (
              <Card key={pack.id} className={`relative ${!pack.is_active ? "opacity-60" : ""} ${isBestValue ? "ring-2 ring-primary" : ""}`}>
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="w-3 h-3" />
                      Best Value
                    </Badge>
                  </div>
                )}
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Coins className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{pack.name}</CardTitle>
                      <Badge variant={pack.is_active ? "default" : "secondary"} className="mt-1">
                        {pack.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingPack?.id === pack.id}
                      onOpenChange={(open) => !open && setEditingPack(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(pack)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Credit Pack</DialogTitle>
                        </DialogHeader>
                        <CreditPackForm formData={formData} setFormData={setFormData} onSave={handleSave} />
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Credit Pack?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{pack.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(pack.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-accent">{pack.credits}</span>
                    <div className="text-right">
                      <span className="text-lg font-medium">${pack.price}</span>
                      {savingsPct > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                          <TrendingDown className="w-3 h-3" />
                          Save {savingsPct}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {pack.credits > 0 && pack.price > 0 && (
                    <div className="text-xs text-muted-foreground border-t border-border pt-2">
                      <span className="font-medium text-primary">${ppc.toFixed(2)}</span> per credit
                    </div>
                  )}
                  {pack.description && (
                    <p className="text-sm text-muted-foreground">{pack.description}</p>
                  )}
                  {pack.stripe_price_id && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground truncate" title={pack.stripe_price_id}>
                        Stripe: {pack.stripe_price_id}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

interface CreditPackFormProps {
  formData: Partial<CreditPack>;
  setFormData: (data: Partial<CreditPack>) => void;
  onSave: () => void;
}

const CreditPackForm = ({ formData, setFormData, onSave }: CreditPackFormProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Name</Label>
      <Input
        value={formData.name || ""}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Starter Pack"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Credits</Label>
        <Input
          type="number"
          value={formData.credits || 0}
          onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Price ($)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.price || 0}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
        />
      </div>
    </div>
    {(formData.credits || 0) > 0 && (formData.price || 0) > 0 && (
      <p className="text-xs text-muted-foreground">
        ${((formData.price || 0) / (formData.credits || 1)).toFixed(2)} per credit
      </p>
    )}
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea
        value={formData.description || ""}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Brief description of the pack"
      />
    </div>

    {/* Stripe Configuration */}
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        Stripe Integration
      </h4>
      <div className="space-y-2">
        <Label className="text-sm">Stripe Price ID</Label>
        <Input
          placeholder="price_xxx..."
          value={formData.stripe_price_id || ""}
          onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Optional: Create a one-time price in Stripe and paste the ID here
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2">
      <Label>Active</Label>
      <Switch
        checked={formData.is_active ?? true}
        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
      />
    </div>
    <Button onClick={onSave} className="w-full">
      Save Credit Pack
    </Button>
  </div>
);

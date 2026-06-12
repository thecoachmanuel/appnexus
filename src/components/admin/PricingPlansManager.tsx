"use client";

import { useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, RefreshCw, TrendingDown, Star, Eye, EyeOff, Check, Zap, Building2, X } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  monthly_credits: number;
  features: Record<string, boolean>;
  description: string | null;
  is_active: boolean;
  stripe_price_id?: string | null;
  stripe_yearly_price_id?: string | null;
  paypal_plan_id?: string | null;
  paypal_yearly_plan_id?: string | null;
  paypal_product_id?: string | null;
}

interface PricingPlansManagerProps {
  plans: Plan[];
  onUpdate: (id: string, updates: Partial<Plan>) => Promise<boolean>;
  onCreate: (plan: Omit<Plan, "id">) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

function getYearlySavings(monthly: number, yearly: number): number {
  if (monthly <= 0 || yearly <= 0) return 0;
  const fullYearly = monthly * 12;
  return Math.round(((fullYearly - yearly) / fullYearly) * 100);
}

function getPricePerCredit(price: number, credits: number): string {
  if (credits <= 0) return "—";
  return `$${(price / credits).toFixed(2)}`;
}

export const PricingPlansManager = ({
  plans,
  onUpdate,
  onCreate,
  onRefresh,
  loading,
}: PricingPlansManagerProps) => {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Plan>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewCycle, setPreviewCycle] = useState<"monthly" | "yearly">("monthly");

  const activePlans = useMemo(() => plans.filter(p => p.is_active), [plans]);

  const handleSave = async () => {
    if (editingPlan) {
      const success = await onUpdate(editingPlan.id, formData);
      if (success) {
        toast.success("Plan updated successfully");
        setEditingPlan(null);
      } else {
        toast.error("Failed to update plan");
      }
    } else if (isCreating) {
      const success = await onCreate({
        name: formData.name || "",
        tier: (formData.tier as "free" | "pro" | "enterprise") || "pro",
        price_monthly: formData.price_monthly || 0,
        price_yearly: formData.price_yearly || 0,
        monthly_credits: formData.monthly_credits || 0,
        features: formData.features || {},
        description: formData.description || null,
        is_active: formData.is_active ?? true,
        stripe_price_id: formData.stripe_price_id || null,
        stripe_yearly_price_id: formData.stripe_yearly_price_id || null,
        paypal_plan_id: formData.paypal_plan_id || null,
        paypal_yearly_plan_id: formData.paypal_yearly_plan_id || null,
        paypal_product_id: formData.paypal_product_id || null,
      });
      if (success) {
        toast.success("Plan created successfully");
        setIsCreating(false);
      } else {
        toast.error("Failed to create plan");
      }
    }
    setFormData({});
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData(plan);
  };

  const openCreate = () => {
    setIsCreating(true);
    setFormData({
      name: "",
      tier: "pro",
      price_monthly: 0,
      price_yearly: 0,
      monthly_credits: 100,
      features: {},
      description: "",
      is_active: true,
      stripe_price_id: "",
      stripe_yearly_price_id: "",
      paypal_plan_id: "",
      paypal_yearly_plan_id: "",
      paypal_product_id: "",
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "bg-accent/10 text-accent";
      case "pro":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Determine "best value" plan (lowest price per credit, excluding free)
  const bestValueId = plans
    .filter(p => p.is_active && p.price_monthly > 0 && p.monthly_credits > 0)
    .sort((a, b) => (a.price_monthly / a.monthly_credits) - (b.price_monthly / b.monthly_credits))
    [0]?.id;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pricing Plans</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your subscription tiers</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          plans.map((plan) => {
            const savings = getYearlySavings(plan.price_monthly, plan.price_yearly);
            const pricePerCredit = getPricePerCredit(plan.price_monthly, plan.monthly_credits);
            const isBestValue = plan.id === bestValueId;

            return (
              <Card key={plan.id} className={`relative ${!plan.is_active ? "opacity-60" : ""} ${isBestValue ? "ring-2 ring-primary" : ""}`}>
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Star className="w-3 h-3" />
                      Best Value
                    </Badge>
                  </div>
                )}
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge className={getTierColor(plan.tier)}>{plan.tier}</Badge>
                  </div>
                  <Dialog
                    open={editingPlan?.id === plan.id}
                    onOpenChange={(open) => !open && setEditingPlan(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Plan</DialogTitle>
                      </DialogHeader>
                      <PlanForm formData={formData} setFormData={setFormData} onSave={handleSave} />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly</span>
                    <span className="font-medium">${plan.price_monthly}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Yearly</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${plan.price_yearly}</span>
                      {savings > 0 && (
                        <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
                          <TrendingDown className="w-3 h-3" />
                          {savings}% off
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits/mo</span>
                    <span className="font-medium">{plan.monthly_credits}</span>
                  </div>
                  {plan.price_monthly > 0 && plan.monthly_credits > 0 && (
                    <div className="flex justify-between text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">Cost per credit</span>
                      <span className="font-medium text-primary">{pricePerCredit}</span>
                    </div>
                  )}
                  {plan.description && (
                    <p className="text-sm text-muted-foreground pt-2">{plan.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* User Preview Section */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showPreview ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            <span className="font-semibold text-foreground">User-Facing Preview</span>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </div>
          <span className="text-xs text-muted-foreground">{showPreview ? "Hide" : "Show"} preview</span>
        </button>

        {showPreview && (
          <CardContent className="border-t border-border pt-6">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className={`text-sm font-medium ${previewCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setPreviewCycle(previewCycle === "monthly" ? "yearly" : "monthly")}
                className={`relative w-12 h-6 rounded-full transition-colors ${previewCycle === "yearly" ? "bg-accent" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${previewCycle === "yearly" ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
              <span className={`text-sm font-medium ${previewCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <Badge variant="outline" className="ml-1.5 text-xs text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800">Save 20%</Badge>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {activePlans.map((plan) => {
                const tierIcon = { free: Zap, pro: Star, enterprise: Building2 }[plan.tier] || Zap;
                const TierIcon = tierIcon;
                const price = previewCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
                const isPopular = plan.tier === "pro";
                const featuresList = Object.entries(plan.features || {})
                  .filter(([, enabled]) => enabled)
                  .map(([feature]) => feature);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-6 transition-all ${isPopular ? "ring-2 ring-accent border-accent" : "border-border"}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                        Most Popular
                      </div>
                    )}
                    <div className="text-center mb-5">
                      <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center bg-accent/15">
                        <TierIcon className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                    </div>
                    <div className="text-center mb-5">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-accent">${price}</span>
                        <span className="text-muted-foreground text-sm">/{previewCycle === "monthly" ? "mo" : "yr"}</span>
                      </div>
                      <p className="text-xs text-accent/80 mt-1">{plan.monthly_credits} credits/month</p>
                    </div>
                    {featuresList.length > 0 && (
                      <ul className="space-y-2 mb-5">
                        {featuresList.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                            <span className="text-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      variant={isPopular ? "default" : "outline"}
                      className="w-full pointer-events-none opacity-80"
                      tabIndex={-1}
                    >
                      {plan.tier === "free" ? "Get Started" : "Subscribe"}
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">This is how your pricing page appears to end users</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

const FeatureListEditor = ({
  features,
  onChange,
}: {
  features: Record<string, boolean>;
  onChange: (features: Record<string, boolean>) => void;
}) => {
  const [newFeature, setNewFeature] = useState("");

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed || trimmed in features) return;
    onChange({ ...features, [trimmed]: true });
    setNewFeature("");
  };

  const removeFeature = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  const toggleFeature = (key: string) => {
    onChange({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-3">
      <Label>Features</Label>
      <div className="space-y-1.5">
        {Object.entries(features).map(([feature, enabled]) => (
          <div key={feature} className="flex items-center gap-2 group">
            <Switch
              checked={enabled}
              onCheckedChange={() => toggleFeature(feature)}
              className="scale-75"
            />
            <span className={`text-sm flex-1 ${enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
              {feature}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeFeature(feature)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add a feature..."
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
          className="h-8 text-sm"
        />
        <Button variant="outline" size="sm" onClick={addFeature} disabled={!newFeature.trim()}>
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Toggle features on/off or remove them. Enabled features show in the pricing preview.</p>
    </div>
  );
};

interface PlanFormProps {
  formData: Partial<Plan>;
  setFormData: (data: Partial<Plan>) => void;
  onSave: () => void;
}

const PlanForm = ({ formData, setFormData, onSave }: PlanFormProps) => (
  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Tier</Label>
        <Select
          value={formData.tier}
          onValueChange={(value) => setFormData({ ...formData, tier: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Monthly Price ($)</Label>
        <Input
          type="number"
          value={formData.price_monthly || 0}
          onChange={(e) =>
            setFormData({ ...formData, price_monthly: Number(e.target.value) })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Yearly Price ($)</Label>
        <Input
          type="number"
          value={formData.price_yearly || 0}
          onChange={(e) =>
            setFormData({ ...formData, price_yearly: Number(e.target.value) })
          }
        />
        {(formData.price_monthly || 0) > 0 && (formData.price_yearly || 0) > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400">
            {getYearlySavings(formData.price_monthly || 0, formData.price_yearly || 0)}% savings vs monthly
          </p>
        )}
      </div>
    </div>
    <div className="space-y-2">
      <Label>Monthly Credits</Label>
      <Input
        type="number"
        value={formData.monthly_credits || 0}
        onChange={(e) =>
          setFormData({ ...formData, monthly_credits: Number(e.target.value) })
        }
      />
      {(formData.price_monthly || 0) > 0 && (formData.monthly_credits || 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          ${((formData.price_monthly || 0) / (formData.monthly_credits || 1)).toFixed(2)} per credit
        </p>
      )}
    </div>
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea
        value={formData.description || ""}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
    </div>

    {/* Features */}
    <div className="border-t pt-4 mt-4">
      <FeatureListEditor
        features={(formData.features as Record<string, boolean>) || {}}
        onChange={(features) => setFormData({ ...formData, features })}
      />
    </div>
    
    {/* Stripe Configuration */}
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        Stripe Integration
      </h4>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Monthly Stripe Price ID</Label>
          <Input
            placeholder="price_xxx..."
            value={formData.stripe_price_id || ""}
            onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">From Stripe Dashboard → Products → Price ID</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Yearly Stripe Price ID</Label>
          <Input
            placeholder="price_xxx..."
            value={formData.stripe_yearly_price_id || ""}
            onChange={(e) => setFormData({ ...formData, stripe_yearly_price_id: e.target.value })}
          />
        </div>
      </div>
    </div>

    {/* PayPal Configuration */}
    <div className="border-t pt-4 mt-4">
      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        PayPal Integration
      </h4>
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">PayPal Product ID</Label>
          <Input
            placeholder="PROD-xxx..."
            value={formData.paypal_product_id || ""}
            onChange={(e) => setFormData({ ...formData, paypal_product_id: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">PayPal catalog product ID</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Monthly PayPal Plan ID</Label>
          <Input
            placeholder="P-xxx..."
            value={formData.paypal_plan_id || ""}
            onChange={(e) => setFormData({ ...formData, paypal_plan_id: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Yearly PayPal Plan ID</Label>
          <Input
            placeholder="P-xxx..."
            value={formData.paypal_yearly_plan_id || ""}
            onChange={(e) => setFormData({ ...formData, paypal_yearly_plan_id: e.target.value })}
          />
        </div>
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
      Save Plan
    </Button>
  </div>
);

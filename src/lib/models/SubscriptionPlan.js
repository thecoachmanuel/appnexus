import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  price_monthly: { type: Number, required: true },
  price_yearly: { type: Number, required: true },
  monthly_credits: { type: Number, default: 0 },
  description: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  stripe_price_id: { type: String, default: null },
  stripe_yearly_price_id: { type: String, default: null },
  features: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

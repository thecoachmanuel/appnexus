import mongoose from 'mongoose';

const creditPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  credits: { type: Number, required: true },
  price: { type: Number, required: true },
  is_active: { type: Boolean, default: true },
  stripe_price_id: { type: String, default: null }
}, { timestamps: true });

export const CreditPack = mongoose.models.CreditPack || mongoose.model('CreditPack', creditPackSchema);

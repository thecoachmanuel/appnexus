import mongoose from 'mongoose';

const bankTransferSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'pending' },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
  credit_pack_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditPack', default: null },
  proof_of_payment_url: { type: String, default: null },
  admin_notes: { type: String, default: null }
}, { timestamps: true });

export const BankTransfer = mongoose.model('BankTransfer', bankTransferSchema);

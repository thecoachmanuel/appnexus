import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_email: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, default: 'pending' },
  description: { type: String, default: null },
  invoice_url: { type: String, default: null },
  paid_at: { type: Date, default: null }
}, { timestamps: true });

export const Invoice = mongoose.model('Invoice', invoiceSchema);

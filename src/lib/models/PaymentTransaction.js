import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  payment_method: { type: String, required: true },
  transaction_type: { type: String, required: true },
  status: { type: String, default: 'pending' },
  reference_id: { type: String, default: null }
}, { timestamps: true });

export const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema);

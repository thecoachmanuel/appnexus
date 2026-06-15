import mongoose from 'mongoose';

const creditUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  action_type: {
    type: String,
    enum: ['app_build', 'purchase', 'refund', 'admin_adjustment', 'signup_bonus'],
    required: true
  },
  description: {
    type: String,
    default: null
  }
}, { timestamps: true });

export const CreditUsage = mongoose.models.CreditUsage || mongoose.model('CreditUsage', creditUsageSchema);

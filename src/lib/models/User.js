import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  display_name: {
    type: String,
    default: ''
  },
  avatar_url: {
    type: String,
    default: null
  },
  company_name: {
    type: String,
    default: null
  },
  marketing_consent: {
    type: Boolean,
    default: false
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  stripe_customer_id: {
    type: String,
    default: null
  },
  credits: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);

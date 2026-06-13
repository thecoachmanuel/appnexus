import mongoose from 'mongoose';

const pluginSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  version: { type: String, default: '1.0.0' }
}, { timestamps: true });

export const Plugin = mongoose.models.Plugin || mongoose.model('Plugin', pluginSchema);

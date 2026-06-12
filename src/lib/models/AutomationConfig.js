import mongoose from 'mongoose';

const automationConfigSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AppProject', required: true },
  workflow_type: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_enabled: { type: Boolean, default: true }
}, { timestamps: true });

export const AutomationConfig = mongoose.model('AutomationConfig', automationConfigSchema);

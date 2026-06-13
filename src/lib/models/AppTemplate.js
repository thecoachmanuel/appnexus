import mongoose from 'mongoose';

const appTemplateSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  config: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export const AppTemplate = mongoose.models.AppTemplate || mongoose.model('AppTemplate', appTemplateSchema);

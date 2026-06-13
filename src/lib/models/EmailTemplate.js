import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  html_content: { type: String, required: true },
  text_content: { type: String, default: null },
  variables: { type: [String], default: [] },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);

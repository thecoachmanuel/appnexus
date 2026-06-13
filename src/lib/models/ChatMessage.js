import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AppProject', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true }
}, { timestamps: true });

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

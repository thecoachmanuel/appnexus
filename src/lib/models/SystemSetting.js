import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  }
}, { timestamps: true });

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

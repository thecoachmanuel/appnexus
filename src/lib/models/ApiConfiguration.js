import mongoose from 'mongoose';

const ApiConfigurationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  provider: { type: String, required: true, unique: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  api_key_masked: { type: String, default: null },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true
});

// For frontend compatibility with Supabase 'id'
ApiConfigurationSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

export const ApiConfiguration = mongoose.models.ApiConfiguration || mongoose.model('ApiConfiguration', ApiConfigurationSchema);

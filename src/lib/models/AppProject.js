import mongoose from 'mongoose';

const appProjectSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  app_name: {
    type: String,
    required: true
  },
  website_url: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  app_category: {
    type: String,
    default: null
  },
  primary_color: {
    type: String,
    default: null
  },
  accent_color: {
    type: String,
    default: null
  },
  navigation_style: {
    type: String,
    default: null
  },
  features: {
    type: [String],
    default: []
  },
  icon_style: {
    type: String,
    default: null
  },
  splash_screen_style: {
    type: String,
    default: null
  },
  build_status: {
    type: String,
    default: null
  },
  github_actions_configured: {
    type: Boolean,
    default: false
  },
  github_connected: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const AppProject = mongoose.models.AppProject || mongoose.model('AppProject', appProjectSchema);

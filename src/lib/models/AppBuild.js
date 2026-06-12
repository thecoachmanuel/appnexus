import mongoose from 'mongoose';

const appBuildSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppProject',
    default: null
  },
  app_name: {
    type: String,
    required: true
  },
  package_name: {
    type: String,
    required: true
  },
  website_url: {
    type: String,
    required: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  },
  cloud_build_id: {
    type: String,
    default: null
  },
  cloud_provider: {
    type: String,
    default: null
  },
  download_url: {
    type: String,
    default: null
  },
  error_message: {
    type: String,
    default: null
  }
}, { timestamps: true });

export const AppBuild = mongoose.model('AppBuild', appBuildSchema);

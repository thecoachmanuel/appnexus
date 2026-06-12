export type PlatformId = 
  | 'android' 
  | 'ios' 
  | 'windows' 
  | 'macos' 
  | 'linux'
  | 'pwa';

export type PlatformStatus = 
  | 'available' 
  | 'coming-soon' 
  | 'beta' 
  | 'deprecated';

export type BuildMethod = 
  | 'cloud'      // Built on server, downloadable
  | 'local'      // Requires local build (Capacitor, Electron)
  | 'pwa';       // Progressive Web App

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  shortName: string;
  description: string;
  outputFormat: string;
  status: PlatformStatus;
  buildMethod: BuildMethod;
  estimatedSize: string;
  icon: 'android' | 'apple' | 'windows' | 'monitor' | 'globe';
  gradient: string;
  requirements?: string[];
  documentationUrl?: string;
}

export interface BuildConfig {
  websiteUrl: string;
  appName: string;
  packageName?: string;
  primaryColor: string;
  accentColor: string;
  navigationStyle: string;
  features: string[];
  appCategory: string;
  description: string;
  iconStyle: string;
  splashScreenStyle: string;
}

export interface BuildResult {
  success: boolean;
  buildId?: string;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
}

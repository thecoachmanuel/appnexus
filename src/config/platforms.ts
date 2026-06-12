import type { PlatformConfig, PlatformId } from '@/types/platforms';

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  android: {
    id: 'android',
    name: 'Android',
    shortName: 'Android',
    description: 'Build for Android devices. Install directly or publish to Google Play.',
    outputFormat: 'APK',
    status: 'available',
    buildMethod: 'cloud',
    estimatedSize: '~12 MB',
    icon: 'android',
    gradient: 'from-primary to-primary/80',
    requirements: [],
    documentationUrl: '/docs/index.html#cm-android',
  },
  ios: {
    id: 'ios',
    name: 'iOS',
    shortName: 'iOS',
    description: 'Build for iPhone & iPad. Publish to the Apple App Store.',
    outputFormat: 'IPA',
    status: 'available',
    buildMethod: 'cloud',
    estimatedSize: '~18 MB',
    icon: 'apple',
    gradient: 'from-gray-700 to-gray-900',
    requirements: [],
    documentationUrl: '/docs/index.html#cm-ios',
  },
  windows: {
    id: 'windows',
    name: 'Windows',
    shortName: 'Windows',
    description: 'Build for Windows 10/11. Distribute via Microsoft Store or direct download.',
    outputFormat: 'MSIX / EXE',
    status: 'available',
    buildMethod: 'local',
    estimatedSize: '~45 MB',
    icon: 'windows',
    gradient: 'from-primary/90 to-primary',
    requirements: [
      'Windows or macOS/Linux with Node.js',
      'Electron & electron-builder installed',
    ],
    documentationUrl: 'https://www.electron.build/',
  },
  macos: {
    id: 'macos',
    name: 'macOS',
    shortName: 'macOS',
    description: 'Build for Mac computers. Distribute via Mac App Store or direct download.',
    outputFormat: 'DMG / PKG',
    status: 'available',
    buildMethod: 'local',
    estimatedSize: '~50 MB',
    icon: 'apple',
    gradient: 'from-gray-600 to-gray-800',
    requirements: [
      'Mac with Xcode Command Line Tools',
      'Apple Developer account (for signing)',
      'Electron & electron-builder installed',
    ],
    documentationUrl: 'https://www.electron.build/',
  },
  linux: {
    id: 'linux',
    name: 'Linux',
    shortName: 'Linux',
    description: 'Build for Linux distributions. Create AppImage, Snap, or DEB packages.',
    outputFormat: 'AppImage / DEB',
    status: 'coming-soon',
    buildMethod: 'local',
    estimatedSize: '~40 MB',
    icon: 'monitor',
    gradient: 'from-muted-foreground to-primary',
    requirements: [
      'Linux with Node.js',
      'Electron framework',
    ],
    documentationUrl: undefined,
  },
  pwa: {
    id: 'pwa',
    name: 'Progressive Web App',
    shortName: 'PWA',
    description: 'Install directly from browser. Works offline on all devices.',
    outputFormat: 'Web App',
    status: 'available',
    buildMethod: 'pwa',
    estimatedSize: '~2 MB',
    icon: 'globe',
    gradient: 'from-primary/80 to-primary',
    requirements: [],
    documentationUrl: '/install',
  },
};

export const getAvailablePlatforms = (): PlatformConfig[] => {
  return Object.values(PLATFORMS).filter(p => p.status === 'available');
};

export const getComingSoonPlatforms = (): PlatformConfig[] => {
  return Object.values(PLATFORMS).filter(p => p.status === 'coming-soon');
};

export const getPlatformById = (id: PlatformId): PlatformConfig | undefined => {
  return PLATFORMS[id];
};

export const getMobilePlatforms = (): PlatformConfig[] => {
  return [PLATFORMS.android, PLATFORMS.ios, PLATFORMS.pwa];
};

export const getDesktopPlatforms = (): PlatformConfig[] => {
  return [PLATFORMS.windows, PLATFORMS.macos, PLATFORMS.linux];
};

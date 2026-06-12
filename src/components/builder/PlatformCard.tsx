"use client";

import { CheckCircle, Apple, Monitor, Globe } from 'lucide-react';
import type { PlatformConfig } from '@/types/platforms';

interface PlatformCardProps {
  platform: PlatformConfig;
  isSelected: boolean;
  onSelect: () => void;
}

const AndroidIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.523 2.236a.75.75 0 0 0-1.046 1.073l1.21 1.178A8.976 8.976 0 0 0 12 3c-2.283 0-4.378.848-5.972 2.243l1.121-1.08a.75.75 0 0 0-1.042-1.08L4.21 4.92a.75.75 0 0 0 .002 1.082l1.85 1.8a.75.75 0 1 0 1.046-1.076l-.654-.635A7.469 7.469 0 0 1 12 4.5c2.12 0 4.05.88 5.42 2.294l-.744.724a.75.75 0 1 0 1.046 1.076l1.85-1.8a.75.75 0 0 0 .002-1.082l-2.051-1.476zM6.75 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm10.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 7.5c-3.86 0-7 3.14-7 7v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5c0-3.86-3.14-7-7-7z"/>
  </svg>
);

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M3 5.5L10.5 4.4V11.5H3V5.5ZM3 18.5V12.5H10.5V19.6L3 18.5ZM11.5 4.2L21 2.5V11.5H11.5V4.2ZM11.5 12.5H21V21.5L11.5 19.8V12.5Z"/>
  </svg>
);

const PlatformIcon = ({ icon, className }: { icon: PlatformConfig['icon']; className?: string }) => {
  switch (icon) {
    case 'android':
      return <AndroidIcon className={className} />;
    case 'apple':
      return <Apple className={className} />;
    case 'windows':
      return <WindowsIcon className={className} />;
    case 'monitor':
      return <Monitor className={className} />;
    case 'globe':
      return <Globe className={className} />;
    default:
      return <Monitor className={className} />;
  }
};

const StatusBadge = ({ status }: { status: PlatformConfig['status'] }) => {
  const styles = {
    'available': 'bg-primary/20 text-primary',
    'coming-soon': 'bg-muted text-muted-foreground',
    'beta': 'bg-primary/10 text-primary',
    'deprecated': 'bg-destructive/20 text-destructive',
  };

  const labels = {
    'available': null, // Don't show badge for available
    'coming-soon': 'Coming Soon',
    'beta': 'Beta',
    'deprecated': 'Deprecated',
  };

  if (!labels[status]) return null;

  return (
    <div className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </div>
  );
};

const BuildMethodBadge = ({ method }: { method: PlatformConfig['buildMethod'] }) => {
  if (method === 'cloud') {
    return (
      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
        Cloud Build
      </span>
    );
  }
  if (method === 'local') {
    return (
      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
        Local Build
      </span>
    );
  }
  return (
    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
      Instant
    </span>
  );
};

const PlatformCard = ({ platform, isSelected, onSelect }: PlatformCardProps) => {
  const isDisabled = platform.status === 'coming-soon' || platform.status === 'deprecated';

  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
        isSelected
          ? 'border-primary bg-primary/10'
          : isDisabled
          ? 'border-border/50 bg-secondary/20 opacity-60 cursor-not-allowed'
          : 'border-border hover:border-primary/50 bg-secondary/30'
      }`}
    >
      <StatusBadge status={platform.status} />
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center`}>
          <PlatformIcon icon={platform.icon} className="w-7 h-7 text-white" />
        </div>
        <div>
          <h4 className="font-display font-bold text-foreground">{platform.name}</h4>
          <p className="text-xs text-muted-foreground">{platform.outputFormat}</p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {platform.description}
      </p>
      
      <div className="flex items-center gap-2">
        <BuildMethodBadge method={platform.buildMethod} />
        <span className="text-xs text-muted-foreground">{platform.estimatedSize}</span>
      </div>
      
      {isSelected && !isDisabled && (
        <div className="absolute top-3 left-3">
          <CheckCircle className="w-5 h-5 text-primary" />
        </div>
      )}
    </button>
  );
};

export default PlatformCard;

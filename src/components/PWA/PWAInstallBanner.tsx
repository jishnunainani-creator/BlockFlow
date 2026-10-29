import React, { useState } from 'react';
import { Download, PlusSquare, X, WifiOff, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { IOSInstallModal } from './IOSInstallModal';

interface PWAInstallBannerProps {
  className?: string;
  variant?: 'banner' | 'button';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  className = '',
  variant = 'banner',
}) => {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isOffline,
    isDismissed,
    promptInstall,
    dismissBanner,
  } = usePWAInstall();

  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) {
      setIsPrompting(true);
      await promptInstall();
      setIsPrompting(false);
    }
  };

  // If already installed as a standalone PWA, only render offline badge if offline
  if (isInstalled) {
    if (isOffline) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium ${className}`}>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Captures will save locally to device storage</span>
        </div>
      );
    }
    return null;
  }

  // If user has dismissed banner and it's variant 'banner', still render offline status if offline
  if (isDismissed && variant === 'banner') {
    if (isOffline) {
      return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium ${className}`}>
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode — Captures will save locally to device storage</span>
        </div>
      );
    }
    return null;
  }

  // Determine if install action is applicable
  const showInstall = canInstall || isIOS;

  if (!showInstall && !isOffline) {
    return null;
  }

  // Button variant (e.g. for header action)
  if (variant === 'button') {
    if (!showInstall) return null;

    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isPrompting}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/60 transition-colors shadow-2xs ${className}`}
          title={isIOS ? 'Add to iOS Home Screen' : 'Install BlockFlow on this device'}
          aria-label={isIOS ? 'Add to Home Screen' : 'Install BlockFlow'}
        >
          {isIOS ? <PlusSquare className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isIOS ? 'Add to Home' : 'Install App'}</span>
        </button>

        <IOSInstallModal
          isOpen={showIOSModal}
          onClose={() => setShowIOSModal(false)}
          onDontShowAgain={dismissBanner}
        />
      </>
    );
  }

  // Banner variant (ambient callout above capture area)
  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Offline indicator if active */}
        {isOffline && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium animate-fade-in">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="font-semibold">Offline Mode</span> · Captures will save locally to this device.
            </div>
          </div>
        )}

        {/* Ambient Install Callout */}
        {showInstall && !isDismissed && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-slate-800 dark:text-slate-200 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                {isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {isIOS ? 'Add BlockFlow to Home Screen' : 'Install BlockFlow Companion'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isIOS
                    ? 'Launch instantly in standalone mode with Safari'
                    : 'Fast one-tap capture from your home screen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>{isIOS ? 'Instructions' : 'Install'}</span>
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                title="Dismiss reminder"
                aria-label="Dismiss install banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        onDontShowAgain={dismissBanner}
      />
    </>
  );
};

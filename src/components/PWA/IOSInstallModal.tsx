import React from 'react';
import { X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain?: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({
  isOpen,
  onClose,
  onDontShowAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ios-install-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Add BlockFlow to Home Screen
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Install as a lightweight iPhone/iPad companion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close installation instructions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step-by-step instructions */}
        <div className="space-y-3.5 text-xs">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                Tap Safari's <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-blue-600 dark:text-blue-400"><Share className="w-3.5 h-3.5" /> Share</span> button
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Located on the bottom navigation bar on iPhone, or near the URL address bar at the top on iPad.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                Select <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200"><PlusSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Add to Home Screen</span>
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Scroll down in the action sheet options until you see "Add to Home Screen".
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                Confirm by tapping <span className="font-bold text-blue-600 dark:text-blue-400">Add</span> in the top right
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                BlockFlow will launch standalone from your home screen with zero browser bars and instant access.
              </p>
            </div>
          </div>
        </div>

        {/* Note on variation */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center">
          * Menu layout may vary slightly depending on your iOS/iPadOS version.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onDontShowAgain && (
            <button
              type="button"
              onClick={() => {
                onDontShowAgain();
                onClose();
              }}
              className="flex-1 py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Don't show again
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};

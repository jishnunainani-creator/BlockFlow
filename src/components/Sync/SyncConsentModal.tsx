import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cloud,
  HardDrive,
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  SyncCategory,
  SYNC_CATEGORIES_METADATA,
  SyncSettings,
} from '../../types/storageState';
import {
  loadSyncSettings,
  saveSyncSettings,
  getStorageAuditSummary,
} from '../../lib/storageRepository';
import { performSelectiveSync } from '../../lib/selectiveSync';
import { useTimetable } from '../../context/TimetableContext';

interface SyncConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export const SyncConsentModal: React.FC<SyncConsentModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const { addToast } = useTimetable();
  const [settings, setSettings] = useState<SyncSettings>(() => loadSyncSettings());
  const [categories, setCategories] = useState<Record<SyncCategory, boolean>>(
    settings.syncCategories
  );
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const summary = getStorageAuditSummary();

  const handleToggleCategory = (cat: SyncCategory) => {
    setCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleConfirmSync = async () => {
    setIsApplying(true);
    const updatedSettings: SyncSettings = {
      ...settings,
      syncConsentGiven: true,
      syncConsentDate: new Date().toISOString(),
      autoSyncEnabled: Object.values(categories).some(Boolean),
      syncCategories: categories,
    };

    saveSyncSettings(updatedSettings);

    if (userId && updatedSettings.autoSyncEnabled) {
      addToast('Applying selective sync settings...', 'info');
      await performSelectiveSync(userId);
      addToast('Selective sync completed with privacy filters applied', 'success');
    } else {
      addToast('Storage preferences saved', 'success');
    }

    setIsApplying(false);
    onClose();
  };

  const handleKeepAllLocal = () => {
    const updatedSettings: SyncSettings = {
      ...settings,
      syncConsentGiven: true,
      syncConsentDate: new Date().toISOString(),
      autoSyncEnabled: false,
      syncCategories: {
        tasks: false,
        assignments: false,
        goals: false,
        timetable: false,
        templates: false,
        reflections: false,
        focus_logs: false,
      },
    };

    saveSyncSettings(updatedSettings);
    addToast('Confirmed: All productivity data remains 100% local on this device', 'info');
    onClose();
  };

  const syncCount = Object.values(categories).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-consent-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="sync-consent-title" className="text-base font-bold text-slate-900 dark:text-white">
                Privacy-First Cloud Sync Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You control exactly which data leaves this device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Local-First Architecture Explainer */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Local-First Default</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            BlockFlow uses IndexedDB to store your records locally on this device. When you sign in,
            your existing data is <strong className="text-slate-900 dark:text-slate-100">not</strong> automatically uploaded.
            Choose which modules you would like to synchronize with Supabase across your devices:
          </p>
        </div>

        {/* Category Toggles List */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Choose What to Synchronize ({syncCount} Selected)
          </h3>

          <div className="space-y-2">
            {(Object.keys(SYNC_CATEGORIES_METADATA) as SyncCategory[]).map((catKey) => {
              const meta = SYNC_CATEGORIES_METADATA[catKey];
              const isEnabled = categories[catKey];
              const stat = summary.categories.find((c) => c.category === catKey);

              return (
                <div
                  key={catKey}
                  onClick={() => handleToggleCategory(catKey)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isEnabled
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800/80 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => {}} // handled by parent div click
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{meta.label}</span>
                        {meta.sensitiveDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Private by default
                          </span>
                        )}
                        {stat && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({stat.totalCount} on device)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      isEnabled
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isEnabled ? 'Cloud Synced' : 'Local Only'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Honest Security & Privacy Disclosure */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Honest Security Disclosures</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
            <li>
              <strong>PostgreSQL Row Level Security (RLS):</strong> Enabled on all cloud tables. Isolates your synced records so other users cannot access them.
            </li>
            <li>
              <strong>Operator Visibility:</strong> Standard RLS protects against other accounts, but unencrypted cloud tables remain accessible to database administrators.
            </li>
            <li>
              <strong>End-to-End Encryption (E2EE):</strong> True zero-knowledge client encryption is currently in development. Keep sensitive reflections and personal tasks marked <strong>"Local Only"</strong>.
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleKeepAllLocal}
            disabled={isApplying}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Keep Everything Local Only
          </button>

          <button
            type="button"
            onClick={handleConfirmSync}
            disabled={isApplying}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {isApplying ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Sync Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

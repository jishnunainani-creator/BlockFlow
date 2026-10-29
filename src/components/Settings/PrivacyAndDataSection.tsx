import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Cloud,
  Download,
  Trash2,
  RefreshCw,
  Info,
  Lock,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getStorageAuditSummary,
  StorageAuditSummary,
  loadSyncSettings,
} from '../../lib/storageRepository';
import {
  performSelectiveSync,
  purgeAllCloudCopiesPreserveLocal,
} from '../../lib/selectiveSync';
import { SyncConsentModal } from '../Sync/SyncConsentModal';
import { useTimetable } from '../../context/TimetableContext';
import { getCurrentUser } from '../../lib/supabase';

interface PrivacyAndDataSectionProps {
  onExportJSON: () => void;
  userEmail?: string | null;
}

export const PrivacyAndDataSection: React.FC<PrivacyAndDataSectionProps> = ({
  onExportJSON,
  userEmail,
}) => {
  const { addToast } = useTimetable();
  const [audit, setAudit] = useState<StorageAuditSummary>(() => getStorageAuditSummary());
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurgingCloud, setIsPurgingCloud] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const refreshAudit = () => {
    setAudit(getStorageAuditSummary());
  };

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setCurrentUserId(u.id);
    });

    const handleSyncChange = () => refreshAudit();
    window.addEventListener('blockflow_sync_settings_changed', handleSyncChange);
    return () => window.removeEventListener('blockflow_sync_settings_changed', handleSyncChange);
  }, []);

  const handleManualSync = async () => {
    if (!currentUserId) {
      addToast('Please sign in to run cloud synchronization', 'info');
      return;
    }

    const settings = loadSyncSettings();
    if (!settings.syncConsentGiven || !settings.autoSyncEnabled) {
      setIsConsentModalOpen(true);
      return;
    }

    setIsSyncing(true);
    addToast('Starting selective cloud sync...', 'info');

    try {
      const summary = await performSelectiveSync(currentUserId);
      if (summary.errors.length > 0) {
        addToast(`Sync finished with warnings: ${summary.errors[0]}`, 'warning');
      } else {
        addToast(
          `Sync complete: ${summary.uploadedCount} uploaded, ${summary.downloadedCount} downloaded, ${summary.skippedLocalCount} kept local`,
          'success'
        );
      }
      refreshAudit();
    } catch (err: any) {
      addToast(`Sync failed: ${err.message || err}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePurgeCloudData = async () => {
    if (!currentUserId) return;

    setIsPurgingCloud(true);
    try {
      await purgeAllCloudCopiesPreserveLocal(currentUserId);
      addToast('All remote cloud data deleted. Local records preserved as Local-Only.', 'success');
      setShowPurgeConfirm(false);
      refreshAudit();
    } catch (err: any) {
      addToast(`Failed to purge cloud copies: ${err.message || err}`, 'error');
    } finally {
      setIsPurgingCloud(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy & Local-First Data Architecture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your local storage, selective Supabase synchronization, and data sovereignty
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsConsentModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configure Sync</span>
          </button>

          {userEmail && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Storage Audit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Records</span>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{audit.totalRecords}</p>
          <p className="text-[11px] text-slate-400">IndexedDB local database</p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span>Local-Only Records</span>
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
            {audit.totalLocalOnly}
          </p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70">
            Never leaves this device
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
            <span>Cloud-Synced Records</span>
            <Cloud className="w-4 h-4" />
          </div>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
            {audit.totalCloudSynced}
          </p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/70">
            {audit.isAutoSyncEnabled ? 'RLS Protected Sync' : 'Sync Inactive'}
          </p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Module Storage Classification
        </h4>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {audit.categories.map((c) => (
            <div
              key={c.category}
              className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {c.category === 'timetable' ? 'Timetable & Blocks' : c.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({c.totalCount} items: {c.localOnlyCount} local, {c.cloudSyncedCount} synced)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {c.syncActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    <span>Sync Active</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>100% Local Only</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational & Transparency Guide */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Understanding Your Data Sovereignty</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              What stays strictly on this device?
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              By default, all personal tasks, SMART Goals, reflection diaries, and focus timer logs
              remain on your device. They are never transmitted to cloud servers unless you explicitly opt in.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              What happens if my device is lost or browser cleared?
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Local-only records cannot be restored from the cloud because they were never uploaded.
              We recommend regularly exporting a JSON backup file below to safely preserve your workspace.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              How does Row Level Security (RLS) work?
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Supabase enforces PostgreSQL RLS policies where{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[10px]">
                auth.uid() = user_id
              </code>
              . Other users cannot read your synchronized records.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              End-to-End Encryption (E2EE) Transparency
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              Standard cloud synchronization protects data against other users, but unencrypted cloud tables remain visible to database operators.
              True zero-knowledge client-side E2EE is in active development.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Export & Purge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onExportJSON}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Export Local JSON Backup</span>
        </button>

        {userEmail && (
          <div className="flex items-center gap-2">
            {!showPurgeConfirm ? (
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(true)}
                className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-medium transition-colors border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Cloud Copy (Keep Local)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800">
                <span className="text-[11px] text-rose-800 dark:text-rose-300 px-2 font-medium">
                  Confirm delete cloud data? Device records will stay local.
                </span>
                <button
                  type="button"
                  onClick={handlePurgeCloudData}
                  disabled={isPurgingCloud}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  {isPurgingCloud ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync Consent & Category Setup Modal */}
      <SyncConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => {
          setIsConsentModalOpen(false);
          refreshAudit();
        }}
        userId={currentUserId}
      />
    </div>
  );
};

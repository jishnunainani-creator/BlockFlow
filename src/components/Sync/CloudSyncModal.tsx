import React, { useRef, useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import {
  X,
  HardDrive,
  Download,
  Upload,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { RestoreBackupModal } from './RestoreBackupModal';
import { BackupInspectionReport } from '../../utils/backupEngine';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { exportJSONBackup, inspectJSONBackup, applyRestoredBackup, addToast } = useTimetable();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inspectionReport, setInspectionReport] = useState<BackupInspectionReport | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const report = inspectJSONBackup(content);
        if (!report.isValid) {
          addToast(report.error || 'Failed to inspect backup file', 'error');
        } else {
          setInspectionReport(report);
          setIsRestoreModalOpen(true);
        }
      }
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = (mode: 'replace' | 'merge') => {
    if (inspectionReport?.normalizedBundle) {
      applyRestoredBackup(inspectionReport.normalizedBundle, mode);
      setIsRestoreModalOpen(false);
      setInspectionReport(null);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Local & Cloud Storage</h3>
                <p className="text-xs text-slate-400">Offline JSON backups & optional Supabase sync</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sync Status Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 mb-6 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                On-Device Storage Active
              </h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400/80 mt-0.5 leading-relaxed">
                Your schedule, tasks, notes, and goals are stored locally on this device. Cloud sync requires sign-in and explicit opt-in in Privacy Settings.
              </p>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3 mb-6">
            {/* Export JSON */}
            <button
              onClick={exportJSONBackup}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Export Workspace Backup (.json)</h4>
                  <p className="text-xs text-slate-400">Download complete schedule, tasks, notes & goals</p>
                </div>
              </div>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Restore Backup (.json)</h4>
                  <p className="text-xs text-slate-400">Inspect file and choose Merge or Replace strategy</p>
                </div>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Footer info */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>On-device local storage (TLS in transit when syncing)</span>
            </span>
            <button onClick={onClose} className="font-bold text-indigo-400 hover:underline">
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Restore Modal with Replace vs Merge dry run */}
      <RestoreBackupModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setInspectionReport(null);
        }}
        report={inspectionReport}
        onConfirmRestore={handleConfirmRestore}
      />
    </>
  );
};

import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  AlertTriangle,
  GitMerge,
  RotateCcw,
  Calendar,
  CheckSquare,
  Target,
  Brain,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BackupInspectionReport } from '../../utils/backupEngine';

interface RestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: BackupInspectionReport | null;
  onConfirmRestore: (mode: 'replace' | 'merge') => void;
}

export const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirmRestore,
}) => {
  const [selectedMode, setSelectedMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen || !report || !report.normalizedBundle) return null;

  const { counts, conflicts, version, exportedAt } = report;
  const formattedDate = exportedAt
    ? new Date(exportedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown date';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 id="restore-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Restore Workspace Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format: <span className="font-semibold text-slate-700 dark:text-slate-300">{version}</span> • Exported: {formattedDate}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Entity Count Pills */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Discovered Records in File
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.scheduledBlocks}</p>
                  <p className="text-[10px] text-slate-400">Scheduled Blocks</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.libraryBlocks}</p>
                  <p className="text-[10px] text-slate-400">Library Activities</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.goals}</p>
                  <p className="text-[10px] text-slate-400">SMART Goals</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.tasks}</p>
                  <p className="text-[10px] text-slate-400">Tasks & Rules</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.assignments}</p>
                  <p className="text-[10px] text-slate-400">Assignments & Logs</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                <Brain className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{counts.thoughts}</p>
                  <p className="text-[10px] text-slate-400">Thought Space Notes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Alert Banner (if collisions exist) */}
          {conflicts.totalConflicts > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h5 className="font-bold text-amber-900 dark:text-amber-200">
                  {conflicts.totalConflicts} Conflicting Item ID{conflicts.totalConflicts > 1 ? 's' : ''} Detected
                </h5>
                <p className="text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                  Some records in this backup share IDs with data currently on your device.
                  Choose <strong>Merge</strong> to preserve both with unique IDs, or <strong>Replace</strong> to overwrite existing records.
                </p>
              </div>
            </div>
          )}

          {/* Strategy Selection */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Choose Restore Strategy
            </h4>

            {/* Merge Option (Recommended) */}
            <div
              onClick={() => setSelectedMode('merge')}
              role="radio"
              aria-checked={selectedMode === 'merge'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMode('merge');
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMode === 'merge'
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    selectedMode === 'merge'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <GitMerge className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Merge With Existing Data
                    </h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Preserves your current workspace records. Non-duplicate items will be appended, and conflicting IDs are automatically given unique identifiers.
                  </p>
                </div>
              </div>
            </div>

            {/* Replace Option */}
            <div
              onClick={() => setSelectedMode('replace')}
              role="radio"
              aria-checked={selectedMode === 'replace'}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedMode('replace');
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMode === 'replace'
                  ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                  : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    selectedMode === 'replace'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Replace Entire Workspace
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Completely replaces your active timetable, goals, tasks, assignments, and notes with the contents of this backup file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirmRestore(selectedMode)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all ${
              selectedMode === 'merge'
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
            }`}
          >
            {selectedMode === 'merge' ? 'Confirm & Merge Records' : 'Confirm & Replace All'}
          </button>
        </div>
      </div>
    </div>
  );
};

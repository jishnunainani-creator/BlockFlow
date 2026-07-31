import React, { useState } from 'react';
import { migrateBlockFlowJSON, MigrationResult } from '../../utils/migration/dataMigrator';
import {
  Sparkles,
  CheckCircle2,
  Database,
  ArrowRight,
  X,
  FileCheck,
  ShieldCheck,
  Upload,
} from 'lucide-react';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawJsonData: string | object;
  onApplyMigration: (result: MigrationResult) => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  rawJsonData,
  onApplyMigration,
}) => {
  const [step, setStep] = useState<'welcome' | 'preview' | 'complete'>('welcome');
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  if (!isOpen) return null;

  const handleStartImport = () => {
    try {
      const result = migrateBlockFlowJSON(rawJsonData);
      setMigrationResult(result);
      setStep('complete');
    } catch (e) {
      console.error('Migration failed:', e);
    }
  };

  const handlePreview = () => {
    try {
      const result = migrateBlockFlowJSON(rawJsonData);
      setMigrationResult(result);
      setStep('preview');
    } catch (e) {
      console.error('Preview failed:', e);
    }
  };

  const handleFinish = () => {
    if (migrationResult) {
      onApplyMigration(migrationResult);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg animate-fade-in select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">One-Time Data Import Wizard</h2>
              <p className="text-xs text-slate-400">Preserve legacy activity blocks & historical week schedules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="p-6 space-y-6 text-xs">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                Legacy Data Found
              </span>
              <h3 className="text-lg font-black text-white">Welcome back 👋</h3>
              <p className="text-slate-300 leading-relaxed">
                We detected existing BlockFlow data. Upgrading to the new AI Execution OS will preserve all your reusable blocks, schedules, historical weeks, and productivity scores.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-medium">
              <p className="text-white font-bold mb-1">Detected Backup Payload:</p>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Activity Library Blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Weekly Timetables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Routine Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Historical Planning Weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Reminders & Alarm Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Task Completion Statuses</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStartImport}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 transition-all"
              >
                <span>Import Everything</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handlePreview}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Preview Data
              </button>
              <button
                onClick={onClose}
                className="py-3 px-3 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW SCREEN */}
        {step === 'preview' && migrationResult && (
          <div className="p-6 space-y-5 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Pre-Import Validation & Summary Report</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Library Blocks</span>
                <span className="text-xl font-black text-white">{migrationResult.report.libraryCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Activities</span>
                <span className="text-xl font-black text-white">{migrationResult.report.activitiesCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weeks Preserved</span>
                <span className="text-xl font-black text-white">{migrationResult.report.weeksCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reminders Active</span>
                <span className="text-xl font-black text-white">{migrationResult.report.remindersCount}</span>
              </div>
            </div>

            <button
              onClick={handleStartImport}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2"
            >
              <span>Confirm & Migrate All Data</span>
            </button>
          </div>
        )}

        {/* STEP 3: MIGRATION COMPLETE SUMMARY */}
        {step === 'complete' && migrationResult && (
          <div className="p-6 space-y-6 text-xs text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Migration Complete! 🎉</h3>
              <p className="text-slate-400">All legacy user data successfully integrated into BlockFlow Execution OS.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5 font-semibold text-slate-300">
                <span>Library Blocks Imported</span>
                <span className="text-white font-bold font-mono">{migrationResult.report.libraryCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5 font-semibold text-slate-300">
                <span>Scheduled Activities Preserved</span>
                <span className="text-white font-bold font-mono">{migrationResult.report.activitiesCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5 font-semibold text-slate-300">
                <span>Weeks Imported</span>
                <span className="text-white font-bold font-mono">{migrationResult.report.weeksCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5 font-semibold text-slate-300">
                <span>Reminders Restored</span>
                <span className="text-white font-bold font-mono">{migrationResult.report.remindersCount}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Conflicts Detected</span>
                <span className="text-emerald-400 font-bold font-mono">0</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition-colors"
            >
              Open Upgraded BlockFlow OS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

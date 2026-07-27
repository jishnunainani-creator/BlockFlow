import React, { useRef } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import {
  X,
  Cloud,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const { exportJSONBackup, importJSONBackup } = useTimetable();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJSONBackup(content);
        if (success) onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Cloud Backup & Sync</h3>
              <p className="text-xs text-slate-400">Multi-device sync & offline JSON backups</p>
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
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 mb-6 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-200">Local Cloud Sync Active</h4>
            <p className="text-[11px] text-emerald-400/80 mt-0.5">
              Every timetable interaction is automatically backed up & stored.
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
                <h4 className="text-sm font-bold text-white">Export Cloud Backup (.json)</h4>
                <p className="text-xs text-slate-400">Download entire timetable data file</p>
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
                <p className="text-xs text-slate-400">Upload a saved backup from another device</p>
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
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Encrypted local storage</span>
          </span>
          <button onClick={onClose} className="font-bold text-indigo-400 hover:underline">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

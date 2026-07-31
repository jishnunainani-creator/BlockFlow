import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getWeekDateRangeLabel } from '../../utils/timeUtils';
import {
  X,
  Printer,
  FileText,
  Check,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current view mode from TimetableGrid: 'workweek' (5 days) or 'fullweek' (7 days) */
  viewMode?: 'workweek' | 'fullweek';
  /** Print options handler passed to parent or applied directly */
  onApplyPrintConfig?: (config: {
    paperSize: 'a4' | 'letter';
    orientation: 'landscape' | 'portrait';
    includeWeekTitle: boolean;
    includeDateRange: boolean;
    includeActivityColors: boolean;
    userName: string;
    includeBranding: boolean;
  }) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  viewMode = 'workweek',
  onApplyPrintConfig,
}) => {
  const { currentWeekId, addToast } = useTimetable();

  // ── Pre-Export Dialog Form State ───────────────────────────────────────────
  const [format, setFormat]                   = useState<'pdf' | 'print'>('pdf');
  const [paperSize, setPaperSize]             = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation]       = useState<'landscape' | 'portrait'>('landscape');
  const [includeWeekTitle, setIncludeWeekTitle] = useState(true);
  const [includeDateRange, setIncludeDateRange] = useState(true);
  const [includeActivityColors, setIncludeActivityColors] = useState(true);
  const [userName, setUserName]               = useState('');
  const [includeBranding, setIncludeBranding] = useState(true);

  if (!isOpen) return null;

  const dateRangeLabel = getWeekDateRangeLabel(currentWeekId);

  const handleExport = () => {
    // Pass configured settings up
    if (onApplyPrintConfig) {
      onApplyPrintConfig({
        paperSize,
        orientation,
        includeWeekTitle,
        includeDateRange,
        includeActivityColors,
        userName,
        includeBranding,
      });
    }

    addToast('Opening native PDF print dialog...', 'info');
    onClose();

    // Trigger browser native print dialog after modal closes
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      
      {/* ── PROFESSIONAL PRE-EXPORT DIALOG ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export Timetable Calendar</h3>
              <p className="text-xs text-slate-400">
                {viewMode === 'workweek' ? 'Work Week (5 Days)' : 'Full Week (7 Days)'} · {dateRangeLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Format Choice */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Format
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setFormat('pdf')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                format === 'pdf'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${format === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Save as PDF</p>
                <p className="text-[10px] opacity-60">Crisp vector PDF document</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat('print')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                format === 'print'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${format === 'print' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Print Calendar</p>
                <p className="text-[10px] opacity-60">Send directly to printer</p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Paper Size & Orientation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Paper Size
            </label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPaperSize('a4')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  paperSize === 'a4' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('letter')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  paperSize === 'letter' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Letter
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Orientation
            </label>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orientation === 'landscape' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  orientation === 'portrait' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portrait
              </button>
            </div>
          </div>
        </div>

        {/* 3. Included Metadata Toggles */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Include Metadata
          </label>
          <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWeekTitle}
                  onChange={(e) => setIncludeWeekTitle(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>Week Title</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDateRange}
                  onChange={(e) => setIncludeDateRange(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>Date Range</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeActivityColors}
                  onChange={(e) => setIncludeActivityColors(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>Activity Colors</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBranding}
                  onChange={(e) => setIncludeBranding(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>BlockFlow Branding</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                User / Student Name (Optional)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Alex Johnson (Semester 3)"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{format === 'print' ? 'Print Calendar' : 'Export & Save PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

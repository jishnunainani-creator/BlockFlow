import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getWeekDateRangeLabel } from '../../utils/timeUtils';
import html2canvas from 'html2canvas';
import {
  X,
  Download,
  FileImage,
  Printer,
  Loader2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { currentWeekId, addToast } = useTimetable();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'png' | 'pdf'>('png');

  if (!isOpen) return null;

  const dateRangeLabel = getWeekDateRangeLabel(currentWeekId);

  const handleExport = async () => {
    const gridElement = document.getElementById('timetable-printable-area');
    if (!gridElement) {
      addToast('Timetable element not found', 'error');
      return;
    }

    setIsExporting(true);

    try {
      if (exportType === 'png') {
        addToast('Generating PNG image...', 'info');
        const canvas = await html2canvas(gridElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#090d16',
          logging: false,
        });

        const imageURI = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `BlockFlow_Timetable_${currentWeekId}.png`;
        link.href = imageURI;
        link.click();
        addToast('Exported BlockFlow Timetable as PNG image!', 'success');
      } else {
        addToast('Opening print setup for PDF export...', 'info');
        window.print();
        addToast('PDF print dialog triggered', 'success');
      }
      onClose();
    } catch (err) {
      console.error('Export error', err);
      addToast('Failed to export timetable', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-hidden relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export BlockFlow Schedule</h3>
              <p className="text-xs text-slate-400">{dateRangeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Format
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* PNG Option */}
            <button
              onClick={() => setExportType('png')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all ${
                exportType === 'png'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  exportType === 'png' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileImage className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">PNG Image</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">High-res picture for sharing</p>
              </div>
            </button>

            {/* PDF Option */}
            <button
              onClick={() => setExportType('pdf')}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border text-center transition-all ${
                exportType === 'pdf'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-3 rounded-xl ${
                  exportType === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Print / Save PDF</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Printable vector document</p>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{exportType === 'png' ? 'Download PNG' : 'Save as PDF'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

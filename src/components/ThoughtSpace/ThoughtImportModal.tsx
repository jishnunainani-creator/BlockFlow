import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ThoughtNote, ThoughtImportValidation } from '../../types/thoughtSpace';
import {
  validateThoughtBackup,
  applyThoughtImport,
} from '../../utils/thoughtSpaceEngine';

interface ThoughtImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNotes: ThoughtNote[];
  onImportComplete: (finalNotes: ThoughtNote[], summaryText: string) => void;
}

export const ThoughtImportModal: React.FC<ThoughtImportModalProps> = ({
  isOpen,
  onClose,
  existingNotes,
  onImportComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ThoughtImportValidation | null>(null);
  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge');
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMsg('Please select a valid .json backup file.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const val = validateThoughtBackup(content, existingNotes);
      setValidation(val);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file from disk.');
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!validation || !validation.isValid || !validation.sanitizedNotes.length) return;

    if (strategy === 'replace' && !replaceConfirmed) {
      setErrorMsg('Please confirm you want to replace all current notes.');
      return;
    }

    try {
      const result = applyThoughtImport(validation.sanitizedNotes, existingNotes, strategy);
      const summaryText = strategy === 'replace'
        ? `Replaced existing thoughts with ${validation.totalNotes} imported notes.`
        : `Successfully merged ${validation.totalNotes} notes (${validation.duplicateIdsCount} duplicate IDs remapped).`;

      onImportComplete(result, summaryText);
      handleClose();
    } catch (err: any) {
      setErrorMsg(`Import failed: ${err.message || String(err)}`);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setValidation(null);
    setStrategy('merge');
    setReplaceConfirmed(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Thought Space Notes
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Restore or transfer notes from a previously exported JSON backup
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* File Picker */}
          {!validation ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors space-y-2 bg-slate-50/50 dark:bg-slate-950/30"
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drop your JSON backup file
              </p>
              <p className="text-[11px] text-slate-400">
                File is processed 100% locally in your browser. Nothing is sent to any server.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {selectedFile?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setValidation(null);
                    setSelectedFile(null);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                >
                  Change file
                </button>
              </div>

              {/* Validation Summary Preview */}
              {validation.isValid ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Backup Verified: Ready to Import</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
                      <span className="font-bold text-slate-900 dark:text-white text-base block">
                        {validation.totalNotes}
                      </span>
                      <span className="text-slate-500">Total Notes</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
                      <span className="font-bold text-slate-900 dark:text-white text-base block">
                        {validation.rootNotesCount}
                      </span>
                      <span className="text-slate-500">Top-Level</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center">
                      <span className="font-bold text-slate-900 dark:text-white text-base block">
                        {validation.subnotesCount}
                      </span>
                      <span className="text-slate-500">Subnotes</span>
                    </div>
                  </div>

                  {validation.duplicateIdsCount > 0 && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 pt-1">
                      ℹ {validation.duplicateIdsCount} {validation.duplicateIdsCount === 1 ? 'note shares an' : 'notes share'} existing ID. In merge mode, new unique IDs will be safely assigned.
                    </p>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/60 space-y-1">
                      {validation.warnings.map((w, idx) => (
                        <p key={idx} className="text-[10px] text-slate-500 dark:text-slate-400">
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>File Validation Errors</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    {validation.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strategy Choice: Merge vs Replace */}
              {validation.isValid && (
                <div className="space-y-2 pt-2">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Import Strategy
                  </label>

                  <div className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        strategy === 'merge'
                          ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importStrategy"
                        checked={strategy === 'merge'}
                        onChange={() => {
                          setStrategy('merge');
                          setReplaceConfirmed(false);
                        }}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          Merge with existing notes (Recommended)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Adds imported thoughts into your space. Existing notes are preserved; colliding IDs are assigned fresh IDs.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        strategy === 'replace'
                          ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importStrategy"
                        checked={strategy === 'replace'}
                        onChange={() => setStrategy('replace')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          Replace all existing thoughts
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Replaces all {existingNotes.length} existing local thoughts with the imported backup.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Explicit confirmation for replace */}
                  {strategy === 'replace' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={replaceConfirmed}
                          onChange={(e) => setReplaceConfirmed(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span className="font-medium text-amber-900 dark:text-amber-200 text-[11px]">
                          I understand this will overwrite my {existingNotes.length} current notes on this device.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          {validation && validation.isValid && (
            <button
              type="button"
              onClick={handleApplyImport}
              disabled={strategy === 'replace' && !replaceConfirmed}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>{strategy === 'replace' ? 'Confirm & Replace All' : 'Merge Notes'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

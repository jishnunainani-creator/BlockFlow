/**
 * Planner CSV Import Modal
 * Upload or paste CSV data, review detected headers, inspect a 5-row preview,
 * map columns, and safely import rows into the active planner.
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { PlannerColumn, PlannerRow } from '../../types/customPlanner';
import {
  getCsvPreview,
  mapCsvToPlannerRows,
  CsvPreviewResult,
} from '../../utils/customPlannerCsv';

interface PlannerCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannerId: string;
  columns: PlannerColumn[];
  onImport: (rows: PlannerRow[], replace: boolean) => void;
}

export const PlannerCsvImportModal: React.FC<PlannerCsvImportModalProps> = ({
  isOpen,
  onClose,
  plannerId,
  columns,
  onImport,
}) => {
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // csvHeader -> columnId
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      processCsvContent(content);
    };
    reader.onerror = () => {
      setError('Failed to read the selected CSV file.');
    };
    reader.readAsText(file);
  };

  const processCsvContent = (content: string) => {
    try {
      setCsvText(content);
      const res = getCsvPreview(content);
      if (res.headers.length === 0 || res.totalRows === 0) {
        setError('The CSV appears to be empty or contains no parseable data.');
        setPreview(null);
        return;
      }

      setPreview(res);

      // Auto-suggest mappings by matching names case-insensitively
      const mapping: Record<string, string> = {};
      res.headers.forEach((header) => {
        const cleanedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedCol = columns.find((c) => {
          const colCleaned = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return (
            colCleaned === cleanedHeader ||
            colCleaned.includes(cleanedHeader) ||
            cleanedHeader.includes(colCleaned)
          );
        });

        if (matchedCol) {
          mapping[header] = matchedCol.id;
        }
      });
      setColumnMapping(mapping);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Error parsing CSV file.');
      setPreview(null);
    }
  };

  const handleMappingChange = (csvHeader: string, columnId: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvHeader]: columnId,
    }));
  };

  const handleConfirmImport = () => {
    if (!preview || preview.rawRows.length === 0) {
      setError('No rows available to import.');
      return;
    }

    try {
      const rows = mapCsvToPlannerRows(
        preview.rawRows,
        columns,
        plannerId,
        columnMapping
      );

      onImport(rows, replaceExisting);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete CSV import.');
    }
  };

  const handleReset = () => {
    setCsvText('');
    setFileName('');
    setPreview(null);
    setColumnMapping({});
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="csv-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Import Schedule from CSV
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a CSV spreadsheet to populate or append rows to your planner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close CSV Import"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!preview ? (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to upload CSV or drag and drop
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Supports comma-separated files (.csv) following RFC 4180 standard
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Paste CSV textarea fallback */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Or paste raw CSV text:
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Subject,Course Code,Date,Start Time,Duration&#10;Computer Networks,CS401,2026-11-10,09:00,120"
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                {csvText.trim() && (
                  <button
                    onClick={() => processCsvContent(csvText)}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    Parse Pasted Text
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Preview & Column Mapping Stage */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Detected <strong>{preview.headers.length}</strong> columns and{' '}
                    <strong>{preview.totalRows}</strong> rows
                    {fileName ? ` from "${fileName}"` : ''}
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Choose another file
                </button>
              </div>

              {/* Column Mapping Configuration */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Map CSV Columns to Planner Fields
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                  {preview.headers.map((csvHeader) => (
                    <div
                      key={csvHeader}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-2"
                    >
                      <div className="truncate text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          CSV Column:
                        </span>
                        {csvHeader}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={columnMapping[csvHeader] || ''}
                        onChange={(e) => handleMappingChange(csvHeader, e.target.value)}
                        className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">(Ignore)</option>
                        {columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name} ({col.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Row Preview Table */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview First {preview.previewRows.length} Rows</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        {preview.headers.map((h) => (
                          <th key={h} className="px-3 py-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.previewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          {preview.headers.map((h) => (
                            <td
                              key={h}
                              className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[150px] truncate"
                            >
                              {r[h] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Options */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Replace all existing rows in this planner (default is to append new rows)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          {preview && (
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-2"
            >
              <span>Import {preview.totalRows} Rows</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

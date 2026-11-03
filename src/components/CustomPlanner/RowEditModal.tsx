/**
 * Dynamic Row Edit / Create Modal for Custom Planners
 * Renders appropriate input widgets based on dynamic column types.
 */

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Clock, Calendar, Hash, Type, ChevronDown } from 'lucide-react';
import { PlannerColumn, PlannerRow } from '../../types/customPlanner';
import { IconPickerModal } from './IconPickerModal';
import { getIconComponent } from '../../utils/iconLibrary';
import { calculateEndTime } from '../../utils/examScheduleEngine';

interface RowEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  columns: PlannerColumn[];
  initialValues?: Record<string, any>;
  title?: string;
}

export const RowEditModal: React.FC<RowEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  columns,
  initialValues = {},
  title = 'Edit Row',
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [iconPickerColId, setIconPickerColId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, any> = { ...initialValues };
      // Apply defaults for unpopulated columns
      columns.forEach((col) => {
        if (initialMap[col.id] === undefined) {
          if (col.type === 'checkbox') initialMap[col.id] = false;
          else if (col.type === 'number') initialMap[col.id] = col.defaultValue ?? '';
          else if (col.type === 'status' && col.options && col.options.length > 0) {
            initialMap[col.id] = col.options[0].id;
          } else if (col.type === 'dropdown' && col.options && col.options.length > 0) {
            initialMap[col.id] = col.options[0].id;
          } else if (col.type === 'icon') {
            initialMap[col.id] = 'GraduationCap';
          } else {
            initialMap[col.id] = col.defaultValue ?? '';
          }
        }
      });
      setValues(initialMap);
    }
  }, [isOpen, initialValues, columns]);

  if (!isOpen) return null;

  const handleChange = (colId: string, val: any) => {
    setValues((prev) => {
      const next = { ...prev, [colId]: val };

      // Auto-compute end_time if start_time or duration was changed
      const startCol = columns.find((c) => c.id === 'col_start_time' || c.name.toLowerCase().includes('start time'));
      const durCol = columns.find((c) => c.id === 'col_duration' || c.name.toLowerCase().includes('duration'));
      const endCol = columns.find((c) => c.id === 'col_end_time' || c.name.toLowerCase().includes('end time'));

      if (startCol && durCol && endCol && (colId === startCol.id || colId === durCol.id)) {
        const sTime = next[startCol.id];
        const dur = Number(next[durCol.id]);
        if (sTime && dur > 0) {
          next[endCol.id] = calculateEndTime(sTime, dur);
        }
      }

      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 scrollbar-thin flex-1 text-xs">
          {columns.map((col) => {
            const val = values[col.id];

            if (col.type === 'icon') {
              const IconComp = getIconComponent(val);
              return (
                <div key={col.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                      {col.name}
                    </label>
                    <span className="text-[11px] text-slate-400">Click to change icon</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIconPickerColId(col.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-indigo-500 transition-colors shadow-xs"
                  >
                    <IconComp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">{val || 'Choose Icon'}</span>
                  </button>
                </div>
              );
            }

            if (col.type === 'checkbox') {
              return (
                <div
                  key={col.id}
                  onClick={() => handleChange(col.id, !val)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    {col.name}
                  </label>
                  <input
                    type="checkbox"
                    checked={Boolean(val)}
                    onChange={(e) => handleChange(col.id, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                </div>
              );
            }

            if (col.type === 'status' || col.type === 'dropdown') {
              const options = col.options || [];
              return (
                <div key={col.id}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                    {col.name} {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  <select
                    value={val || ''}
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {options.map((opt) => (
                      <option
                        key={opt.id}
                        value={opt.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (col.type === 'date') {
              return (
                <div key={col.id}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                    {col.name} {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="date"
                    required={col.required}
                    value={val || ''}
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              );
            }

            if (col.type === 'time') {
              return (
                <div key={col.id}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                    {col.name} {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="time"
                    required={col.required}
                    value={val || ''}
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              );
            }

            if (col.type === 'number') {
              return (
                <div key={col.id}>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                    {col.name} {col.required && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="number"
                    required={col.required}
                    value={val === undefined ? '' : val}
                    onChange={(e) => handleChange(col.id, e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Enter number..."
                  />
                </div>
              );
            }

            // Default: 'text' (multiline if notes or description)
            const isMultiline = col.name.toLowerCase().includes('notes') || col.name.toLowerCase().includes('description');
            return (
              <div key={col.id}>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                  {col.name} {col.required && <span className="text-rose-500">*</span>}
                </label>
                {isMultiline ? (
                  <textarea
                    rows={3}
                    value={val || ''}
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    placeholder={`Enter ${col.name.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type="text"
                    required={col.required}
                    value={val || ''}
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder={`Enter ${col.name.toLowerCase()}...`}
                  />
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Save Row
            </button>
          </div>
        </form>

        {/* Embedded Icon Picker if user clicked an icon field */}
        {iconPickerColId && (
          <IconPickerModal
            isOpen={Boolean(iconPickerColId)}
            onClose={() => setIconPickerColId(null)}
            selectedIcon={values[iconPickerColId]}
            onSelectIcon={(iconName) => {
              handleChange(iconPickerColId, iconName);
              setIconPickerColId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

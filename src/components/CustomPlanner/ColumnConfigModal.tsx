/**
 * Custom Column Configuration Modal
 * Allows adding, renaming, reordering, deleting, and toggling visibility of planner columns.
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Type,
  Hash,
  Calendar,
  Clock,
  CheckSquare,
  List,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { ColumnType, PlannerColumn, DropdownOption } from '../../types/customPlanner';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: PlannerColumn[];
  onSaveColumns: (updatedColumns: PlannerColumn[]) => void;
}

const COLUMN_TYPES: Array<{ type: ColumnType; label: string; icon: string }> = [
  { type: 'text', label: 'Text', icon: 'Type' },
  { type: 'number', label: 'Number', icon: 'Hash' },
  { type: 'date', label: 'Date', icon: 'Calendar' },
  { type: 'time', label: 'Time', icon: 'Clock' },
  { type: 'dropdown', label: 'Dropdown', icon: 'List' },
  { type: 'status', label: 'Status Pill', icon: 'CheckSquare' },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { type: 'icon', label: 'Icon', icon: 'Sparkles' },
];

export const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({
  isOpen,
  onClose,
  columns,
  onSaveColumns,
}) => {
  const [localColumns, setLocalColumns] = useState<PlannerColumn[]>(() => [...columns]);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localColumns.length) return;

    const copy = [...localColumns];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Update orders
    copy.forEach((c, i) => {
      c.order = i;
    });

    setLocalColumns(copy);
  };

  const handleToggleVisibility = (id: string) => {
    setLocalColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleRename = (id: string, name: string) => {
    setLocalColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleDelete = (id: string) => {
    if (localColumns.length <= 1) {
      alert('A planner table must have at least one column.');
      return;
    }
    setLocalColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const id = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let options: DropdownOption[] | undefined;

    if (newColType === 'status') {
      options = [
        { id: 'not_started', label: 'Not Started', color: '#EF4444' },
        { id: 'in_progress', label: 'In Progress', color: '#F59E0B' },
        { id: 'done', label: 'Completed', color: '#10B981' },
      ];
    } else if (newColType === 'dropdown') {
      options = [
        { id: 'option_1', label: 'Option 1', color: '#3B82F6' },
        { id: 'option_2', label: 'Option 2', color: '#10B981' },
        { id: 'option_3', label: 'Option 3', color: '#F59E0B' },
      ];
    }

    const newCol: PlannerColumn = {
      id,
      name: newColName.trim(),
      type: newColType,
      visible: true,
      order: localColumns.length,
      width: newColType === 'icon' ? 80 : 160,
      options,
    };

    setLocalColumns([...localColumns, newCol]);
    setNewColName('');
    setNewColType('text');
  };

  const handleApply = () => {
    onSaveColumns(localColumns);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Custom Table Columns</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Add custom columns, choose data types, reorder, or toggle column visibility.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Existing Columns List */}
        <div className="p-6 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin text-xs">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Active Columns ({localColumns.length})
          </label>

          {localColumns.map((col, idx) => (
            <div
              key={col.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                col.visible
                  ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-100/50 dark:bg-slate-950/20 border-dashed border-slate-300 dark:border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-[10px] font-mono text-slate-400 w-4 text-center">{idx + 1}</span>

                <input
                  type="text"
                  value={col.name}
                  onChange={(e) => handleRename(col.id, e.target.value)}
                  className="font-semibold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 rounded truncate flex-1"
                />

                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  {col.type}
                </span>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(col.id)}
                  title={col.visible ? 'Hide column' : 'Show column'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    col.visible
                      ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                  }`}
                >
                  {col.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ArrowUp size={14} />
                </button>

                <button
                  type="button"
                  disabled={idx === localColumns.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ArrowDown size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(col.id)}
                  title="Delete column"
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Column Bar */}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Add New Column
            </label>
            <form onSubmit={handleAddColumn} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Column name (e.g., Instructor, Room, Link)..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />

              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value as ColumnType)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shrink-0"
              >
                {COLUMN_TYPES.map((t) => (
                  <option key={t.type} value={t.type} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {t.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!newColName.trim()}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 text-xs">
          <span className="text-[11px] text-slate-400">
            Changes apply to all current and future rows in this planner.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Apply Columns
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

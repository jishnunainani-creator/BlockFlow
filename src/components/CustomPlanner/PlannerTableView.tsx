/**
 * Planner Table View
 * Clean structured table with sticky headers, column sorting, search filtering,
 * inline/modal row editing, and compact/comfortable density toggle.
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Check,
  Plus,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import {
  PlannerColumn,
  PlannerRow,
  TableDensity,
} from '../../types/customPlanner';
import { getIconComponent } from '../../utils/iconLibrary';

interface PlannerTableViewProps {
  columns: PlannerColumn[];
  rows: PlannerRow[];
  density: TableDensity;
  onEditRow: (row: PlannerRow) => void;
  onDeleteRow: (rowId: string) => void;
  onUpdateRowValues: (rowId: string, values: Record<string, any>) => void;
  searchQuery?: string;
}

export const PlannerTableView: React.FC<PlannerTableViewProps> = ({
  columns,
  rows,
  density,
  onEditRow,
  onDeleteRow,
  onUpdateRowValues,
  searchQuery = '',
}) => {
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const visibleColumns = useMemo(() => {
    return [...columns].filter((c) => c.visible).sort((a, b) => a.order - b.order);
  }, [columns]);

  const handleSort = (colId: string) => {
    if (sortColId === colId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColId(null);
        setSortDirection('asc');
      }
    } else {
      setSortColId(colId);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Search query filter across all column values
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((row) => {
        return Object.values(row.values).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort by active column
    if (sortColId) {
      const targetCol = columns.find((c) => c.id === sortColId);
      result.sort((a, b) => {
        const valA = a.values[sortColId];
        const valB = b.values[sortColId];

        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comp = 0;
        if (targetCol?.type === 'number') {
          comp = Number(valA) - Number(valB);
        } else {
          comp = String(valA).localeCompare(String(valB));
        }

        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [rows, searchQuery, sortColId, sortDirection, columns]);

  const rowPaddingClass = density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4';

  if (visibleColumns.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <p className="text-sm font-semibold">All columns are currently hidden.</p>
        <p className="text-xs text-slate-500 mt-1">Open Column Settings above to show table columns.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse text-xs select-text">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-10 text-center select-none">
                #
              </th>
              {visibleColumns.map((col) => {
                const isSorted = sortColId === col.id;
                return (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col.id)}
                    style={{ minWidth: col.width ? `${col.width}px` : '140px' }}
                    className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {col.name}
                      </span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp size={12} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <ArrowDown size={12} className="text-indigo-600 dark:text-indigo-400" />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16 text-right pr-4 select-none">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredAndSortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="py-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">No entries found matching your criteria</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Click "+ Add Row" above to create an entry.</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedRows.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onEditRow(row)}
                >
                  {/* Row Index */}
                  <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400 text-center select-none">
                    {rowIdx + 1}
                  </td>

                  {/* Dynamic Column Cells */}
                  {visibleColumns.map((col) => {
                    const val = row.values[col.id];

                    if (col.type === 'icon') {
                      const IconComp = getIconComponent(val);
                      return (
                        <td key={col.id} className={rowPaddingClass}>
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                        </td>
                      );
                    }

                    if (col.type === 'checkbox') {
                      return (
                        <td
                          key={col.id}
                          className={rowPaddingClass}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRowValues(row.id, { [col.id]: !val });
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                              val
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                            }`}
                          >
                            {val && <Check size={12} className="stroke-[3]" />}
                          </div>
                        </td>
                      );
                    }

                    if (col.type === 'status' || col.type === 'dropdown') {
                      const opt = col.options?.find((o) => o.id === val);
                      return (
                        <td key={col.id} className={rowPaddingClass}>
                          {opt ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-2xs"
                              style={{
                                backgroundColor: `${opt.color}15`,
                                borderColor: `${opt.color}40`,
                                color: opt.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      );
                    }

                    if (col.type === 'date') {
                      return (
                        <td key={col.id} className={`${rowPaddingClass} font-mono text-[11px] text-slate-700 dark:text-slate-300`}>
                          {val || '—'}
                        </td>
                      );
                    }

                    if (col.type === 'time') {
                      return (
                        <td key={col.id} className={`${rowPaddingClass} font-mono text-[11px] text-slate-700 dark:text-slate-300`}>
                          {val || '—'}
                        </td>
                      );
                    }

                    if (col.type === 'number') {
                      return (
                        <td key={col.id} className={`${rowPaddingClass} font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200`}>
                          {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                        </td>
                      );
                    }

                    // Default 'text'
                    return (
                      <td key={col.id} className={`${rowPaddingClass} font-medium text-slate-900 dark:text-white max-w-xs truncate`}>
                        {val || '—'}
                      </td>
                    );
                  })}

                  {/* Actions Column */}
                  <td className="py-2.5 px-3 text-right pr-4 select-none">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRow(row);
                        }}
                        title="Edit row"
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this row?')) onDeleteRow(row.id);
                        }}
                        title="Delete row"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

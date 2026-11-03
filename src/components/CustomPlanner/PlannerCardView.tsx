/**
 * Planner Card View
 * Renders planner rows as visual, structured cards with icons, status pills,
 * date badges, and quick-action triggers.
 */

import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PlannerColumn, PlannerRow } from '../../types/customPlanner';
import { getIconComponent } from '../../utils/iconLibrary';

interface PlannerCardViewProps {
  columns: PlannerColumn[];
  rows: PlannerRow[];
  onEditRow: (row: PlannerRow) => void;
  onDeleteRow: (rowId: string) => void;
  searchQuery?: string;
}

export const PlannerCardView: React.FC<PlannerCardViewProps> = ({
  columns,
  rows,
  onEditRow,
  onDeleteRow,
  searchQuery = '',
}) => {
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((row) =>
      Object.values(row.values).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, searchQuery]);

  // Identify key semantic columns
  const iconCol = columns.find((c) => c.type === 'icon');
  const titleCol = columns.find((c) => c.type === 'text' && (c.name.toLowerCase().includes('subject') || c.name.toLowerCase().includes('title') || c.name.toLowerCase().includes('name') || c.name.toLowerCase().includes('task') || c.name.toLowerCase().includes('goal') || c.name.toLowerCase().includes('event') || c.name.toLowerCase().includes('workout')));
  const subtitleCol = columns.find((c) => c.type === 'text' && (c.name.toLowerCase().includes('code') || c.name.toLowerCase().includes('phase') || c.name.toLowerCase().includes('category') || c.name.toLowerCase().includes('course') || c.name.toLowerCase().includes('muscle')));
  const dateCol = columns.find((c) => c.type === 'date');
  const timeCol = columns.find((c) => c.type === 'time');
  const statusCol = columns.find((c) => c.type === 'status');
  const venueCol = columns.find((c) => c.type === 'text' && (c.name.toLowerCase().includes('venue') || c.name.toLowerCase().includes('location') || c.name.toLowerCase().includes('hall') || c.name.toLowerCase().includes('room')));
  const notesCol = columns.find((c) => c.type === 'text' && (c.name.toLowerCase().includes('notes') || c.name.toLowerCase().includes('description')));

  if (filteredRows.length === 0) {
    return (
      <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
        <Sparkles className="w-8 h-8 text-slate-400 mx-auto opacity-50 mb-2" />
        <p className="text-sm font-semibold">No cards found matching your query</p>
        <p className="text-xs text-slate-500 mt-0.5">Add a new row above to populate this view.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRows.map((row) => {
        const iconName = iconCol ? row.values[iconCol.id] : 'Calendar';
        const IconComponent = getIconComponent(iconName);

        const titleText = (titleCol ? row.values[titleCol.id] : '') || Object.values(row.values).find((v) => typeof v === 'string' && v.length > 0) || 'Untitled';
        const subtitleText = subtitleCol ? row.values[subtitleCol.id] : '';
        const dateText = dateCol ? row.values[dateCol.id] : '';
        const timeText = timeCol ? row.values[timeCol.id] : '';
        const venueText = venueCol ? row.values[venueCol.id] : '';
        const notesText = notesCol ? row.values[notesCol.id] : '';

        // Status option
        const statusVal = statusCol ? row.values[statusCol.id] : '';
        const statusOption = statusCol?.options?.find((o) => o.id === statusVal);

        return (
          <div
            key={row.id}
            onClick={() => onEditRow(row)}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-indigo-400/60 dark:hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header: Icon, Subtitle, Status Pill */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1.5">
                  {statusOption && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-2xs"
                      style={{
                        backgroundColor: `${statusOption.color}15`,
                        borderColor: `${statusOption.color}40`,
                        color: statusOption.color,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
                        style={{ backgroundColor: statusOption.color }}
                      />
                      {statusOption.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              {subtitleText && (
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  {subtitleText}
                </span>
              )}

              <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {titleText}
              </h4>

              {/* Date, Time & Venue Chips */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                {dateText && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{dateText}</span>
                  </span>
                )}

                {timeText && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <Clock size={12} className="text-slate-400" />
                    <span>{timeText}</span>
                  </span>
                )}

                {venueText && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] max-w-[180px] truncate">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{venueText}</span>
                  </span>
                )}
              </div>

              {/* Notes Snippet */}
              {notesText && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/60 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  {notesText}
                </p>
              )}
            </div>

            {/* Footer with Quick Action Icons */}
            <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                <span>View Details</span>
                <ArrowRight size={12} />
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onEditRow(row)}
                  title="Edit entry"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this entry?')) onDeleteRow(row.id);
                  }}
                  title="Delete entry"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

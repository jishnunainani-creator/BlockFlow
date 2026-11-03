/**
 * Planner Calendar View
 * Monthly and weekly views displaying planner items on relevant dates,
 * color-coded by status/category, with interactive inspection and creation.
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PlannerColumn, PlannerRow } from '../../types/customPlanner';
import { getIconComponent } from '../../utils/iconLibrary';

interface PlannerCalendarViewProps {
  columns: PlannerColumn[];
  rows: PlannerRow[];
  onEditRow: (row: PlannerRow) => void;
  onAddRowWithDate?: (dateStr: string) => void;
  accentColor?: string;
}

type CalendarViewMode = 'month' | 'week';

export const PlannerCalendarView: React.FC<PlannerCalendarViewProps> = ({
  columns,
  rows,
  onEditRow,
  onAddRowWithDate,
  accentColor = '#4F73E3',
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Detect semantic columns
  const dateCol = useMemo(
    () =>
      columns.find((c) => c.type === 'date') ||
      columns.find((c) => c.name.toLowerCase().includes('date')),
    [columns]
  );

  const timeCol = useMemo(
    () =>
      columns.find((c) => c.type === 'time') ||
      columns.find((c) => c.name.toLowerCase().includes('time')),
    [columns]
  );

  const titleCol = useMemo(
    () =>
      columns.find(
        (c) =>
          c.type === 'text' &&
          (c.name.toLowerCase().includes('subject') ||
            c.name.toLowerCase().includes('title') ||
            c.name.toLowerCase().includes('name') ||
            c.name.toLowerCase().includes('task') ||
            c.name.toLowerCase().includes('goal') ||
            c.name.toLowerCase().includes('event') ||
            c.name.toLowerCase().includes('workout'))
      ) || columns.find((c) => c.type === 'text'),
    [columns]
  );

  const iconCol = useMemo(() => columns.find((c) => c.type === 'icon'), [columns]);
  const statusCol = useMemo(
    () =>
      columns.find((c) => c.type === 'status') ||
      columns.find((c) => c.type === 'dropdown'),
    [columns]
  );

  // Group rows by Date String (YYYY-MM-DD)
  const rowsByDate = useMemo(() => {
    const map = new Map<string, PlannerRow[]>();
    if (!dateCol) return map;

    rows.forEach((row) => {
      const rawDate = row.values[dateCol.id];
      if (rawDate && typeof rawDate === 'string') {
        // Normalise date string to YYYY-MM-DD
        const dateKey = rawDate.slice(0, 10);
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(row);
      }
    });

    // Sort events within each day by time
    if (timeCol) {
      map.forEach((dayRows) => {
        dayRows.sort((a, b) => {
          const tA = String(a.values[timeCol.id] || '00:00');
          const tB = String(b.values[timeCol.id] || '00:00');
          return tA.localeCompare(tB);
        });
      });
    }

    return map;
  }, [rows, dateCol, timeCol]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Month Grid Days
  const monthCalendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Padding for previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const str = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Padding for next month days to complete 35 or 42 cells (6 rows max)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Week Grid Days
  const weekCalendarDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days: Array<{
      date: Date;
      dateStr: string;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr: str,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [currentDate]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  if (!dateCol) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
        <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          No Date Column Found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          The calendar view requires a column of type Date. Add or configure a Date column in
          Column Settings to plot schedule events on this calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>
        </div>

        {/* View Switcher: Month / Week */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {dayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {monthCalendarDays.map((dayItem, idx) => {
              const dayEvents = rowsByDate.get(dayItem.dateStr) || [];

              return (
                <div
                  key={`${dayItem.dateStr}-${idx}`}
                  className={`min-h-[105px] p-1.5 flex flex-col justify-between transition-colors group relative ${
                    !dayItem.isCurrentMonth
                      ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                  } ${dayItem.isToday ? 'ring-1 ring-inset ring-indigo-500/40 dark:ring-indigo-400/40' : ''}`}
                >
                  {/* Date number & add button */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        dayItem.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {onAddRowWithDate && (
                      <button
                        onClick={() => onAddRowWithDate(dayItem.dateStr)}
                        title={`Add item on ${dayItem.dateStr}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Event pills */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar flex-1">
                    {dayEvents.slice(0, 3).map((row) => {
                      const title = titleCol ? String(row.values[titleCol.id] || 'Untitled') : 'Event';
                      const time = timeCol ? row.values[timeCol.id] : null;
                      const iconName = iconCol ? row.values[iconCol.id] : null;
                      const IconComp = iconName ? getIconComponent(iconName) : null;
                      const statusVal = statusCol ? row.values[statusCol.id] : null;

                      return (
                        <div
                          key={row.id}
                          onClick={() => onEditRow(row)}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-colors truncate"
                          title={`${title}${time ? ` (${time})` : ''}${statusVal ? ` - ${statusVal}` : ''}`}
                        >
                          {IconComp && (
                            <IconComp className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate flex-1">{title}</span>
                          {time && (
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-300 font-mono shrink-0">
                              {time}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekCalendarDays.map((dayItem) => {
            const dayEvents = rowsByDate.get(dayItem.dateStr) || [];
            const dayName = dayNames[dayItem.date.getDay()];

            return (
              <div
                key={dayItem.dateStr}
                className={`bg-white dark:bg-slate-900 rounded-xl border p-3 flex flex-col min-h-[300px] ${
                  dayItem.isToday
                    ? 'border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                      {dayName}
                    </span>
                    <div
                      className={`text-base font-extrabold ${
                        dayItem.isToday
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </div>
                  </div>

                  {onAddRowWithDate && (
                    <button
                      onClick={() => onAddRowWithDate(dayItem.dateStr)}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                      title="Add item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Day's Event List */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center p-3 text-slate-400 text-xs">
                      No events
                    </div>
                  ) : (
                    dayEvents.map((row) => {
                      const title = titleCol ? String(row.values[titleCol.id] || 'Untitled') : 'Event';
                      const time = timeCol ? row.values[timeCol.id] : null;
                      const iconName = iconCol ? row.values[iconCol.id] : null;
                      const IconComp = iconName ? getIconComponent(iconName) : null;
                      const statusVal = statusCol ? row.values[statusCol.id] : null;

                      return (
                        <div
                          key={row.id}
                          onClick={() => onEditRow(row)}
                          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {IconComp ? (
                              <IconComp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            )}
                            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {title}
                            </h4>
                          </div>

                          {time && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{time}</span>
                            </div>
                          )}

                          {statusVal && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {String(statusVal)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

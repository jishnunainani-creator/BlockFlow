import React from 'react';
import ReactDOM from 'react-dom';
import { ScheduledBlock } from '../../types/timetable';
import { getWeekDaysWithDates, getWeekDateRangeLabel, minutesToTimeStr, formatDuration } from '../../utils/timeUtils';

export interface PrintCalendarProps {
  viewMode: 'workweek' | 'fullweek';
  currentWeekId: string;
  scheduledBlocks: ScheduledBlock[];
  paperSize: 'a4' | 'letter';
  orientation: 'landscape' | 'portrait';
  includeWeekTitle: boolean;
  includeDateRange: boolean;
  includeActivityColors: boolean;
  userName?: string;
  includeBranding: boolean;
  startHour?: number;
  endHour?: number;
}

export const PrintCalendar: React.FC<PrintCalendarProps> = ({
  viewMode,
  currentWeekId,
  scheduledBlocks,
  paperSize,
  orientation,
  includeWeekTitle,
  includeDateRange,
  includeActivityColors,
  userName = '',
  includeBranding,
  startHour = 6,
  endHour = 24,
}) => {
  const daysWithDates = getWeekDaysWithDates(currentWeekId);
  const workDays      = daysWithDates.filter((d) => d.index < 5);
  const displayDays   = viewMode === 'workweek' ? workDays : daysWithDates;
  const dateRangeLabel = getWeekDateRangeLabel(currentWeekId);
  const hoursCount    = endHour - startHour;
  const hourHeight    = 52; // Compact print grid height for vector page fit
  const totalGridHeight = hoursCount * hourHeight;

  const timeLabels: { hour: number; label: string }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    timeLabels.push({ hour: h, label: minutesToTimeStr(h * 60) });
  }

  const printContent = (
    <div
      id="calendar-print-root"
      className="hidden print:block text-slate-900 bg-white p-6 font-sans select-text"
      style={{
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* ── 1. VECTOR PRINT HEADER ── */}
      <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-slate-300">
        <div>
          {includeBranding && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-[10px]">
                BF
              </div>
              <span className="text-[11px] font-black tracking-widest uppercase text-indigo-700">
                BlockFlow Execution OS
              </span>
            </div>
          )}

          {includeWeekTitle && (
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentWeekId} Timetable
            </h1>
          )}

          {includeDateRange && (
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              {dateRangeLabel} ({displayDays.length} Days View)
            </p>
          )}

          {userName.trim() && (
            <p className="text-xs font-medium text-slate-500 mt-1">
              Student / User: <span className="font-semibold text-slate-800">{userName}</span>
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 rounded-md text-xs font-bold bg-slate-100 border border-slate-300 text-slate-700">
            {viewMode === 'workweek' ? 'Work Week (Mon–Fri)' : 'Full Week (Mon–Sun)'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Vector PDF Document</p>
        </div>
      </div>

      {/* ── 2. DAY HEADERS ── */}
      <div className="flex border-2 border-slate-300 bg-slate-100 rounded-t-xl overflow-hidden">
        <div className="w-16 border-r-2 border-slate-300 p-2 text-center shrink-0 flex items-end justify-center">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Time</span>
        </div>
        <div className="flex-1 flex divide-x-2 divide-slate-300">
          {displayDays.map((day) => (
            <div key={day.index} className="flex-1 p-2 text-center bg-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                {day.full}
              </span>
              <span className="text-sm font-black text-slate-900 block">
                {day.monthShort} {day.dateNum}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. TIME GRID & ACTIVITY CARDS ── */}
      <div
        className="flex border-b-2 border-x-2 border-slate-300 bg-white relative"
        style={{ height: `${totalGridHeight}px` }}
      >
        {/* Time Column */}
        <div className="w-16 border-r-2 border-slate-300 bg-slate-50 shrink-0 relative">
          {timeLabels.map(({ hour, label }) => {
            const topPx = (hour - startHour) * hourHeight;
            return (
              <div
                key={hour}
                style={{ top: `${topPx}px` }}
                className="absolute left-0 right-0 -translate-y-2 text-right pr-2"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500">{label}</span>
              </div>
            );
          })}
        </div>

        {/* Day Columns */}
        <div className="flex-1 flex divide-x-2 divide-slate-300 relative">
          {displayDays.map((day) => {
            const dayBlocks = scheduledBlocks.filter((sb) => sb.dayOfWeek === day.index);
            return (
              <div key={day.index} className="flex-1 relative" style={{ height: `${totalGridHeight}px` }}>
                {/* Hour Lines */}
                {timeLabels.map(({ hour }) => (
                  <div
                    key={hour}
                    style={{ top: `${(hour - startHour) * hourHeight}px` }}
                    className="absolute left-0 right-0 border-b border-slate-200 pointer-events-none"
                  />
                ))}

                {/* Activity Blocks */}
                {dayBlocks.map((block) => {
                  const topPx    = ((block.startMinutes - startHour * 60) / 60) * hourHeight;
                  const heightPx = (block.duration / 60) * hourHeight;
                  const startTime = minutesToTimeStr(block.startMinutes);
                  const endTime   = minutesToTimeStr(block.startMinutes + block.duration);
                  const blockColor = includeActivityColors ? block.color : '#3b82f6';

                  return (
                    <div
                      key={block.id}
                      style={{
                        top: `${topPx}px`,
                        height: `${Math.max(heightPx - 2, 22)}px`,
                        borderLeftColor: blockColor,
                        backgroundColor: includeActivityColors ? `${blockColor}20` : '#f1f5f9',
                      }}
                      className="absolute left-1 right-1 rounded-lg border-l-4 border border-slate-300 p-1.5 overflow-hidden shadow-none"
                    >
                      <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                        {block.title}
                      </p>
                      {heightPx >= 28 && (
                        <p className="text-[9px] font-mono text-slate-700 mt-0.5 truncate">
                          {startTime}–{endTime} ({formatDuration(block.duration)})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(printContent, document.body);
};

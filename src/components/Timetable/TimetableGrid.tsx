import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getWeekDaysWithDates, minutesToTimeStr, snapToResolution } from '../../utils/timeUtils';
import { ScheduledBlockItem } from './ScheduledBlockItem';
import { ConflictBanner } from '../Conflict/ConflictBanner';

interface TimetableGridProps {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  startHour = 6,
  endHour = 23,
  hourHeight = 80,
}) => {
  const {
    currentWeekId,
    currentWeekScheduledBlocks,
    resolution,
    addScheduledBlock,
    moveScheduledBlock,
    selectedCell,
    setSelectedCell,
    selectedBlockId,
    setSelectedBlockId,
    copySelectedBlock,
    pasteCopiedBlock,
    duplicateSelectedBlock,
    deleteSelectedBlock,
    deselectAll,
    conflicts,
  } = useTimetable();

  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const [dragOverTime, setDragOverTime] = useState<number | null>(null);

  const daysWithDates = getWeekDaysWithDates(currentWeekId);

  const hoursCount = endHour - startHour + 1;
  const totalHeight = hoursCount * hourHeight;

  // Keyboard Shortcuts Handler (Ctrl+C, Ctrl+V, Ctrl+D, Delete, Arrow Keys, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === 'Escape') {
        deselectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId) {
          e.preventDefault();
          deleteSelectedBlock();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedBlockId) {
          e.preventDefault();
          copySelectedBlock();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteCopiedBlock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedBlockId) {
          e.preventDefault();
          duplicateSelectedBlock();
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const currentDay = selectedCell ? selectedCell.dayOfWeek : 0;
        const currentStart = selectedCell ? selectedCell.startMinutes : startHour * 60;

        let nextDay = currentDay;
        let nextStart = currentStart;

        if (e.key === 'ArrowUp') nextStart = Math.max(startHour * 60, currentStart - resolution);
        if (e.key === 'ArrowDown') nextStart = Math.min(endHour * 60 - resolution, currentStart + resolution);
        if (e.key === 'ArrowLeft') nextDay = Math.max(0, currentDay - 1);
        if (e.key === 'ArrowRight') nextDay = Math.min(6, currentDay + 1);

        setSelectedCell({ dayOfWeek: nextDay, startMinutes: nextStart });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedBlockId,
    selectedCell,
    resolution,
    startHour,
    endHour,
    copySelectedBlock,
    pasteCopiedBlock,
    duplicateSelectedBlock,
    deleteSelectedBlock,
    deselectAll,
    setSelectedCell,
  ]);

  const timeLabels = [];
  for (let h = startHour; h <= endHour; h++) {
    timeLabels.push({
      hour: h,
      label: minutesToTimeStr(h * 60),
    });
  }

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = startHour * 60 + (offsetY / hourHeight) * 60;
    const snappedMinutes = snapToResolution(rawMinutes, resolution);

    setDragOverColumn(dayIndex);
    setDragOverTime(snappedMinutes);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
    setDragOverTime(null);
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverTime(null);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const rawMinutes = startHour * 60 + (offsetY / hourHeight) * 60;
      const snappedStart = snapToResolution(rawMinutes, resolution);

      if (data.type === 'LIBRARY_BLOCK') {
        addScheduledBlock({
          blockId: data.blockId,
          title: data.title,
          description: data.description,
          color: data.color,
          priority: data.priority,
          icon: data.icon,
          dayOfWeek: dayIndex,
          startMinutes: snappedStart,
          duration: data.duration || 60,
        });
      } else if (data.type === 'SCHEDULED_BLOCK') {
        moveScheduledBlock(data.id, dayIndex, snappedStart);
      }
    } catch (err) {
      console.error('Error handling drop', err);
    }
  };

  const handleCellClick = (e: React.MouseEvent, dayIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = startHour * 60 + (offsetY / hourHeight) * 60;
    const snappedMinutes = snapToResolution(rawMinutes, resolution);

    setSelectedCell({ dayOfWeek: dayIndex, startMinutes: snappedMinutes });
    setSelectedBlockId(null);
  };

  const renderSubGridLines = () => {
    const lines = [];
    const stepMinutes = resolution;
    const totalMinutes = hoursCount * 60;

    for (let m = 0; m < totalMinutes; m += stepMinutes) {
      const topPx = (m / 60) * hourHeight;
      const isMajorHour = m % 60 === 0;

      lines.push(
        <div
          key={`line-${m}`}
          style={{ top: `${topPx}px` }}
          className={`absolute left-0 right-0 pointer-events-none ${
            isMajorHour
              ? 'border-b border-slate-800/90'
              : 'border-b border-dashed border-slate-800/40'
          }`}
        />
      );
    }
    return lines;
  };

  return (
    <div
      onClick={deselectAll}
      className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none relative"
    >
      {/* 7-Day Header with Day + Date */}
      <div className="flex border-b border-slate-800/90 bg-slate-900/90 backdrop-blur-md shrink-0 pr-2 z-10">
        <div className="w-16 sm:w-20 border-r border-slate-800/80 p-3 text-center shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Time
          </span>
        </div>

        <div className="flex-1 grid grid-cols-7 divide-x divide-slate-800/80">
          {daysWithDates.map((day) => (
            <div
              key={day.index}
              className={`p-2 text-center transition-colors relative ${
                day.isToday
                  ? 'bg-gradient-to-b from-indigo-950/60 via-indigo-950/30 to-transparent border-t-2 border-emerald-400'
                  : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${
                    day.isToday ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {day.short}
                  </span>
                  {day.isToday && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all ${
                  day.isToday
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg ring-2 ring-emerald-400/50'
                    : 'text-slate-300 bg-slate-800/80 border border-slate-700/50'
                }`}>
                  {day.monthShort} {day.dateNum}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Printable Area */}
      <div id="timetable-printable-area" className="flex-1 overflow-y-auto relative scrollbar-thin">
        <div className="flex relative" style={{ height: `${totalHeight}px` }}>
          {/* Time Axis */}
          <div className="w-16 sm:w-20 border-r border-slate-800/80 bg-slate-900/40 shrink-0 relative">
            {timeLabels.map(({ hour, label }) => {
              const topPx = (hour - startHour) * hourHeight;
              return (
                <div
                  key={hour}
                  style={{ top: `${topPx}px` }}
                  className="absolute left-0 right-0 -translate-y-2.5 text-center px-1"
                >
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 7 Day Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-slate-800/80 relative">
            {daysWithDates.map((day) => {
              const dayBlocks = currentWeekScheduledBlocks.filter(
                (sb) => sb.dayOfWeek === day.index
              );
              const isOverThisDay = dragOverColumn === day.index;

              return (
                <div
                  key={day.index}
                  onClick={(e) => handleCellClick(e, day.index)}
                  onDragOver={(e) => handleDragOver(e, day.index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day.index)}
                  className={`relative transition-colors ${
                    day.isToday ? 'bg-indigo-950/15' : ''
                  } ${
                    isOverThisDay ? 'bg-indigo-950/30 ring-1 ring-indigo-500/40' : 'hover:bg-slate-900/20'
                  }`}
                  style={{ height: `${totalHeight}px` }}
                >
                  {renderSubGridLines()}

                  {/* Selected Cell Box Indicator */}
                  {selectedCell && selectedCell.dayOfWeek === day.index && (
                    <div
                      style={{
                        top: `${((selectedCell.startMinutes - startHour * 60) / 60) * hourHeight}px`,
                        height: `${(resolution / 60) * hourHeight}px`,
                      }}
                      className="absolute left-0.5 right-0.5 border-2 border-indigo-500 bg-indigo-500/10 rounded-lg pointer-events-none z-10 shadow-lg"
                    />
                  )}

                  {/* Drag Target Highlight */}
                  {isOverThisDay && dragOverTime !== null && (
                    <div
                      style={{
                        top: `${((dragOverTime - startHour * 60) / 60) * hourHeight}px`,
                        height: `${(60 / 60) * hourHeight}px`,
                      }}
                      className="absolute left-1 right-1 bg-indigo-500/20 border-2 border-dashed border-indigo-400 rounded-xl z-20 pointer-events-none flex items-center justify-center animate-pulse"
                    >
                      <span className="text-xs font-bold text-indigo-300 bg-slate-900/90 px-2 py-1 rounded-md border border-indigo-500/40">
                        Drop at {minutesToTimeStr(dragOverTime)}
                      </span>
                    </div>
                  )}

                  {/* Scheduled Block Items */}
                  {dayBlocks.map((block) => (
                    <ScheduledBlockItem
                      key={block.id}
                      block={block}
                      startHour={startHour}
                      hourHeight={hourHeight}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conflict Warning Drawer */}
      <ConflictBanner />
    </div>
  );
};

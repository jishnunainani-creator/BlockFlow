import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getWeekDaysWithDates, minutesToTimeStr, snapToResolution } from '../../utils/timeUtils';
import { ScheduledBlockItem } from './ScheduledBlockItem';
import { FocusCard } from './FocusCard';
import { ConflictBanner } from '../Conflict/ConflictBanner';
import { MobileAddBlockSheet } from './MobileAddBlockSheet';
import { ExportModal } from '../Export/ExportModal';
import { PrintCalendar } from '../Export/PrintCalendar';
import { Plus, Calendar, CalendarDays, LayoutGrid, Download, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { BulkSaveToLibraryModal } from '../Library/BulkSaveToLibraryModal';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'workweek' | 'fullweek';
type Density  = 'comfortable' | 'balanced' | 'compact';

const DENSITY_CONFIG: Record<Density, { hourHeight: number; label: string; icon: string }> = {
  comfortable: { hourHeight: 100, label: 'Comfortable', icon: '⬡' },
  balanced:    { hourHeight: 80,  label: 'Balanced',    icon: '⬡' },
  compact:     { hourHeight: 64,  label: 'Compact',     icon: '⬡' },
};

const DENSITY_ORDER: Density[] = ['comfortable', 'balanced', 'compact'];

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_COL_WIDTH  = 72; // px — sticky time column
const DAY_COL_MIN_W   = 160; // px — minimum day column width
const HEADER_HEIGHT   = 54;  // px — compact day header

// ─── Component ───────────────────────────────────────────────────────────────

interface TimetableGridProps {
  startHour?: number;
  endHour?: number;
  isLibraryOpen?: boolean;
  onToggleLibrary?: () => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  startHour = 6,
  endHour   = 24,
  isLibraryOpen = true,
  onToggleLibrary,
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
  } = useTimetable();

  // ── Local UI State ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('timetable_view_mode_v1');
      if (saved === 'fullweek' || saved === 'workweek') return saved;
    } catch (e) {}
    return 'workweek';
  });

  useEffect(() => {
    try {
      localStorage.setItem('timetable_view_mode_v1', viewMode);
    } catch (e) {}
  }, [viewMode]);

  const [density,        setDensity]        = useState<Density>('balanced');
  const [dragOverCol,    setDragOverCol]    = useState<number | null>(null);
  const [dragOverTime,   setDragOverTime]   = useState<number | null>(null);
  const [showMobileAdd,  setShowMobileAdd]  = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkSaveModal, setShowBulkSaveModal] = useState(false);
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const [mobileActiveDay, setMobileActiveDay] = useState<number>(todayDayIndex);

  // Mobile Touch Swipe Gesture Handler (Swipe Left = Next Day, Swipe Right = Prev Day)
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    if (Math.abs(diffX) > 50) {
      if (typeof mobileActiveDay === 'number') {
        if (diffX > 0) {
          // Swipe Left -> Next Day
          setMobileActiveDay((prev) => (typeof prev === 'number' ? Math.min(6, prev + 1) : 0));
        } else {
          // Swipe Right -> Prev Day
          setMobileActiveDay((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : 0));
        }
      } else {
        setMobileActiveDay(0);
      }
    }
    touchStartX.current = null;
  };

  const [printConfig, setPrintConfig] = useState({
    paperSize: 'a4' as 'a4' | 'letter',
    orientation: 'landscape' as 'landscape' | 'portrait',
    includeWeekTitle: true,
    includeDateRange: true,
    includeActivityColors: true,
    userName: '',
    includeBranding: true,
  });

  // Focus Card state
  const [focusedEntry, setFocusedEntry] = useState<{ id: string; rect: DOMRect } | null>(null);
  const focusedBlock = focusedEntry
    ? currentWeekScheduledBlocks.find((b) => b.id === focusedEntry.id) ?? null
    : null;

  const handleFocusCard = useCallback((blockId: string, rect: DOMRect) => {
    setFocusedEntry((prev) => prev?.id === blockId ? null : { id: blockId, rect });
  }, []);

  const handleCloseFocusCard = useCallback(() => {
    setFocusedEntry(null);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

  const hourHeight = DENSITY_CONFIG[density].hourHeight;
  const hoursCount = endHour - startHour;
  const totalHeight = hoursCount * hourHeight;

  const daysWithDates = useMemo(() => getWeekDaysWithDates(currentWeekId), [currentWeekId]);
  const workDays      = useMemo(() => daysWithDates.filter((d) => d.index < 5), [daysWithDates]);
  const displayDays   = useMemo(() => (viewMode === 'workweek' ? workDays : daysWithDates), [viewMode, workDays, daysWithDates]);

  // Pre-index blocks by day for O(1) column access
  const blocksByDay = useMemo(() => {
    const map = new Map<number, typeof currentWeekScheduledBlocks>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const b of currentWeekScheduledBlocks) {
      const list = map.get(b.dayOfWeek);
      if (list) list.push(b);
      else map.set(b.dayOfWeek, [b]);
    }
    return map;
  }, [currentWeekScheduledBlocks]);

  // Mobile single day display
  const activeDayIndex = typeof mobileActiveDay === 'number' ? mobileActiveDay : todayDayIndex;
  const mobileDisplayDays = useMemo(
    () => daysWithDates.filter((d) => d.index === activeDayIndex),
    [daysWithDates, activeDayIndex]
  );

  // ── Shift+Scroll → horizontal ───────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (e.key === 'Escape') {
        deselectAll();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId) {
        e.preventDefault();
        deleteSelectedBlock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedBlockId) {
        e.preventDefault();
        copySelectedBlock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteCopiedBlock();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedBlockId) {
        e.preventDefault();
        duplicateSelectedBlock();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const currentDay   = selectedCell ? selectedCell.dayOfWeek   : 0;
        const currentStart = selectedCell ? selectedCell.startMinutes : startHour * 60;
        let nextDay   = currentDay;
        let nextStart = currentStart;
        if (e.key === 'ArrowUp')    nextStart = Math.max(startHour * 60,        currentStart - resolution);
        if (e.key === 'ArrowDown')  nextStart = Math.min(endHour   * 60 - resolution, currentStart + resolution);
        if (e.key === 'ArrowLeft')  nextDay   = Math.max(0, currentDay - 1);
        if (e.key === 'ArrowRight') nextDay   = Math.min(6, currentDay + 1);
        setSelectedCell({ dayOfWeek: nextDay, startMinutes: nextStart });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, selectedCell, resolution, startHour, endHour,
      copySelectedBlock, pasteCopiedBlock, duplicateSelectedBlock,
      deleteSelectedBlock, deselectAll, setSelectedCell]);

  // ── Time Labels ─────────────────────────────────────────────────────────────
  const timeLabels: { hour: number; label: string }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    timeLabels.push({ hour: h, label: minutesToTimeStr(h * 60) });
  }

  // ── Drag Handlers ───────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect        = e.currentTarget.getBoundingClientRect();
    const offsetY     = e.clientY - rect.top;
    const rawMinutes  = startHour * 60 + (offsetY / hourHeight) * 60;
    const snappedTime = snapToResolution(rawMinutes, resolution);
    setDragOverCol((prev) => (prev === dayIndex ? prev : dayIndex));
    setDragOverTime((prev) => (prev === snappedTime ? prev : snappedTime));
  }, [hourHeight, resolution, startHour]);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
    setDragOverTime(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    setDragOverCol(null);
    setDragOverTime(null);
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;
    try {
      const data        = JSON.parse(rawData);
      const rect        = e.currentTarget.getBoundingClientRect();
      const offsetY     = e.clientY - rect.top;
      const snappedStart = snapToResolution(startHour * 60 + (offsetY / hourHeight) * 60, resolution);
      if (data.type === 'LIBRARY_BLOCK') {
        addScheduledBlock({
          blockId: data.blockId, title: data.title, description: data.description,
          color: data.color, priority: data.priority, icon: data.icon,
          dayOfWeek: dayIndex, startMinutes: snappedStart, duration: data.duration || 60,
          categoryId: data.categoryId,
        });
      } else if (data.type === 'SCHEDULED_BLOCK') {
        moveScheduledBlock(data.id, dayIndex, snappedStart);
      }
    } catch (err) {
      console.error('Error handling drop', err);
    }
  }, [hourHeight, resolution, startHour, addScheduledBlock, moveScheduledBlock]);

  const handleCellClick = useCallback((e: React.MouseEvent, dayIndex: number) => {
    const rect        = e.currentTarget.getBoundingClientRect();
    const offsetY     = e.clientY - rect.top;
    const snappedMinutes = snapToResolution(startHour * 60 + (offsetY / hourHeight) * 60, resolution);
    setSelectedCell({ dayOfWeek: dayIndex, startMinutes: snappedMinutes });
    setSelectedBlockId(null);
  }, [hourHeight, resolution, startHour, setSelectedCell, setSelectedBlockId]);

  // ── Sub-Grid Lines (Memoized for high performance) ──────────────────────────
  const subGridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const stepMinutes = Math.min(30, resolution);
    const totalMinutes = hoursCount * 60;
    for (let m = 0; m < totalMinutes; m += stepMinutes) {
      const topPx      = (m / 60) * hourHeight;
      const isMajor    = m % 60 === 0;
      const isHalf     = m % 60 === 30;
      lines.push(
        <div
          key={`line-${m}`}
          style={{ top: `${topPx}px` }}
          className={`absolute left-0 right-0 pointer-events-none ${
            isMajor
              ? 'border-b border-slate-800/80'
              : isHalf
              ? 'border-b border-dashed border-slate-800/40'
              : 'border-b border-dotted border-slate-800/20'
          }`}
        />
      );
    }
    return lines;
  }, [hoursCount, hourHeight, resolution]);

  // ── Density Cycle ───────────────────────────────────────────────────────────
  const cycleDensity = () => {
    const idx = DENSITY_ORDER.indexOf(density);
    setDensity(DENSITY_ORDER[(idx + 1) % DENSITY_ORDER.length]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={() => { deselectAll(); handleCloseFocusCard(); }}
      className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none"
    >
      {/* ── TOOLBAR (Desktop) ─────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800/60 shrink-0 z-20">
        {/* Persistent Activity Library Sidebar Toggle */}
        {onToggleLibrary && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLibrary();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-slate-500"
              title={isLibraryOpen ? 'Hide Activity Library' : 'Show Activity Library'}
              aria-label={isLibraryOpen ? 'Hide Activity Library' : 'Show Activity Library'}
              aria-expanded={isLibraryOpen}
            >
              {isLibraryOpen ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">
                {isLibraryOpen ? 'Hide Library' : 'Activity Library'}
              </span>
            </button>
            <div className="w-px h-4 bg-slate-700/60 shrink-0" />
          </>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 gap-0.5 border border-slate-700/60">
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('workweek'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'workweek'
                ? 'bg-[#3659C9] dark:bg-[#4F73E3] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Work Week
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('fullweek'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'fullweek'
                ? 'bg-[#3659C9] dark:bg-[#4F73E3] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Full Week
          </button>
        </div>

        <div className="w-px h-4 bg-slate-700/60" />

        {/* Density Toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); cycleDensity(); }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
          title="Toggle density"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
          <span>{DENSITY_CONFIG[density].label}</span>
        </button>

        <div className="w-px h-4 bg-slate-700/60" />

        {/* Bulk Save to Library Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowBulkSaveModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors ml-auto"
          title="Save Timetable Activities to Library"
        >
          <Bookmark className="w-3.5 h-3.5 text-slate-400" />
          <span>Save to Library</span>
        </button>

        {/* Export Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowExportModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-colors shadow-sm"
          title="Export Timetable Planner"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export</span>
        </button>
      </div>

      {/* ── MAIN CALENDAR AREA ───────────────────────────────────────────────── */}
      {/* Desktop: unified scroll container with sticky header and sticky time column */}
      <div id="calendar-export" className="hidden sm:flex flex-col flex-1 overflow-hidden relative">
        <div
          ref={scrollRef}
          id="timetable-printable-area"
          className="flex flex-col flex-1 overflow-y-auto overflow-x-auto scrollbar-thin relative"
        >
          {/* ── STICKY HEADER ROW ─────────────────────────────────────────────── */}
          <div
            className="sticky top-0 z-30 flex shrink-0 border-b border-slate-800/80 bg-slate-900"
            style={{
              height: `${HEADER_HEIGHT}px`,
              minWidth: `${TIME_COL_WIDTH + displayDays.length * DAY_COL_MIN_W}px`,
            }}
          >
            {/* Corner cell — sticky on both axes */}
            <div
              className="sticky left-0 top-0 z-40 bg-slate-900 border-r border-slate-800/60 flex items-center justify-center shrink-0"
              style={{ width: `${TIME_COL_WIDTH}px`, height: `${HEADER_HEIGHT}px` }}
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Time</span>
            </div>

            {/* Header Day Columns — exact same flex basis and minWidth as body columns */}
            <div className="flex flex-1" style={{ height: `${HEADER_HEIGHT}px` }}>
              {displayDays.map((day) => {
                const isWeekend = day.index >= 5;
                return (
                  <div
                    key={day.index}
                    style={{ flex: '1 1 0%', minWidth: `${DAY_COL_MIN_W}px` }}
                    className={`relative flex items-center justify-between px-3 border-r border-slate-800/50 transition-colors ${
                      day.isToday
                        ? 'bg-[#3659C9]/10 border-t-2 border-t-[#3659C9] dark:border-t-[#4F73E3]'
                        : isWeekend
                        ? 'bg-slate-900/40'
                        : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        day.isToday ? 'text-[#3659C9] dark:text-[#4F73E3]' : isWeekend ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {day.short}
                      </span>
                      <span className={`text-sm font-bold leading-none ${
                        day.isToday ? 'text-[#3659C9] dark:text-[#4F73E3]' : isWeekend ? 'text-slate-500' : 'text-slate-100'
                      }`}>
                        {day.dateNum}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        day.isToday ? 'text-[#3659C9]/80 dark:text-[#4F73E3]/80' : 'text-slate-500'
                      }`}>
                        {day.monthShort}
                      </span>
                    </div>

                    {day.isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#3659C9]/20 text-[#3659C9] dark:text-[#4F73E3] uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── GRID BODY ROW ─────────────────────────────────────────────────── */}
          <div
            className="flex flex-1 relative"
            style={{
              height: `${totalHeight}px`,
              minWidth: `${TIME_COL_WIDTH + displayDays.length * DAY_COL_MIN_W}px`,
            }}
          >
            {/* Sticky Time Column */}
            <div
              className="sticky left-0 z-20 bg-slate-900/90 border-r border-slate-800/60 shrink-0 backdrop-blur-sm"
              style={{
                width: `${TIME_COL_WIDTH}px`,
                height: `${totalHeight}px`,
              }}
            >
              {timeLabels.map(({ hour, label }) => {
                const topPx     = (hour - startHour) * hourHeight;
                const halfTopPx = topPx + hourHeight / 2;
                return (
                  <React.Fragment key={hour}>
                    <div
                      style={{ top: `${topPx}px` }}
                      className="absolute left-0 right-0 -translate-y-2.5 flex items-center justify-end pr-3"
                    >
                      <span className="text-[11px] font-mono font-semibold text-slate-500 tabular-nums">
                        {label}
                      </span>
                    </div>
                    {hour < endHour && (
                      <div
                        style={{ top: `${halfTopPx}px` }}
                        className="absolute left-0 right-0 -translate-y-2 flex items-center justify-end pr-3 pointer-events-none"
                      >
                        <span className="text-[9px] font-mono text-slate-700">:30</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Day Columns */}
            <div
              className="flex flex-1 relative"
              style={{
                height: `${totalHeight}px`,
              }}
            >
            {displayDays.map((day) => {
              const dayBlocks   = blocksByDay.get(day.index) || [];
              const isOverDay   = dragOverCol === day.index;
              const isWeekend   = day.index >= 5;

              return (
                <div
                  key={day.index}
                  onClick={(e) => handleCellClick(e, day.index)}
                  onDragOver={(e) => handleDragOver(e, day.index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day.index)}
                  style={{
                    flex: '1 1 0%',
                    height: `${totalHeight}px`,
                    minWidth: `${DAY_COL_MIN_W}px`,
                  }}
                  className={`relative border-r border-slate-800/40 transition-colors ${
                    day.isToday ? 'bg-emerald-950/8' : isWeekend ? 'bg-slate-900/20' : ''
                  } ${isOverDay ? 'bg-indigo-950/25 ring-inset ring-1 ring-indigo-500/30' : 'hover:bg-slate-900/15'}`}
                >
                  {subGridLines}

                  {/* Selected cell indicator */}
                  {selectedCell && selectedCell.dayOfWeek === day.index && (
                    <div
                      style={{
                        top:    `${((selectedCell.startMinutes - startHour * 60) / 60) * hourHeight}px`,
                        height: `${(resolution / 60) * hourHeight}px`,
                      }}
                      className="absolute left-1 right-1 border-2 border-indigo-500 bg-indigo-500/10 rounded-xl pointer-events-none z-10 shadow-lg shadow-indigo-500/20"
                    />
                  )}

                  {/* Drag drop indicator */}
                  {isOverDay && dragOverTime !== null && (
                    <div
                      style={{
                        top:    `${((dragOverTime - startHour * 60) / 60) * hourHeight}px`,
                        height: `${hourHeight}px`,
                      }}
                      className="absolute left-2 right-2 bg-indigo-500/15 border-2 border-dashed border-indigo-400/60 rounded-2xl z-20 pointer-events-none flex items-center justify-center animate-pulse"
                    >
                      <span className="text-xs font-bold text-indigo-300 bg-slate-900/90 px-2 py-1 rounded-lg border border-indigo-500/30">
                        Drop at {minutesToTimeStr(dragOverTime)}
                      </span>
                    </div>
                  )}

                  {/* Scheduled blocks */}
                  {dayBlocks.map((block) => (
                    <ScheduledBlockItem
                      key={block.id}
                      block={block}
                      startHour={startHour}
                      hourHeight={hourHeight}
                      isFocused={focusedEntry?.id === block.id}
                      anyFocused={focusedEntry !== null}
                      onFocusCard={handleFocusCard}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* ── MOBILE GRID (Calendar-First Philosophy: 100% Height, Touch Swipeable) ── */}
      <div
        className="sm:hidden flex flex-col flex-1 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile sticky header & 7-day pill strip */}
        <div className="sticky top-0 flex flex-col border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0 z-30">
          {/* 7-Day Pill Strip */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800/60 bg-slate-950/60">
            <div className="flex items-center gap-1">
              {onToggleLibrary && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLibrary();
                  }}
                  className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors shrink-0"
                  title={isLibraryOpen ? 'Hide Activity Library' : 'Show Activity Library'}
                  aria-label={isLibraryOpen ? 'Hide Activity Library' : 'Show Activity Library'}
                  aria-expanded={isLibraryOpen}
                >
                  {isLibraryOpen ? (
                    <ChevronLeft className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>Library</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileActiveDay((prev) => Math.max(0, prev - 1))}
                disabled={activeDayIndex === 0}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                title="Previous Day"
              >
                ◀
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {daysWithDates.map((d) => {
                const isSelected = d.index === activeDayIndex;
                return (
                  <button
                    key={d.index}
                    type="button"
                    onClick={() => setMobileActiveDay(d.index)}
                    className={`flex flex-col items-center px-2 py-1 rounded-xl text-[10px] transition-all min-w-[36px] ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40 scale-105'
                        : d.isToday
                        ? 'bg-emerald-950/60 text-emerald-400 font-semibold border border-emerald-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="uppercase text-[9px]">{d.short.substring(0, 3)}</span>
                    <span className="font-mono text-[11px] leading-none mt-0.5">{d.dateNum}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMobileActiveDay((prev) => Math.min(6, prev + 1))}
              disabled={activeDayIndex === 6}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
              title="Next Day"
            >
              ▶
            </button>
          </div>

          {/* Active 1-Day Header */}
          <div className="flex items-center">
            <div className="w-14 border-r border-slate-800 p-2 text-center shrink-0 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Time</span>
            </div>
            <div className="flex-1 px-3 py-1.5 flex items-center justify-between bg-slate-900/40">
              {mobileDisplayDays.map((day) => (
                <div key={day.index} className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wide ${day.isToday ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {day.full}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">({day.dateFormatted})</span>
                  {day.isToday && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      TODAY
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMobileActiveDay(todayDayIndex)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Mobile scrollable body */}
        <div id="timetable-printable-area-mobile" className="flex flex-1 overflow-y-auto relative scrollbar-thin">
          {/* Mobile time column */}
          <div className="w-14 border-r border-slate-800/80 bg-slate-900/40 shrink-0 relative" style={{ height: `${totalHeight}px` }}>
            {timeLabels.map(({ hour, label }) => {
              const topPx     = (hour - startHour) * hourHeight;
              const halfTopPx = topPx + hourHeight / 2;
              return (
                <React.Fragment key={hour}>
                  <div style={{ top: `${topPx}px` }} className="absolute left-0 right-0 -translate-y-2.5 text-center px-0.5">
                    <span className="text-[10px] font-mono font-semibold text-slate-400">{label}</span>
                  </div>
                  {hour < endHour && (
                    <div style={{ top: `${halfTopPx}px` }} className="absolute left-0 right-0 -translate-y-2 text-center px-0.5 pointer-events-none">
                      <span className="text-[8px] font-mono text-slate-600">:30</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile day columns */}
          <div className="flex-1 grid divide-x divide-slate-800/60 relative" style={{ gridTemplateColumns: `repeat(${mobileDisplayDays.length}, 1fr)`, height: `${totalHeight}px` }}>
            {mobileDisplayDays.map((day) => {
              const dayBlocks = blocksByDay.get(day.index) || [];
              const isOverDay = dragOverCol === day.index;
              return (
                <div
                  key={day.index}
                  onClick={(e) => handleCellClick(e, day.index)}
                  onDragOver={(e) => handleDragOver(e, day.index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day.index)}
                  className={`relative transition-colors ${day.isToday ? 'bg-indigo-950/15' : ''} ${isOverDay ? 'bg-indigo-950/30' : 'hover:bg-slate-900/20'}`}
                  style={{ height: `${totalHeight}px` }}
                >
                  {subGridLines}
                  {selectedCell && selectedCell.dayOfWeek === day.index && (
                    <div
                      style={{
                        top:    `${((selectedCell.startMinutes - startHour * 60) / 60) * hourHeight}px`,
                        height: `${(resolution / 60) * hourHeight}px`,
                      }}
                      className="absolute left-0.5 right-0.5 border-2 border-indigo-500 bg-indigo-500/10 rounded-lg pointer-events-none z-10 shadow-lg"
                    />
                  )}
                  {dayBlocks.map((block) => (
                    <ScheduledBlockItem
                      key={block.id}
                      block={block}
                      startHour={startHour}
                      hourHeight={hourHeight}
                      isFocused={focusedEntry?.id === block.id}
                      anyFocused={focusedEntry !== null}
                      onFocusCard={handleFocusCard}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Conflict Banner ─────────────────────────────────────────────────── */}
      <ConflictBanner />

      {/* ── Focus Card Portal ───────────────────────────────────────────────── */}
      {focusedBlock && focusedEntry && (
        <FocusCard
          block={focusedBlock}
          cardRect={focusedEntry.rect}
          onClose={handleCloseFocusCard}
        />
      )}

      {/* ── Export Modal ────────────────────────────────────────────────────── */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          viewMode={viewMode}
          onApplyPrintConfig={(cfg) => setPrintConfig(cfg)}
        />
      )}

      {/* ── Native Vector Print Calendar (Exposed strictly during print/PDF export) ── */}
      <PrintCalendar
        viewMode={viewMode}
        currentWeekId={currentWeekId}
        scheduledBlocks={currentWeekScheduledBlocks}
        paperSize={printConfig.paperSize}
        orientation={printConfig.orientation}
        includeWeekTitle={printConfig.includeWeekTitle}
        includeDateRange={printConfig.includeDateRange}
        includeActivityColors={printConfig.includeActivityColors}
        userName={printConfig.userName}
        includeBranding={printConfig.includeBranding}
        startHour={startHour}
        endHour={endHour}
      />

      {/* ── Mobile FAB ──────────────────────────────────────────────────────── */}
      <button
        onClick={() => setShowMobileAdd(true)}
        className="sm:hidden fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:scale-105"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        title="Add block"
      >
        <Plus className="w-7 h-7" />
      </button>

      {showMobileAdd && (
        <MobileAddBlockSheet
          onClose={() => setShowMobileAdd(false)}
          startHour={startHour}
          endHour={endHour}
        />
      )}

      <BulkSaveToLibraryModal
        isOpen={showBulkSaveModal}
        onClose={() => setShowBulkSaveModal(false)}
      />
    </div>
  );
};

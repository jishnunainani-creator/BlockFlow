import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { getWeekDaysWithDates, minutesToTimeStr, snapToResolution } from '../../utils/timeUtils';
import { ScheduledBlockItem } from './ScheduledBlockItem';
import { FocusCard } from './FocusCard';
import { ConflictBanner } from '../Conflict/ConflictBanner';
import { MobileAddBlockSheet } from './MobileAddBlockSheet';
import { ExportModal } from '../Export/ExportModal';
import { PrintCalendar } from '../Export/PrintCalendar';
import { Plus, Calendar, CalendarDays, LayoutGrid, Download, Bookmark } from 'lucide-react';
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
const HEADER_HEIGHT   = 80;  // px — tall day header

// ─── Component ───────────────────────────────────────────────────────────────

interface TimetableGridProps {
  startHour?: number;
  endHour?: number;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  startHour = 6,
  endHour   = 24,
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

  const daysWithDates = getWeekDaysWithDates(currentWeekId);
  const workDays      = daysWithDates.filter((d) => d.index < 5);
  const displayDays   = viewMode === 'workweek' ? workDays : daysWithDates;

  // Mobile single day display
  const activeDayIndex = typeof mobileActiveDay === 'number' ? mobileActiveDay : todayDayIndex;
  const mobileDisplayDays = daysWithDates.filter((d) => d.index === activeDayIndex);

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
    const rect       = e.currentTarget.getBoundingClientRect();
    const offsetY    = e.clientY - rect.top;
    const rawMinutes = startHour * 60 + (offsetY / hourHeight) * 60;
    setDragOverCol(dayIndex);
    setDragOverTime(snapToResolution(rawMinutes, resolution));
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

  // ── Sub-Grid Lines ──────────────────────────────────────────────────────────
  const renderSubGridLines = () => {
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
  };

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
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/80 border-b border-slate-800/60 shrink-0 z-20 backdrop-blur-sm">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-800/60 rounded-xl p-0.5 gap-0.5 border border-slate-700/40">
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('workweek'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'workweek'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Work Week
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('fullweek'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'fullweek'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
          title="Toggle density"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          {DENSITY_CONFIG[density].label}
        </button>

        <div className="w-px h-4 bg-slate-700/60" />

        {/* Bulk Save to Library Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowBulkSaveModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 hover:text-white transition-all shadow-sm active:scale-95 ml-auto"
          title="Save Timetable Activities to Library"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Save to Library</span>
        </button>

        {/* Export Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowExportModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-300 hover:text-white transition-all shadow-sm active:scale-95"
          title="Export Timetable Planner"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export ▼</span>
        </button>
      </div>



      {/* ── MAIN CALENDAR AREA ───────────────────────────────────────────────── */}
      {/* Desktop: sticky header + horizontally scrollable columns */}
      <div id="calendar-export" className="hidden sm:flex flex-col flex-1 overflow-hidden relative">

        {/* ── STICKY HEADER ROW ─────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md z-30"
          style={{ height: `${HEADER_HEIGHT}px` }}
        >
          {/* Corner cell — sticky on both axes */}
          <div
            className="shrink-0 bg-slate-900/95 border-r border-slate-800/60 flex items-end justify-center pb-3 z-40"
            style={{ width: `${TIME_COL_WIDTH}px`, position: 'sticky', left: 0 }}
          >
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Time</span>
          </div>

          {/* Scrollable header columns — mirrors the grid scroll */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-none"
            id="cal-header-scroll"
          >
            <div className="flex" style={{ minWidth: `${displayDays.length * DAY_COL_MIN_W}px` }}>
              {displayDays.map((day) => {
                const isWeekend = day.index >= 5;
                return (
                  <div
                    key={day.index}
                    style={{ flex: '1 1 0%', minWidth: `${DAY_COL_MIN_W}px` }}
                    className={`relative flex flex-col items-center justify-end pb-3 border-r border-slate-800/50 transition-all duration-300 ease-in-out ${
                      day.isToday
                        ? 'bg-gradient-to-b from-emerald-950/40 via-emerald-950/10 to-transparent border-t-[3px] border-t-emerald-400'
                        : isWeekend
                        ? 'bg-slate-900/30'
                        : 'hover:bg-slate-800/20'
                    }`}
                  >
                    {/* Day full name */}
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${
                      day.isToday ? 'text-emerald-400' : isWeekend ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {day.full}
                    </span>

                    {/* Date number — large & prominent */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[22px] font-bold leading-none ${
                        day.isToday ? 'text-emerald-300' : isWeekend ? 'text-slate-500' : 'text-slate-200'
                      }`}>
                        {day.dateNum}
                      </span>
                      {day.isToday && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>

                    {/* Month abbreviation */}
                    <span className={`text-[11px] font-medium mt-0.5 ${
                      day.isToday ? 'text-emerald-500/80' : 'text-slate-600'
                    }`}>
                      {day.monthShort}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ───────────────────────────────────────────────── */}
        <div
          id="timetable-printable-area"
          className="flex flex-1 overflow-y-auto overflow-x-auto scrollbar-thin"
          onScroll={(e) => {
            // Sync horizontal scroll with header
            const headerScroll = document.getElementById('cal-header-scroll');
            if (headerScroll) headerScroll.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
          }}
        >
          {/* Sticky Time Column */}
          <div
            className="shrink-0 bg-slate-900/60 border-r border-slate-800/60 relative z-20 backdrop-blur-sm"
            style={{
              width: `${TIME_COL_WIDTH}px`,
              height: `${totalHeight}px`,
              position: 'sticky',
              left: 0,
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
            className="flex relative"
            style={{
              height: `${totalHeight}px`,
              minWidth: `${displayDays.length * DAY_COL_MIN_W}px`,
              flex: 1,
            }}
          >
            {displayDays.map((day) => {
              const dayBlocks   = currentWeekScheduledBlocks.filter((sb) => sb.dayOfWeek === day.index);
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
                  className={`relative border-r border-slate-800/40 transition-all duration-300 ease-in-out ${
                    day.isToday ? 'bg-emerald-950/8' : isWeekend ? 'bg-slate-900/20' : ''
                  } ${isOverDay ? 'bg-indigo-950/25 ring-inset ring-1 ring-indigo-500/30' : 'hover:bg-slate-900/15'}`}
                >
                  {renderSubGridLines()}

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
            <button
              type="button"
              onClick={() => setMobileActiveDay((prev) => Math.max(0, prev - 1))}
              disabled={activeDayIndex === 0}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
              title="Previous Day"
            >
              ◀
            </button>

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
              const dayBlocks = currentWeekScheduledBlocks.filter((sb) => sb.dayOfWeek === day.index);
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
                  {renderSubGridLines()}
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

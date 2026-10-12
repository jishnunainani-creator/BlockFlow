import React, { useRef, useState, useEffect } from 'react';
import { ScheduledBlock, CompletionStatus } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { minutesToTimeStr, snapToResolution, formatDuration } from '../../utils/timeUtils';
import { AlertTriangle, Check, Target } from 'lucide-react';

interface ScheduledBlockItemProps {
  block:        ScheduledBlock;
  startHour:    number;
  hourHeight:   number;
  /** Whether THIS block's focus card is currently open */
  isFocused:    boolean;
  /** Whether ANY block's focus card is open */
  anyFocused:   boolean;
  /** Callback to open focus card — provides DOMRect of THIS card */
  onFocusCard:  (blockId: string, rect: DOMRect) => void;
}

export const ScheduledBlockItemComponent: React.FC<ScheduledBlockItemProps> = ({
  block,
  startHour,
  hourHeight,
  isFocused,
  anyFocused,
  onFocusCard,
}) => {
  const {
    resolution,
    resizeScheduledBlock,
    setSelectedBlockId,
    conflicts,
    searchQuery,
  } = useTimetable();

  const { activeTheme } = useTheme();
  const isDark = activeTheme === 'dark';

  const [liveDuration, setLiveDuration] = useState(block.duration);
  const [isResizing,   setIsResizing]   = useState(false);

  const blockRef       = useRef<HTMLDivElement>(null);
  const resizeStartY   = useRef<number>(0);
  const resizeStartDur = useRef<number>(0);

  const isConflicting  = conflicts.has(block.id);
  const currentStatus: CompletionStatus = block.status || 'not_started';
  const isCompleted    = currentStatus === 'completed' || currentStatus === 'faster';
  const isSkipped      = currentStatus === 'skipped'   || currentStatus === 'missed';

  useEffect(() => {
    if (!isResizing) setLiveDuration(block.duration);
  }, [block.duration, isResizing]);

  const topPx    = ((block.startMinutes - startHour * 60) / 60) * hourHeight;
  const heightPx = (liveDuration / 60) * hourHeight;

  const startTime = minutesToTimeStr(block.startMinutes);
  const endTime   = minutesToTimeStr(block.startMinutes + liveDuration);

  // Search Filter & Highlighting Logic
  const activeSearchQuery = (searchQuery || '').trim().toLowerCase();
  const isSearchActive    = activeSearchQuery.length > 0;
  const isSearchMatch     = isSearchActive && (
    block.title.toLowerCase().includes(activeSearchQuery) ||
    (block.description && block.description.toLowerCase().includes(activeSearchQuery)) ||
    (block.goalTitle && block.goalTitle.toLowerCase().includes(activeSearchQuery)) ||
    (block.priority && block.priority.toLowerCase().includes(activeSearchQuery))
  );

  // ── Resize ────────────────────────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current   = e.clientY;
    resizeStartDur.current = block.duration;
    let currentDur = block.duration;

    const onMove = (ev: MouseEvent) => {
      const delta   = ev.clientY - resizeStartY.current;
      const raw     = resizeStartDur.current + (delta / hourHeight) * 60;
      const snapped = snapToResolution(Math.max(resolution, raw), resolution);
      currentDur = snapped;
      setLiveDuration(snapped);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      setIsResizing(false);
      const final = snapToResolution(Math.max(resolution, currentDur), resolution);
      resizeScheduledBlock(block.id, final);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  };

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setSelectedBlockId(block.id);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type:         'SCHEDULED_BLOCK',
      id:           block.id,
      blockId:      block.blockId,
      title:        block.title,
      description:  block.description,
      color:        block.color,
      priority:     block.priority,
      icon:         block.icon,
      duration:     block.duration,
      startMinutes: block.startMinutes,
      dayOfWeek:    block.dayOfWeek,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // ── Click → Focus Card ───────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isResizing) return;
    if (blockRef.current) {
      onFocusCard(block.id, blockRef.current.getBoundingClientRect());
    }
  };

  // ── Visual state & Height Tiers ──────────────────────────────────────────
  const dimmed = anyFocused && !isFocused;
  const hidden = isFocused;
  const isTinyBlock     = heightPx < 28;
  const isCompactBlock  = heightPx >= 28 && heightPx < 44;
  const isStandardBlock = heightPx >= 44 && heightPx < 68;
  const isTallBlock     = heightPx >= 68;
  const accentColor     = isSearchMatch ? '#818CF8' : block.color;

  // Distinct system backgrounds and text formatting
  const cardBg = isDark
    ? isSearchMatch
      ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.28) 0%, rgba(30, 41, 59, 0.95) 45%, #0f172a 100%)'
      : `linear-gradient(90deg, ${accentColor}26 0%, rgba(30, 41, 59, 0.94) 40%, #0f172a 100%)`
    : isSearchMatch
      ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(248, 250, 252, 0.95) 40%, #ffffff 100%)'
      : `linear-gradient(90deg, ${accentColor}18 0%, rgba(248, 250, 252, 0.98) 35%, #ffffff 100%)`;

  const titleClass = isDark
    ? 'text-white font-bold text-xs tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]'
    : 'text-slate-900 font-bold text-xs tracking-tight';

  const timeClass = isDark
    ? 'text-slate-200 font-mono font-medium text-[10px] sm:text-[11px] tabular-nums'
    : 'text-slate-700 font-mono font-semibold text-[10px] sm:text-[11px] tabular-nums';

  const durationBadgeClass = isDark
    ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80'
    : 'bg-slate-100 text-slate-700 border border-slate-300/80';

  const descriptionClass = isDark
    ? 'text-slate-300 text-[10px] leading-snug truncate'
    : 'text-slate-600 text-[10px] leading-snug truncate';

  const goalBadgeClass = isDark
    ? 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/50'
    : 'bg-indigo-50 text-indigo-800 border border-indigo-200';

  return (
    <div
      ref={blockRef}
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={`${block.title}\nTime: ${startTime} – ${endTime} (${formatDuration(liveDuration)})${block.goalTitle ? '\nGoal: ' + block.goalTitle : ''}${block.description ? '\nNote: ' + block.description : ''}`}
      aria-label={`${block.title}, from ${startTime} to ${endTime}`}
      style={{
        top:             `${topPx}px`,
        height:          `${Math.max(heightPx - 2, 18)}px`,
        borderLeftColor: accentColor,
        background:      cardBg,
        opacity:         hidden ? 0 : dimmed ? 0.28 : isSearchActive && !isSearchMatch ? 0.15 : isCompleted ? 0.65 : isSkipped ? 0.40 : 1,
        filter:          isSearchActive && !isSearchMatch ? 'grayscale(80%)' : 'none',
        pointerEvents:   hidden ? 'none' : 'auto',
        transition:      'opacity 250ms ease, box-shadow 150ms ease, transform 150ms ease, filter 250ms ease',
      }}
      className={`group absolute left-1 right-1 rounded-md border-l-[4px] border ${
        isDark ? 'border-slate-800/80 bg-slate-900' : 'border-slate-200/90 bg-white'
      } shadow-xs hover:shadow-sm cursor-pointer select-none overflow-hidden
        hover:brightness-105 hover:-translate-y-px transition-all
        ${isSearchMatch ? '!z-30 ring-2 ring-[#3659C9] shadow-md scale-[1.01]' : ''}
        ${isConflicting ? '!border-l-rose-500 border-dashed ring-1 ring-rose-500/50' : ''}
        ${isResizing ? 'z-30 shadow-lg cursor-ns-resize' : 'hover:z-10'}
      `}
    >
      {/* ── CARD CONTENT ── */}
      <div className="h-full flex flex-col justify-center px-2 py-0.5 pointer-events-none min-w-0 overflow-hidden">
        {isTinyBlock ? (
          /* ── TINY (< 28px): Single line with dot + title + start time ── */
          <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: isDark ? `0 0 4px ${accentColor}80` : undefined,
                }}
              />
              {isConflicting && <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0 animate-pulse" />}
              {isCompleted && <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
              <span className={`${titleClass} text-[11px] truncate leading-none ${isCompleted ? 'line-through opacity-70' : ''}`}>
                {block.title}
              </span>
            </div>
            <span className={`${timeClass} text-[10px] shrink-0 ml-1 leading-none`}>
              {startTime}
            </span>
          </div>
        ) : isCompactBlock ? (
          /* ── COMPACT (28px - 44px): Clean header + time row ── */
          <div className="flex flex-col justify-center gap-0.5 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: isDark ? `0 0 5px ${accentColor}90` : undefined,
                }}
              />
              {isSearchMatch && <span className="text-[10px] shrink-0 font-bold text-indigo-400">🔍</span>}
              {isConflicting && <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0 animate-pulse" />}
              {isCompleted && <Check className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
              <span className={`${titleClass} truncate flex-1 leading-tight ${isCompleted ? 'line-through opacity-70' : ''}`}>
                {block.title}
              </span>
            </div>
            {/* Time row */}
            <div className="flex items-center justify-between gap-1 pl-3.5 min-w-0">
              <span className={`${timeClass} truncate leading-tight`}>
                {startTime}–{endTime}
              </span>
            </div>
          </div>
        ) : isStandardBlock ? (
          /* ── STANDARD (44px - 68px): Header + time range + duration pill ── */
          <div className="flex flex-col justify-center gap-1 min-w-0">
            {/* Clean Header row */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: isDark ? `0 0 6px ${accentColor}90` : undefined,
                }}
              />
              {isSearchMatch && <span className="text-[10px] shrink-0 font-bold text-indigo-400">🔍</span>}
              {isConflicting && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 animate-pulse" />}
              {isCompleted && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
              <span className={`${titleClass} truncate flex-1 leading-snug ${isCompleted ? 'line-through opacity-70' : ''}`}>
                {block.title}
              </span>
              {block.goalTitle && (
                <span className={`text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 ${goalBadgeClass}`} title={`Goal: ${block.goalTitle}`}>
                  🎯
                </span>
              )}
            </div>

            {/* Time range & duration pill */}
            <div className="flex items-center justify-between gap-1 pl-3.5 min-w-0">
              <span className={timeClass}>
                {startTime}–{endTime}
              </span>
              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded shrink-0 ${durationBadgeClass}`}>
                {formatDuration(liveDuration)}
              </span>
            </div>
          </div>
        ) : (
          /* ── TALL (>= 68px): Full header + time + duration + goal tag + description ── */
          <div className="flex flex-col justify-center gap-1.5 min-w-0 py-0.5">
            {/* Clean Header row */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: isDark ? `0 0 6px ${accentColor}` : undefined,
                }}
              />
              {isSearchMatch && <span className="text-[10px] shrink-0 font-bold text-indigo-400">🔍</span>}
              {isConflicting && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0 animate-pulse" />}
              {isCompleted && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
              <span className={`${titleClass} truncate flex-1 leading-snug ${isCompleted ? 'line-through opacity-70' : ''}`}>
                {block.title}
              </span>
            </div>

            {/* Time range & duration pill */}
            <div className="flex items-center justify-between gap-1 pl-4 min-w-0">
              <span className={timeClass}>
                {startTime}–{endTime}
              </span>
              <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${durationBadgeClass}`}>
                {formatDuration(liveDuration)}
              </span>
            </div>

            {/* Goal Tag */}
            {block.goalTitle && (
              <div className="pl-4 min-w-0">
                <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded truncate max-w-full ${goalBadgeClass}`}>
                  <Target className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{block.goalTitle}</span>
                </span>
              </div>
            )}

            {/* Description / Notes row */}
            {block.description && (
              <div className="pl-4 min-w-0">
                <p className={descriptionClass}>
                  {block.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RESIZE HANDLE ── */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(to top, ${accentColor}30, transparent)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-8 h-0.5 rounded-full ${isDark ? 'bg-white/30' : 'bg-slate-400/50'}`} />
      </div>

      {/* ── LIVE RESIZE BADGE ── */}
      {isResizing && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: `${accentColor}25` }}
        >
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-md"
            style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${accentColor}60` }}
          >
            {Math.round(liveDuration / 60 * 10) / 10}h
          </span>
        </div>
      )}
    </div>
  );
};

export const ScheduledBlockItem = React.memo(ScheduledBlockItemComponent);

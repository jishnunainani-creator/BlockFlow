import React, { useRef } from 'react';
import { ScheduledBlock, COMPLETION_STATUS_CONFIG, CompletionStatus } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { minutesToTimeStr, snapToResolution } from '../../utils/timeUtils';
import { AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

const SHOW_TIME_THRESHOLD = 34; // px — show time row above this height

export const ScheduledBlockItem: React.FC<ScheduledBlockItemProps> = ({
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
    moveScheduledBlock,
    setSelectedBlockId,
    conflicts,
  } = useTimetable();

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
  const showTime = heightPx >= SHOW_TIME_THRESHOLD;

  const startTime = minutesToTimeStr(block.startMinutes);
  const endTime   = minutesToTimeStr(block.startMinutes + liveDuration);

  // ── Resize ────────────────────────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current   = e.clientY;
    resizeStartDur.current = block.duration;

    const onMove = (ev: MouseEvent) => {
      const delta   = ev.clientY - resizeStartY.current;
      const raw     = resizeStartDur.current + (delta / hourHeight) * 60;
      const snapped = snapToResolution(Math.max(resolution, raw), resolution);
      setLiveDuration(snapped);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      setIsResizing(false);
      const final = snapToResolution(Math.max(resolution, liveDuration), resolution);
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

  // ── Visual state ─────────────────────────────────────────────────────────
  // When any focus card is open, non-focused cards fade out
  const dimmed = anyFocused && !isFocused;
  // When THIS card is focused, it hides (FocusCard portal sits on top)
  const hidden = isFocused;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={blockRef}
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onClick={handleClick}
      style={{
        top:             `${topPx}px`,
        height:          `${Math.max(heightPx - 2, 18)}px`,
        borderLeftColor: block.color,
        backgroundColor: `${block.color}16`,
        opacity:         hidden ? 0 : dimmed ? 0.28 : isCompleted ? 0.65 : isSkipped ? 0.40 : 1,
        pointerEvents:   hidden ? 'none' : 'auto',
        transition:      'opacity 250ms ease, box-shadow 150ms ease, transform 150ms ease',
      }}
      className={`group absolute left-1.5 right-1.5 rounded-xl border-l-[4px] border border-white/[0.06]
        cursor-pointer select-none overflow-hidden
        hover:brightness-110 hover:shadow-md hover:-translate-y-px
        ${isConflicting ? '!border-l-rose-500 border-dashed ring-1 ring-rose-500/40' : ''}
        ${isResizing ? 'z-30 shadow-xl cursor-ns-resize' : 'hover:z-10'}
      `}
    >
      {/* ── COMPACT CONTENT ── */}
      <div className="h-full flex flex-col justify-center px-2.5 py-1.5 pointer-events-none">

        {/* Title row */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Conflict indicator */}
          {isConflicting && (
            <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0 animate-pulse" />
          )}

          {/* Completion strikethrough */}
          <span
            className={`text-[12px] sm:text-[13px] font-semibold text-white leading-tight truncate flex-1 ${
              isCompleted ? 'line-through opacity-60' : ''
            }`}
          >
            {block.title}
          </span>
        </div>

        {/* Time row — only if card is tall enough */}
        {showTime && (
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-400/80 mt-0.5 truncate tabular-nums">
            {startTime}–{endTime}
          </span>
        )}
      </div>

      {/* ── RESIZE HANDLE ── */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(to top, ${block.color}30, transparent)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-8 h-0.5 rounded-full bg-white/20" />
      </div>

      {/* ── LIVE RESIZE BADGE ── */}
      {isResizing && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: `${block.color}20` }}
        >
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
            style={{ backgroundColor: block.color, boxShadow: `0 4px 12px ${block.color}60` }}
          >
            {Math.round(liveDuration / 60 * 10) / 10}h
          </span>
        </div>
      )}
    </div>
  );
};

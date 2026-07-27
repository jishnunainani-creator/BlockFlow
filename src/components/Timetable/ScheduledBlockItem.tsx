import React, { useState, useRef, useEffect } from 'react';
import { ScheduledBlock, COMPLETION_STATUS_CONFIG, CompletionStatus } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { formatDuration, minutesToTimeStr, snapToResolution } from '../../utils/timeUtils';
import { AVAILABLE_ICONS } from '../Library/BlockModal';
import { StatusPickerPopover } from '../Completion/StatusPickerPopover';
import {
  GripHorizontal,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Check,
  AlertTriangle,
  Bell,
  BellRing,
} from 'lucide-react';

interface ScheduledBlockItemProps {
  block: ScheduledBlock;
  startHour: number;
  hourHeight: number;
}

export const ScheduledBlockItem: React.FC<ScheduledBlockItemProps> = ({
  block,
  startHour,
  hourHeight,
}) => {
  const {
    resolution,
    resizeScheduledBlock,
    deleteScheduledBlock,
    updateScheduledBlock,
    updateBlockStatus,
    selectedBlockId,
    setSelectedBlockId,
    conflicts,
  } = useTimetable();

  const [isResizing, setIsResizing] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [tempNotes, setTempNotes] = useState(block.description || '');
  const [liveDuration, setLiveDuration] = useState(block.duration);

  const blockRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartDuration = useRef<number>(0);

  const isSelected = selectedBlockId === block.id;
  const isConflicting = conflicts.has(block.id);
  const conflictData = conflicts.get(block.id);

  const currentStatus: CompletionStatus = block.status || 'not_started';
  const statusCfg = COMPLETION_STATUS_CONFIG[currentStatus];

  const isCompleted = currentStatus === 'completed' || currentStatus === 'faster';
  const isSkipped = currentStatus === 'skipped' || currentStatus === 'missed';

  useEffect(() => {
    if (!isResizing) {
      setLiveDuration(block.duration);
    }
  }, [block.duration, isResizing]);

  const topPx = ((block.startMinutes - startHour * 60) / 60) * hourHeight;
  const heightPx = (liveDuration / 60) * hourHeight;

  const IconComp = (() => {
    const found = AVAILABLE_ICONS.find((i) => i.id === block.icon);
    return found ? found.Icon : Sparkles;
  })();

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartDuration.current = block.duration;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartY.current;
      const deltaMinutes = (deltaY / hourHeight) * 60;
      const rawDuration = resizeStartDuration.current + deltaMinutes;
      const snapped = snapToResolution(Math.max(resolution, rawDuration), resolution);
      setLiveDuration(snapped);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      const finalDuration = snapToResolution(Math.max(resolution, liveDuration), resolution);
      resizeScheduledBlock(block.id, finalDuration);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setSelectedBlockId(block.id);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'SCHEDULED_BLOCK',
        id: block.id,
        blockId: block.blockId,
        title: block.title,
        description: block.description,
        color: block.color,
        priority: block.priority,
        icon: block.icon,
        duration: block.duration,
        startMinutes: block.startMinutes,
        dayOfWeek: block.dayOfWeek,
      })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSaveNotes = () => {
    updateScheduledBlock(block.id, { description: tempNotes });
    setIsEditingNotes(false);
  };

  const handleSetReminder = (mins: number) => {
    updateScheduledBlock(block.id, { reminderMinutes: mins });
    setShowReminderMenu(false);
  };

  const endMinutes = block.startMinutes + liveDuration;

  return (
    <div
      ref={blockRef}
      draggable={!isResizing && !isEditingNotes}
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedBlockId(block.id);
      }}
      style={{
        top: `${topPx}px`,
        height: `${heightPx - 2}px`,
        borderColor: isConflicting ? '#EF4444' : block.color,
        backgroundColor: `${block.color}18`,
        opacity: isCompleted ? 0.75 : isSkipped ? 0.5 : 1,
      }}
      className={`group absolute left-1 right-1 rounded-xl border-l-4 border-y border-r shadow-md backdrop-blur-md transition-all duration-150 select-none overflow-visible hover:shadow-xl hover:z-20 ${
        isSelected ? 'ring-2 ring-indigo-500 z-30 shadow-2xl scale-[1.01]' : 'cursor-grab active:cursor-grabbing'
      } ${isConflicting ? 'border-dashed ring-2 ring-rose-500/80' : ''}`}
    >
      {/* Background Accent */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${block.color} 0%, transparent 100%)`,
        }}
      />

      <div className="p-2 h-full flex flex-col justify-between relative z-10">
        <div>
          <div className="flex items-start justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Single-tap Status Badge Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusPicker(!showStatusPicker);
                }}
                className={`px-1.5 py-0.5 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center transition-all ${statusCfg.bgClass} hover:scale-115`}
                title={`Status: ${statusCfg.label} (Click to change)`}
              >
                <span>{statusCfg.badge}</span>
              </button>

              <div
                className="p-1 rounded-md text-white shrink-0 shadow-sm"
                style={{ backgroundColor: block.color }}
              >
                <IconComp className="w-3 h-3" />
              </div>

              <h5 className={`text-xs font-bold text-slate-900 dark:text-white truncate drop-shadow-xs flex items-center gap-1 ${
                isCompleted ? 'line-through opacity-90' : ''
              }`}>
                <span>{block.title}</span>
                {isConflicting && (
                  <span title={conflictData?.message}>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-bounce" />
                  </span>
                )}
              </h5>
            </div>

            {/* Actions Menu */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-slate-900/90 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60 shadow-lg text-white">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReminderMenu(!showReminderMenu);
                }}
                className={`p-0.5 rounded transition-colors ${
                  block.reminderMinutes ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Set Reminder"
              >
                <Bell className="w-3 h-3" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(!isEditingNotes);
                }}
                className="p-0.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
                title="Edit notes"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScheduledBlock(block.id);
                }}
                className="p-0.5 text-slate-300 hover:text-rose-400 rounded hover:bg-slate-700 transition-colors"
                title="Remove block"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Status Picker Popover */}
          {showStatusPicker && (
            <StatusPickerPopover
              currentStatus={currentStatus}
              onSelectStatus={(status) => updateBlockStatus(block.id, status)}
              onClose={() => setShowStatusPicker(false)}
            />
          )}

          {/* Time range & duration */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 font-semibold mt-1">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span>
              {minutesToTimeStr(block.startMinutes)} – {minutesToTimeStr(endMinutes)}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/50">
              {formatDuration(liveDuration)}
            </span>
          </div>

          {/* Reminder Menu */}
          {showReminderMenu && (
            <div className="mt-1 p-1.5 bg-slate-900 text-white border border-slate-700 rounded-lg text-[10px] space-y-1 z-30 shadow-xl">
              <span className="block font-bold text-slate-400 uppercase">Set Reminder:</span>
              <div className="flex flex-wrap gap-1">
                {[0, 5, 10, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSetReminder(mins)}
                    className={`px-1.5 py-0.5 rounded border ${
                      block.reminderMinutes === mins
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {mins === 0 ? 'None' : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {isEditingNotes ? (
            <div className="mt-1.5 flex items-center gap-1">
              <input
                type="text"
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNotes()}
                className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="Add notes..."
                autoFocus
              />
              <button onClick={handleSaveNotes} className="p-1 bg-indigo-600 text-white rounded">
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            block.description && (
              <p className="text-[10px] text-slate-700 dark:text-slate-300/90 font-medium truncate mt-1 line-clamp-1">
                {block.description}
              </p>
            )
          )}
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="h-3.5 -mx-2 -mb-2 bg-gradient-to-t from-slate-950/20 to-transparent hover:from-indigo-600/50 flex items-center justify-center cursor-ns-resize group/resizer transition-colors"
          title="Drag to resize duration"
        >
          <GripHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover/resizer:text-white transition-colors" />
        </div>
      </div>

      {isResizing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-2xl border border-indigo-400 pointer-events-none animate-pulse">
          {formatDuration(liveDuration)}
        </div>
      )}
    </div>
  );
};

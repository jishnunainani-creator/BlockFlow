import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { LibraryBlock, PRIORITY_CONFIG } from '../../types/timetable';
import { AVAILABLE_ICONS } from '../Library/BlockModal';
import { minutesToTimeStr } from '../../utils/timeUtils';
import { X, Plus, Sparkles, Search, Clock, ChevronRight, Check } from 'lucide-react';

interface MobileAddBlockSheetProps {
  onClose: () => void;
  startHour?: number;
  endHour?: number;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const MobileAddBlockSheet: React.FC<MobileAddBlockSheetProps> = ({
  onClose,
  startHour = 6,
  endHour = 23,
}) => {
  const { libraryBlocks, addScheduledBlock } = useTimetable();

  const [step, setStep] = useState<'pick-block' | 'pick-time'>('pick-block');
  const [selectedBlock, setSelectedBlock] = useState<LibraryBlock | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [search, setSearch] = useState('');

  const filteredBlocks = libraryBlocks.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const handlePickBlock = (block: LibraryBlock) => {
    setSelectedBlock(block);
    setStep('pick-time');
  };

  const handleAdd = () => {
    if (!selectedBlock) return;
    const startMinutes = selectedHour * 60 + selectedMinute;
    addScheduledBlock({
      blockId: selectedBlock.id,
      title: selectedBlock.title,
      description: selectedBlock.description,
      color: selectedBlock.color,
      priority: selectedBlock.priority,
      icon: selectedBlock.icon,
      dayOfWeek: selectedDay,
      startMinutes,
      duration: selectedBlock.defaultDuration || 60,
      status: 'not_started',
    });
    onClose();
  };

  // Generate time options every 30 min
  const timeSlots: { hour: number; minute: number }[] = [];
  for (let h = startHour; h <= endHour; h++) {
    timeSlots.push({ hour: h, minute: 0 });
    if (h < endHour) timeSlots.push({ hour: h, minute: 30 });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0">
          {step === 'pick-time' && selectedBlock ? (
            <button
              onClick={() => setStep('pick-block')}
              className="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1"
            >
              ← Back
            </button>
          ) : (
            <span className="text-sm font-bold text-slate-300">Add Block to Schedule</span>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Pick a block from library */}
        {step === 'pick-block' && (
          <>
            {/* Search */}
            <div className="px-4 pt-3 pb-2 shrink-0">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search your blocks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Block list */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
              {filteredBlocks.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No blocks found. Create some in the Library first!</p>
                </div>
              ) : (
                filteredBlocks.map((block) => {
                  const IconComp = AVAILABLE_ICONS.find((i) => i.id === block.icon)?.Icon || Sparkles;
                  const priorityCfg = PRIORITY_CONFIG[block.priority];
                  return (
                    <button
                      key={block.id}
                      onClick={() => handlePickBlock(block)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 active:scale-[0.98] transition-all text-left"
                    >
                      {/* Color icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                        style={{ backgroundColor: block.color }}
                      >
                        <IconComp className="w-5 h-5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{block.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                            style={{
                              color: block.color,
                              borderColor: `${block.color}50`,
                              backgroundColor: `${block.color}15`,
                            }}
                          >
                            {priorityCfg?.label || block.priority}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            {block.defaultDuration} min
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Step 2: Pick day + time */}
        {step === 'pick-time' && selectedBlock && (
          <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5 pt-3">
            {/* Selected block preview */}
            {(() => {
              const IconComp = AVAILABLE_ICONS.find((i) => i.id === selectedBlock.icon)?.Icon || Sparkles;
              return (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: `${selectedBlock.color}50`, backgroundColor: `${selectedBlock.color}12` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: selectedBlock.color }}
                  >
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{selectedBlock.title}</p>
                    <p className="text-[11px] text-slate-400">{selectedBlock.defaultDuration} min</p>
                  </div>
                </div>
              );
            })()}

            {/* Day picker */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Day</p>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selectedDay === idx
                        ? 'text-white border-transparent shadow-lg'
                        : 'text-slate-400 border-slate-700 bg-slate-900 hover:border-slate-500'
                    }`}
                    style={
                      selectedDay === idx
                        ? { backgroundColor: selectedBlock.color, borderColor: selectedBlock.color }
                        : {}
                    }
                  >
                    {DAY_SHORTS[idx]}
                  </button>
                ))}
              </div>
            </div>

            {/* Time picker */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Start Time</p>
              <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                {timeSlots.map(({ hour, minute }) => {
                  const isSelected = selectedHour === hour && selectedMinute === minute;
                  return (
                    <button
                      key={`${hour}-${minute}`}
                      onClick={() => { setSelectedHour(hour); setSelectedMinute(minute); }}
                      className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'text-slate-400 border-slate-800 bg-slate-900 hover:border-slate-600'
                      }`}
                      style={isSelected ? { backgroundColor: selectedBlock.color } : {}}
                    >
                      {minutesToTimeStr(hour * 60 + minute)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300">
              Adding <span className="font-bold text-white">{selectedBlock.title}</span> on{' '}
              <span className="font-bold text-white">{DAY_NAMES[selectedDay]}</span> at{' '}
              <span className="font-bold text-white">{minutesToTimeStr(selectedHour * 60 + selectedMinute)}</span>
              {' '}for <span className="font-bold text-white">{selectedBlock.defaultDuration} min</span>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
              style={{ backgroundColor: selectedBlock.color }}
            >
              <Check className="w-4 h-4" />
              Add to Timetable
            </button>
          </div>
        )}
      </div>
    </>
  );
};

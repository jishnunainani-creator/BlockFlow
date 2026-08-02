import React, { useState, useMemo } from 'react';
import { ScheduledBlock, LibraryBlock } from '../../types/timetable';
import { useTimetable } from '../../context/TimetableContext';
import { normalizeActivityTitle } from './SaveBlockToLibraryModal';
import { formatDuration } from '../../utils/timeUtils';
import {
  X,
  Bookmark,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Link,
  ArrowRight,
} from 'lucide-react';

interface BulkSaveToLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLibrary?: () => void;
}

export interface UniqueCandidateActivity {
  normalizedTitle: string;
  displayTitle: string;
  description: string;
  defaultDuration: number;
  priority: string;
  color: string;
  icon: string;
  isFixed: boolean;
  occurrences: ScheduledBlock[];
}

export const BulkSaveToLibraryModal: React.FC<BulkSaveToLibraryModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLibrary,
}) => {
  const { libraryBlocks, currentWeekScheduledBlocks, bulkAddLibraryBlocksAndLink } = useTimetable();

  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [linkedCount, setLinkedCount] = useState(0);

  // Analyze timetable blocks & deduplicate into unique candidate activities
  const candidateGroup = useMemo(() => {
    if (!isOpen) return [];

    const unlinkedBlocks = currentWeekScheduledBlocks.filter(
      (b) => !b.blockId || !libraryBlocks.some((lib) => lib.id === b.blockId)
    );

    const map = new Map<string, UniqueCandidateActivity>();

    unlinkedBlocks.forEach((block) => {
      const norm = normalizeActivityTitle(block.title);
      if (!map.has(norm)) {
        map.set(norm, {
          normalizedTitle: norm,
          displayTitle: block.title.trim(),
          description: block.description || '',
          defaultDuration: block.duration || 60,
          priority: block.priority || 'medium',
          color: block.color || '#3B82F6',
          icon: block.icon || 'code',
          isFixed: !!block.isFixed,
          occurrences: [block],
        });
      } else {
        const existing = map.get(norm)!;
        existing.occurrences.push(block);
      }
    });

    return Array.from(map.values());
  }, [isOpen, currentWeekScheduledBlocks, libraryBlocks]);

  // Select all by default when candidates change
  React.useEffect(() => {
    if (candidateGroup.length > 0) {
      setSelectedTitles(new Set(candidateGroup.map((c) => c.normalizedTitle)));
    } else {
      setSelectedTitles(new Set());
    }
    setIsCompleted(false);
  }, [candidateGroup]);

  if (!isOpen) return null;

  const totalTemporaryBlocks = currentWeekScheduledBlocks.filter(
    (b) => !b.blockId || !libraryBlocks.some((lib) => lib.id === b.blockId)
  ).length;

  const handleToggleTitle = (normTitle: string) => {
    const next = new Set(selectedTitles);
    if (next.has(normTitle)) {
      next.delete(normTitle);
    } else {
      next.add(normTitle);
    }
    setSelectedTitles(next);
  };

  const handleToggleSelectAll = () => {
    if (selectedTitles.size === candidateGroup.length) {
      setSelectedTitles(new Set());
    } else {
      setSelectedTitles(new Set(candidateGroup.map((c) => c.normalizedTitle)));
    }
  };

  const handleExecuteBulkSave = () => {
    const selectedCandidates = candidateGroup.filter((c) =>
      selectedTitles.has(c.normalizedTitle)
    );

    if (selectedCandidates.length === 0) return;

    const payload = selectedCandidates.map((candidate) => {
      const existing = libraryBlocks.find(
        (lib) => normalizeActivityTitle(lib.title) === candidate.normalizedTitle
      );

      return {
        blockData: {
          title: candidate.displayTitle,
          description: candidate.description,
          defaultDuration: candidate.defaultDuration,
          priority: candidate.priority,
          color: candidate.color,
          icon: candidate.icon,
        },
        scheduledBlockIds: candidate.occurrences.map((o) => o.id),
        existingLibraryId: existing?.id,
      };
    });

    const result = bulkAddLibraryBlocksAndLink(payload);
    setCreatedCount(result.newCreatedCount);
    setLinkedCount(result.totalLinkedCount);
    setIsCompleted(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Bulk Save Timetable Activities
              </h3>
              <p className="text-xs text-slate-400">
                {candidateGroup.length > 0
                  ? `${totalTemporaryBlocks} temporary blocks · ${candidateGroup.length} unique candidates`
                  : 'Scan timetable for unlinked activities'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Completion View */}
        {isCompleted ? (
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-bold text-white">✓ Activity Library Updated</h4>
              <p className="text-sm text-slate-400">
                Successfully organized your timetable into permanent reusable definitions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</span>
                <p className="text-xl font-black text-indigo-400 font-mono">{createdCount}</p>
                <span className="text-[10px] text-slate-400">Reusable Activities</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Linked</span>
                <p className="text-xl font-black text-emerald-400 font-mono">{linkedCount}</p>
                <span className="text-[10px] text-slate-400">Timetable Occurrences</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Close
              </button>
              {onNavigateToLibrary && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToLibrary();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  View Activity Library <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : candidateGroup.length === 0 ? (
          /* Empty State: All blocks linked */
          <div className="p-10 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">All Timetable Blocks Linked</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Every scheduled block on your current timetable already references a reusable Activity Library definition!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Main Candidate Selection List */
          <>
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Select activities to add to reusable library:
              </span>
              <button
                onClick={handleToggleSelectAll}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
              >
                {selectedTitles.size === candidateGroup.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" /> Select All ({candidateGroup.length})
                  </>
                )}
              </button>
            </div>

            {/* Scrollable list */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
              {candidateGroup.map((candidate) => {
                const isSelected = selectedTitles.has(candidate.normalizedTitle);
                return (
                  <div
                    key={candidate.normalizedTitle}
                    onClick={() => handleToggleTitle(candidate.normalizedTitle)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/50 border-slate-800/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {candidate.displayTitle}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                          <span>{candidate.occurrences.length} occurrences</span>
                          <span>·</span>
                          <span>{formatDuration(candidate.defaultDuration)}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold border shrink-0"
                      style={{
                        color: candidate.color,
                        borderColor: `${candidate.color}35`,
                        backgroundColor: `${candidate.color}15`,
                      }}
                    >
                      {candidate.priority}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400 font-mono">
                {selectedTitles.size} of {candidateGroup.length} selected
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteBulkSave}
                  disabled={selectedTitles.size === 0}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Bookmark className="w-4 h-4" />
                  Save {selectedTitles.size} Activities
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

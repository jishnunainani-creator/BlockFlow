import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';
import { useTimetable } from '../../context/TimetableContext';
import {
  ThoughtNote,
  ThoughtFilterOption,
  ThoughtSortOption,
  ThoughtColor,
  DeleteChildrenChoice,
} from '../../types/thoughtSpace';
import {
  buildThoughtTree,
  filterAndSortNotes,
  generateThoughtBackup,
} from '../../utils/thoughtSpaceEngine';
import {
  loadThoughts,
  saveThoughts,
  createThought,
  updateThought,
  deleteThought,
  hydrateFromIndexedDB,
} from '../../utils/thoughtStorage';

import { ThoughtSpaceHeader } from '../ThoughtSpace/ThoughtSpaceHeader';
import { QuickThoughtEntry } from '../ThoughtSpace/QuickThoughtEntry';
import { ThoughtNoteCard } from '../ThoughtSpace/ThoughtNoteCard';
import { ThoughtNoteEditorModal } from '../ThoughtSpace/ThoughtNoteEditorModal';
import { DeleteNoteConfirmModal } from '../ThoughtSpace/DeleteNoteConfirmModal';
import { ThoughtImportModal } from '../ThoughtSpace/ThoughtImportModal';
import { Brain, ShieldCheck, HardDrive } from 'lucide-react';

interface ThoughtSpaceViewProps {
  onNavigate?: (view: NavView) => void;
}

export const ThoughtSpaceView: React.FC<ThoughtSpaceViewProps> = ({ onNavigate }) => {
  const { addToast } = useTimetable();

  // State
  const [notes, setNotes] = useState<ThoughtNote[]>(() => loadThoughts());
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ThoughtFilterOption>('all');
  const [sort, setSort] = useState<ThoughtSortOption>('updated_desc');

  // Modals state
  const [editingNote, setEditingNote] = useState<ThoughtNote | null>(null);
  const [deletingNote, setDeletingNote] = useState<ThoughtNote | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync state on mount and listen to changes
  useEffect(() => {
    // Synchronously ensure notes are current
    setNotes(loadThoughts());

    // Hydrate from IndexedDB if needed
    hydrateFromIndexedDB().then((hydrated) => {
      if (hydrated && hydrated.length > 0) {
        setNotes(hydrated);
      }
    });

    const handleStorageChange = () => {
      setNotes(loadThoughts());
    };

    window.addEventListener('blockflow_thoughts_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('blockflow_thoughts_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Compute stats
  const totalCount = notes.length;
  const activeNotes = useMemo(() => notes.filter((n) => !n.isArchived), [notes]);
  const activeCount = activeNotes.length;
  const pinnedCount = useMemo(() => notes.filter((n) => n.isPinned && !n.isArchived).length, [notes]);
  const archivedCount = useMemo(() => notes.filter((n) => n.isArchived).length, [notes]);

  // Filtered & sorted notes
  const displayedNotes = useMemo(() => {
    return filterAndSortNotes(notes, searchQuery, filter, sort);
  }, [notes, searchQuery, filter, sort]);

  // Hierarchical tree structure
  const noteTree = useMemo(() => {
    return buildThoughtTree(displayedNotes);
  }, [displayedNotes]);

  // Handlers
  const handleAddThought = useCallback(
    ({ title, body, color }: { title?: string; body: string; color: ThoughtColor }) => {
      createThought({
        title,
        body,
        color,
      });
      setNotes(loadThoughts());
      addToast('Thought captured', 'success');
    },
    [addToast]
  );

  const handleAddSubnote = useCallback(
    (parentNote: ThoughtNote) => {
      const child = createThought({
        title: '',
        body: '',
        parentNoteId: parentNote.id,
        color: parentNote.color,
      });
      setNotes(loadThoughts());
      setEditingNote(child);
      addToast(`Added subnote to "${parentNote.title || 'Thought'}"`, 'info');
    },
    [addToast]
  );

  const handleUpdateThought = useCallback(
    (id: string, updates: Partial<ThoughtNote>) => {
      updateThought(id, updates);
      setNotes(loadThoughts());
      if (editingNote && editingNote.id === id) {
        setEditingNote((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [editingNote]
  );

  const handleTogglePin = useCallback(
    (id: string, isPinned: boolean) => {
      handleUpdateThought(id, { isPinned });
      addToast(isPinned ? 'Note pinned' : 'Note unpinned', 'info');
    },
    [handleUpdateThought, addToast]
  );

  const handleToggleArchive = useCallback(
    (id: string, isArchived: boolean) => {
      handleUpdateThought(id, { isArchived });
      addToast(isArchived ? 'Note archived' : 'Note unarchived', 'info');
    },
    [handleUpdateThought, addToast]
  );

  const handleDeleteRequest = useCallback((note: ThoughtNote) => {
    setDeletingNote(note);
  }, []);

  const handleConfirmDelete = useCallback(
    (id: string, choice: DeleteChildrenChoice) => {
      deleteThought(id, choice);
      setNotes(loadThoughts());
      if (editingNote && editingNote.id === id) {
        setEditingNote(null);
      }
      addToast('Thought deleted', 'info');
    },
    [editingNote, addToast]
  );

  // Manual Export
  const handleExportNotes = useCallback(() => {
    if (notes.length === 0) {
      addToast('No thoughts to export', 'warning');
      return;
    }
    const jsonStr = generateThoughtBackup(notes);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `blockflow-thoughts-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Exported ${notes.length} notes as JSON`, 'success');
  }, [notes, addToast]);

  // Manual Import Complete
  const handleImportComplete = useCallback(
    (finalNotes: ThoughtNote[], summaryText: string) => {
      saveThoughts(finalNotes);
      setNotes(finalNotes);
      addToast(summaryText, 'success');
    },
    [addToast]
  );

  const deletingSubnoteCount = useMemo(() => {
    if (!deletingNote) return 0;
    return notes.filter((n) => n.parentNoteId === deletingNote.id).length;
  }, [deletingNote, notes]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 select-none scrollbar-thin">
      {/* Breadcrumb Navigation */}
      {onNavigate && (
        <PageBreadcrumb items={[{ label: 'Thought Space' }]} onNavigate={onNavigate} />
      )}

      {/* Header Bar */}
      <ThoughtSpaceHeader
        totalCount={totalCount}
        activeCount={activeCount}
        pinnedCount={pinnedCount}
        archivedCount={archivedCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        onExport={handleExportNotes}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Quick Thought Entry Point */}
      <QuickThoughtEntry onAddThought={handleAddThought} />

      {/* Main Notes List / Tree */}
      {noteTree.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {noteTree.map((rootNote) => (
            <ThoughtNoteCard
              key={rootNote.id}
              note={rootNote}
              onEdit={(n) => setEditingNote(n)}
              onAddSubnote={handleAddSubnote}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          {searchQuery ? (
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No thoughts match "{searchQuery}"
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for different terms or clear the filter.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors text-slate-700 dark:text-slate-300"
              >
                Clear Search
              </button>
            </div>
          ) : filter === 'archived' ? (
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No archived thoughts
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Thoughts you archive to clear your active space will appear here.
              </p>
            </div>
          ) : filter === 'pinned' ? (
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No pinned thoughts
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Pin important thoughts to keep them prominently at the top.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Your Thought Space is clear
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Free your mind by writing thoughts, nesting sub-ideas, or jotting quick outlines above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Local-First Transparency Note */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Data Sovereignty: Thought Space notes stay strictly in your browser and are never uploaded to any cloud server.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>Use <strong>Export Notes</strong> to save portable offline backups between devices.</span>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Note Editor Modal */}
      {editingNote && (
        <ThoughtNoteEditorModal
          note={editingNote}
          isOpen={Boolean(editingNote)}
          onClose={() => setEditingNote(null)}
          allNotes={notes}
          onSave={handleUpdateThought}
          onAddSubnote={handleAddSubnote}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {/* Delete Parent Note Confirmation Modal */}
      {deletingNote && (
        <DeleteNoteConfirmModal
          note={deletingNote}
          isOpen={Boolean(deletingNote)}
          onClose={() => setDeletingNote(null)}
          subnoteCount={deletingSubnoteCount}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Portable JSON Import Modal */}
      {isImportModalOpen && (
        <ThoughtImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          existingNotes={notes}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};

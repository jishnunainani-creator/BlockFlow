import React, { useState, useCallback } from 'react';
import { AppHeader } from '../Header/AppHeader';
import { BlockLibrary } from '../Library/BlockLibrary';
import { TimetableGrid } from '../Timetable/TimetableGrid';

interface CalendarViewProps {
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
  onOpenQuickCapture?: () => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenAddBlock?: () => void;
  onOpenGuidedTour?: () => void;
  onNavigateHome?: () => void;
}

const STORAGE_KEY_LIBRARY_OPEN = 'blockflow_activity_library_open';

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenAISchedule,
  onOpenAICommandCenter,
  onOpenQuickCapture,
  userEmail,
  onOpenAuth,
  onOpenMobileMenu,
  onOpenAddBlock,
  onOpenGuidedTour,
  onNavigateHome,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIBRARY_OPEN);
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });

  const handleToggleLibrary = useCallback(() => {
    setIsLibraryOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_LIBRARY_OPEN, String(next));
      } catch {}
      return next;
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Calendar Top Header */}
      <AppHeader
        onOpenAISchedule={onOpenAISchedule}
        onOpenAICommandCenter={onOpenAICommandCenter}
        onOpenQuickCapture={onOpenQuickCapture}
        userEmail={userEmail}
        onOpenAuth={onOpenAuth}
        onOpenMobileMenu={onOpenMobileMenu}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Grid Workspace + Collapsible Side Library */}
      <div className="flex-1 flex overflow-hidden relative z-0">
        {/* Activity Library Sidebar */}
        {isLibraryOpen && (
          <aside className="w-80 h-full shrink-0 fixed md:relative inset-y-0 md:inset-auto left-0 z-40 md:z-10 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden shadow-2xl md:shadow-none">
            <BlockLibrary onClose={handleToggleLibrary} />
          </aside>
        )}

        {/* Mobile backdrop overlay when drawer is open on small screens */}
        {isLibraryOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
            onClick={handleToggleLibrary}
            aria-hidden="true"
          />
        )}

        {/* Timetable Grid Workspace (occupies 100% of remaining horizontal space) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative min-w-0 z-0 isolate">
          <TimetableGrid
            startHour={6}
            endHour={24}
            isLibraryOpen={isLibraryOpen}
            onToggleLibrary={handleToggleLibrary}
          />
        </main>
      </div>
    </div>
  );
};

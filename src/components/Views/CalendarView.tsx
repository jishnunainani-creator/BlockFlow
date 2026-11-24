import React, { useState, useCallback } from 'react';
import { AppHeader } from '../Header/AppHeader';
import { BlockLibrary } from '../Library/BlockLibrary';
import { TimetableGrid } from '../Timetable/TimetableGrid';
import { LibraryView } from './LibraryView';
import { TemplatesView } from './TemplatesView';
import { ResourcesView } from './ResourcesView';
import { NavView } from '../Navigation/Sidebar';
import {
  Calendar,
  LayoutGrid,
  Bookmark,
  BookOpen,
  Mail,
} from 'lucide-react';

export type CalendarTab = 'grid' | 'library' | 'templates' | 'resources';

interface CalendarViewProps {
  initialTab?: CalendarTab;
  onNavigate?: (view: NavView) => void;
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
  onOpenQuickCapture?: () => void;
  onOpenGoogleWorkspaceSync?: () => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenAddBlock?: () => void;
  onOpenGuidedTour?: () => void;
  onNavigateHome?: () => void;
}

const STORAGE_KEY_LIBRARY_OPEN = 'blockflow_activity_library_open';

export const CalendarView: React.FC<CalendarViewProps> = ({
  initialTab = 'grid',
  onNavigate = () => {},
  onOpenAISchedule,
  onOpenAICommandCenter,
  onOpenQuickCapture,
  onOpenGoogleWorkspaceSync,
  userEmail,
  onOpenAuth,
  onOpenMobileMenu,
  onOpenAddBlock,
  onOpenGuidedTour,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<CalendarTab>(initialTab);
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

  const tabs: { id: CalendarTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'grid', label: 'Weekly Timetable', icon: Calendar },
    { id: 'library', label: 'Activity Library', icon: LayoutGrid },
    { id: 'templates', label: 'Templates', icon: Bookmark },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Calendar Top Header */}
      <AppHeader
        onOpenAISchedule={onOpenAISchedule}
        onOpenAICommandCenter={onOpenAICommandCenter}
        onOpenQuickCapture={onOpenQuickCapture}
        onOpenGoogleWorkspaceSync={onOpenGoogleWorkspaceSync}
        userEmail={userEmail}
        onOpenAuth={onOpenAuth}
        onOpenMobileMenu={onOpenMobileMenu}
        onNavigateHome={onNavigateHome}
      />

      {/* Sub-Navigation Tabs Bar */}
      <div className="shrink-0 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2 backdrop-blur-md flex items-center justify-between gap-3 overflow-x-auto scrollbar-none z-10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-tour={tab.id === 'library' ? 'timetable-library-tab' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'grid' && (
          <div className="flex items-center gap-2">
            {onOpenGoogleWorkspaceSync && (
              <button
                type="button"
                onClick={onOpenGoogleWorkspaceSync}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer shadow-2xs"
                title="Sync Gmail & Calendar with Google Workspace"
              >
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <span>Sync Gmail</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleLibrary}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLibraryOpen
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isLibraryOpen ? 'Hide Library Drawer' : 'Show Library Drawer'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'grid' && (
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

            {/* Timetable Grid Workspace */}
            <main
              data-tour="timetable-grid"
              className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative min-w-0 z-0 isolate"
            >
              <TimetableGrid
                startHour={6}
                endHour={24}
                isLibraryOpen={isLibraryOpen}
                onToggleLibrary={handleToggleLibrary}
              />
            </main>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto">
            <LibraryView onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto">
            <TemplatesView onNavigate={onNavigate} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="flex-1 overflow-y-auto">
            <ResourcesView onNavigate={onNavigate} />
          </div>
        )}
      </div>
    </div>
  );
};

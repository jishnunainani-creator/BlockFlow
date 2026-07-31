import React, { useState } from 'react';
import { AppHeader } from '../Header/AppHeader';
import { BlockLibrary } from '../Library/BlockLibrary';
import { TimetableGrid } from '../Timetable/TimetableGrid';
import { LayoutGrid } from 'lucide-react';

interface CalendarViewProps {
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
  onOpenAICommandCenter?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenAISchedule,
  onOpenAICommandCenter,
}) => {
  const [showSideLibrary, setShowSideLibrary] = useState(true);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Calendar Top Header */}
      <AppHeader
        onOpenAISchedule={onOpenAISchedule}
        onOpenAICommandCenter={onOpenAICommandCenter}
      />

      {/* Main Grid Workspace + Collapsible Side Library */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activity Library Sidebar (Desktop only) */}
        <div
          className={`hidden md:block h-full border-r border-slate-800 transition-all duration-200 shrink-0 z-20 ${
            showSideLibrary ? 'w-80' : 'w-0 hidden'
          }`}
        >
          <BlockLibrary />
        </div>

        {/* Timetable Grid */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
          {/* Side Library Toggle Floating Button */}
          <button
            onClick={() => setShowSideLibrary(!showSideLibrary)}
            className="hidden sm:flex absolute top-3 right-4 z-20 p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold items-center gap-1 shadow-md backdrop-blur-md"
            title={showSideLibrary ? 'Hide Side Library' : 'Show Side Library'}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span>{showSideLibrary ? 'Hide Library' : 'Show Library'}</span>
          </button>

          <TimetableGrid startHour={6} endHour={24} />
        </main>
      </div>
    </div>
  );
};

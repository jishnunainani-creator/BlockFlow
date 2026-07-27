import React, { useState } from 'react';
import { TimetableProvider } from './context/TimetableContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader } from './components/Header/AppHeader';
import { BlockLibrary } from './components/Library/BlockLibrary';
import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { ToastContainer } from './components/UI/ToastContainer';
import { Calendar, LayoutGrid, Sparkles } from 'lucide-react';

export function AppContent() {
  const [mobileTab, setMobileTab] = useState<'timetable' | 'library'>('timetable');

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* App Header */}
      <AppHeader />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Side-by-side / Mobile View Switcher */}
        <div className={`h-full ${mobileTab === 'library' ? 'w-full block' : 'hidden md:block'} shrink-0 z-20`}>
          <BlockLibrary />
        </div>

        <main className={`flex-1 flex flex-col h-full overflow-hidden bg-slate-950 ${mobileTab === 'timetable' ? 'w-full block' : 'hidden md:block'}`}>
          <TimetableGrid startHour={6} endHour={23} hourHeight={80} />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Visible on mobile screens < 768px) */}
      <div className="md:hidden flex items-center justify-around h-14 bg-slate-900 border-t border-slate-800 px-4 shrink-0 z-40">
        <button
          onClick={() => setMobileTab('timetable')}
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            mobileTab === 'timetable' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Timetable</span>
        </button>

        <button
          onClick={() => setMobileTab('library')}
          className={`flex flex-col items-center gap-1 text-xs font-bold transition-colors ${
            mobileTab === 'library' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Blocks Library</span>
        </button>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimetableProvider>
        <AppContent />
      </TimetableProvider>
    </ThemeProvider>
  );
}

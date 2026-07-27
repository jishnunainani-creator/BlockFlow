import React from 'react';
import { TimetableProvider } from './context/TimetableContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader } from './components/Header/AppHeader';
import { BlockLibrary } from './components/Library/BlockLibrary';
import { TimetableGrid } from './components/Timetable/TimetableGrid';
import { ToastContainer } from './components/UI/ToastContainer';

export function AppContent() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* App Header */}
      <AppHeader />

      {/* Main Grid View */}
      <div className="flex-1 flex overflow-hidden relative">
        <BlockLibrary />

        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          <TimetableGrid startHour={6} endHour={23} hourHeight={80} />
        </main>
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

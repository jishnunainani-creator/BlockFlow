import React, { useState, useEffect } from 'react';
import { TimetableProvider, useTimetable } from './context/TimetableContext';
import { ThemeProvider } from './context/ThemeContext';
import { ExecutionProvider } from './context/ExecutionContext';
import { SessionProvider } from './context/SessionContext';
import { SessionModalsContainer } from './components/Execution/SessionModalsContainer';
import { DemoProvider } from './context/DemoContext';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { GuidedTour } from './components/Onboarding/GuidedTour';
import { Sidebar, NavView } from './components/Navigation/Sidebar';
import { AuthPage } from './components/Auth/AuthPage';
import { DashboardView } from './components/Views/DashboardView';
import { CalendarView } from './components/Views/CalendarView';
import { GoalsView } from './components/Views/GoalsView';
import { FocusModeModal } from './components/Focus/FocusModeModal';
import EnhancedFocusMode from './components/Focus/EnhancedFocusMode';
import AssignmentsView from './components/Views/AssignmentsView';
import { AIScheduleModal } from './components/AI/AIScheduleModal';
import { AICommandCenterModal } from './components/AI/AICommandCenterModal';
import { ImportWizardModal } from './components/Migration/ImportWizardModal';
import { LibraryView } from './components/Views/LibraryView';
import { TemplatesView } from './components/Views/TemplatesView';
import { AnalyticsView } from './components/Views/AnalyticsView';
import { AICoachView } from './components/Views/AICoachView';
import { RemindersView } from './components/Views/RemindersView';
import { SettingsView } from './components/Views/SettingsView';
import { ExecutionDashboardView } from './components/Views/ExecutionDashboardView';
import { TaskInboxView } from './components/ExecutionOS/TaskInboxView';
import { ToastContainer } from './components/UI/ToastContainer';
import { getCurrentUser } from './lib/supabase';
import { syncLocalStateToSupabase } from './lib/supabaseMigration';

import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { BlockModal } from './components/Library/BlockModal';

export function AppContent() {
  const { libraryBlocks, currentWeekScheduledBlocks, templates, customCategories, importJSONBackup, addToast, addLibraryBlock } = useTimetable();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [currentView, setCurrentView] = useState<NavView>(isMobile ? 'calendar' : 'dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Modals State
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isAIScheduleOpen, setIsAIScheduleOpen] = useState(false);
  const [aiScheduleTab, setAiScheduleTab] = useState<'voice' | 'text' | 'import'>('voice');
  const [isAICommandCenterOpen, setIsAICommandCenterOpen] = useState(false);

  // Import Wizard State
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [detectedLegacyJson, setDetectedLegacyJson] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auto-detect legacy data key or check mount backup
  useEffect(() => {
    const legacyData = localStorage.getItem('timetable_blocks_v1') || localStorage.getItem('blockflow_data_v3');
    const importPromptShown = localStorage.getItem('blockflow_import_wizard_prompted');

    if (legacyData && !importPromptShown) {
      setDetectedLegacyJson(legacyData);
      setIsImportWizardOpen(true);
      localStorage.setItem('blockflow_import_wizard_prompted', 'true');
    }
  }, []);

  // Check Supabase Auth session & auto sync to PostgreSQL
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.email) {
        setUserEmail(user.email);
        syncLocalStateToSupabase(user.id, libraryBlocks, { 'current': currentWeekScheduledBlocks }, templates).then((res) => {
          if (res.success) {
            console.log('Synced local state to Supabase PostgreSQL database');
          }
        });
      }
    });
  }, [libraryBlocks, currentWeekScheduledBlocks, templates]);

  const openAISchedule = (tab: 'voice' | 'text' | 'import') => {
    setAiScheduleTab(tab);
    setIsAIScheduleOpen(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    let pendingG = false;
    let timeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const key = e.key.toLowerCase();

      if (key === 'g') {
        pendingG = true;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          pendingG = false;
        }, 1200);
      } else if (pendingG) {
        pendingG = false;
        if (key === 'd') setCurrentView('dashboard');
        if (key === 'c') setCurrentView('calendar');
        if (key === 'g') setCurrentView('goals');
        if (key === 'f') setIsFocusModeOpen(true);
        if (key === 'v') openAISchedule('voice');
        if (key === 'l') setCurrentView('library');
        if (key === 't') setCurrentView('templates');
        if (key === 'a') setCurrentView('analytics');
        if (key === 'i') setCurrentView('ai-insights');
        if (key === 'e') setCurrentView('execution');
        if (key === 'r') setCurrentView('reminders');
        if (key === 's') setCurrentView('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  if (showAuthPage) {
    return (
      <AuthPage
        onContinueAsGuest={() => setShowAuthPage(false)}
        onSuccess={(email) => {
          if (email) setUserEmail(email);
          setShowAuthPage(false);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userEmail={userEmail}
        onOpenAuth={() => setShowAuthPage(true)}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
      />

      {/* Main SaaS Module Views */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative pb-16 md:pb-0">
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentView}
            userEmail={userEmail}
            onStartFocusMode={() => setIsFocusModeOpen(true)}
          />
        )}
        {currentView === 'calendar' && (
          <CalendarView
            onOpenAISchedule={openAISchedule}
            onOpenAICommandCenter={() => setIsAICommandCenterOpen(true)}
            userEmail={userEmail}
            onOpenAuth={() => setShowAuthPage(true)}
          />
        )}
        {currentView === 'goals' && <GoalsView />}
        {currentView === 'task-inbox' && <TaskInboxView />}
        {currentView === 'assignments' && <AssignmentsView />}
        {currentView === 'library' && <LibraryView />}
        {currentView === 'templates' && <TemplatesView onNavigate={setCurrentView} />}
        {currentView === 'analytics' && <AnalyticsView />}
        {currentView === 'execution' && <ExecutionDashboardView />}
        {currentView === 'ai-insights' && <AICoachView />}
        {currentView === 'reminders' && <RemindersView />}
        {currentView === 'settings' && (
          <SettingsView userEmail={userEmail} onOpenAuth={() => setShowAuthPage(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenAddBlock={() => setIsBlockModalOpen(true)}
        onOpenAISchedule={openAISchedule}
        onOpenEndOfDay={() => setIsAICommandCenterOpen(true)}
        userEmail={userEmail}
        onOpenAuth={() => setShowAuthPage(true)}
      />

      {/* Quick Add Activity Block Modal */}
      {isBlockModalOpen && (
        <BlockModal
          isOpen={isBlockModalOpen}
          onClose={() => setIsBlockModalOpen(false)}
          onSave={(blockData) => {
            addLibraryBlock(blockData as any);
            setIsBlockModalOpen(false);
          }}
        />
      )}

      {/* Focus Mode Modal */}
      <EnhancedFocusMode isOpen={isFocusModeOpen} onClose={() => setIsFocusModeOpen(false)} />

      {/* Three AI Scheduling Methods Modal */}
      <AIScheduleModal
        isOpen={isAIScheduleOpen}
        onClose={() => setIsAIScheduleOpen(false)}
        initialTab={aiScheduleTab}
      />

      {/* AI Command Center Modal */}
      <AICommandCenterModal
        isOpen={isAICommandCenterOpen}
        onClose={() => setIsAICommandCenterOpen(false)}
      />

      {/* One-Time Data Import Wizard Modal */}
      {detectedLegacyJson && (
        <ImportWizardModal
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
          rawJsonData={detectedLegacyJson}
          onApplyMigration={(result) => {
            importJSONBackup(JSON.stringify(detectedLegacyJson));
          }}
        />
      )}

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Session Modals & End-of-Block Nudge Container */}
      <SessionModalsContainer />

      {/* Interactive Onboarding Welcome Modal */}
      <OnboardingModal />

      {/* Interactive Product Spotlight Tour */}
      <GuidedTour onNavigate={setCurrentView} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimetableProvider>
        <ExecutionProvider>
          <SessionProvider>
            <DemoProvider>
              <AppContent />
            </DemoProvider>
          </SessionProvider>
        </ExecutionProvider>
      </TimetableProvider>
    </ThemeProvider>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { TimetableProvider, useTimetable } from './context/TimetableContext';
import { ThemeProvider } from './context/ThemeContext';
import { ExecutionProvider } from './context/ExecutionContext';
import { SessionProvider } from './context/SessionContext';
import { TimeBudgetProvider } from './context/TimeBudgetContext';
import { SessionModalsContainer } from './components/Execution/SessionModalsContainer';
import { DemoProvider } from './context/DemoContext';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { GuidedTour } from './components/Onboarding/GuidedTour';
import { Sidebar, NavView } from './components/Navigation/Sidebar';
import { AuthPage } from './components/Auth/AuthPage';
import { MyDayView } from './components/Views/MyDayView';
import { DashboardView } from './components/Views/DashboardView';
import { CalendarView } from './components/Views/CalendarView';
import { AdaptivePlannerView } from './components/Views/AdaptivePlannerView';
import { GoalsView } from './components/Views/GoalsView';
import EnhancedFocusMode, { FocusSessionTarget } from './components/Focus/EnhancedFocusMode';
import AssignmentsView from './components/Views/AssignmentsView';
import { AIScheduleModal } from './components/AI/AIScheduleModal';
import { AICommandCenterModal } from './components/AI/AICommandCenterModal';
import { ImportWizardModal } from './components/Migration/ImportWizardModal';
import { LibraryView } from './components/Views/LibraryView';
import { ResourcesView } from './components/Views/ResourcesView';
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
import { QuickCaptureModal } from './components/QuickCapture/QuickCaptureModal';
import { ConvertCaptureModal } from './components/QuickCapture/ConvertCaptureModal';
import { QuickCaptureItem } from './types/quickCapture';

import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { BlockModal } from './components/Library/BlockModal';
import { BlockFlowIntro } from './components/Intro/BlockFlowIntro';
import { getInitialNavView, syncRouteUrl } from './utils/routes';

export function AppContent() {
  const { libraryBlocks, currentWeekScheduledBlocks, templates, importJSONBackup, addLibraryBlock } = useTimetable();

  const [currentView, setCurrentView] = useState<NavView>(getInitialNavView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Quick Capture & Conversion Modals
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [convertingCaptureItem, setConvertingCaptureItem] = useState<QuickCaptureItem | null>(null);

  // Modals State
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusSessionTarget | null>(null);

  const handleStartFocusMode = useCallback((target?: FocusSessionTarget) => {
    setFocusTarget(target || null);
    setIsFocusModeOpen(true);
  }, []);

  const [isAIScheduleOpen, setIsAIScheduleOpen] = useState(false);
  const [aiScheduleTab, setAiScheduleTab] = useState<'voice' | 'text' | 'import'>('voice');
  const [isAICommandCenterOpen, setIsAICommandCenterOpen] = useState(false);

  // Import Wizard State
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [detectedLegacyJson, setDetectedLegacyJson] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('blockflow_session_intro_seen') !== 'true';
    } catch {
      return false;
    }
  });

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('blockflow_session_intro_seen', 'true');
    } catch {
      // ignore
    }
    setShowIntro(false);
  };

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

  const handleNavigate = (view: NavView) => {
    setCurrentView(view);
    syncRouteUrl(view);
  };

  // Sync route URL with browser Back and Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialNavView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Normalize initial route URL upon mount
  useEffect(() => {
    syncRouteUrl(currentView, true);
  }, []);

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

      if (!pendingG && key === 'q') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
        return;
      }

      if (key === 'g') {
        pendingG = true;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          pendingG = false;
        }, 1200);
      } else if (pendingG) {
        pendingG = false;
        if (key === 'm') handleNavigate('my-day');
        if (key === 'd') handleNavigate('dashboard');
        if (key === 'c') handleNavigate('calendar');
        if (key === 'p') handleNavigate('adaptive-planner');
        if (key === 'g') handleNavigate('goals');
        if (key === 'u' || key === 'x') handleNavigate('task-inbox');
        if (key === 'q') setIsQuickCaptureOpen(true);
        if (key === 'f') handleStartFocusMode();
        if (key === 'v') openAISchedule('voice');
        if (key === 'l') handleNavigate('library');
        if (key === 't') handleNavigate('templates');
        if (key === 'a') handleNavigate('analytics');
        if (key === 'i') handleNavigate('ai-insights');
        if (key === 'e') handleNavigate('execution');
        if (key === 'r') handleNavigate('reminders');
        if (key === 's') handleNavigate('settings');
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
        onSelectView={(view) => {
          handleNavigate(view);
          setIsMobileNavOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userEmail={userEmail}
        onOpenAuth={() => setShowAuthPage(true)}
        onOpenFocusMode={() => handleStartFocusMode()}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main SaaS Module Views */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative pb-16 md:pb-0">
        {currentView === 'my-day' && (
          <MyDayView
            onNavigate={handleNavigate}
            onStartFocusMode={handleStartFocusMode}
          />
        )}
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            userEmail={userEmail}
            onStartFocusMode={() => handleStartFocusMode()}
          />
        )}
        {currentView === 'calendar' && (
          <CalendarView
            onOpenAISchedule={openAISchedule}
            onOpenAICommandCenter={() => setIsAICommandCenterOpen(true)}
            onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            userEmail={userEmail}
            onOpenAuth={() => setShowAuthPage(true)}
            onOpenMobileMenu={() => setIsMobileNavOpen(true)}
            onOpenAddBlock={() => setIsBlockModalOpen(true)}
            onNavigateHome={() => handleNavigate('dashboard')}
          />
        )}
        {currentView === 'adaptive-planner' && <AdaptivePlannerView onNavigate={handleNavigate} />}
        {currentView === 'goals' && <GoalsView onNavigate={handleNavigate} />}
        {currentView === 'task-inbox' && (
          <TaskInboxView onNavigate={handleNavigate} onStartFocusMode={handleStartFocusMode} />
        )}
        {currentView === 'assignments' && <AssignmentsView onNavigate={handleNavigate} />}
        {currentView === 'library' && <LibraryView onNavigate={handleNavigate} />}
        {currentView === 'resources' && <ResourcesView onNavigate={handleNavigate} />}
        {currentView === 'templates' && <TemplatesView onNavigate={handleNavigate} />}
        {currentView === 'analytics' && <AnalyticsView onNavigate={handleNavigate} />}
        {currentView === 'execution' && <ExecutionDashboardView onNavigate={handleNavigate} />}
        {currentView === 'ai-insights' && <AICoachView onNavigate={handleNavigate} />}
        {currentView === 'reminders' && <RemindersView onNavigate={handleNavigate} />}
        {currentView === 'settings' && (
          <SettingsView userEmail={userEmail} onOpenAuth={() => setShowAuthPage(true)} onNavigate={handleNavigate} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={handleNavigate}
        onOpenAddBlock={() => setIsBlockModalOpen(true)}
        onOpenAISchedule={openAISchedule}
        onOpenEndOfDay={() => setIsAICommandCenterOpen(true)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        userEmail={userEmail}
        onOpenAuth={() => setShowAuthPage(true)}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
      />

      {/* Global Quick Capture Modal (Triggerable from anywhere via 'Q' shortcut or capture buttons) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSaveAndConvert={(item) => {
          setIsQuickCaptureOpen(false);
          setConvertingCaptureItem(item);
        }}
      />

      {/* Global Convert Capture Item Modal */}
      <ConvertCaptureModal
        isOpen={!!convertingCaptureItem}
        item={convertingCaptureItem}
        onClose={() => setConvertingCaptureItem(null)}
        onConverted={() => setConvertingCaptureItem(null)}
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
      <EnhancedFocusMode
        isOpen={isFocusModeOpen}
        onClose={() => {
          setIsFocusModeOpen(false);
          setFocusTarget(null);
        }}
        initialTarget={focusTarget}
      />

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
          onApplyMigration={() => {
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

      {/* Signature 2D Stickman Loading & Welcome Journey */}
      {showIntro && <BlockFlowIntro onComplete={handleIntroComplete} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimetableProvider>
        <ExecutionProvider>
          <SessionProvider>
            <TimeBudgetProvider>
              <DemoProvider>
                <AppContent />
              </DemoProvider>
            </TimeBudgetProvider>
          </SessionProvider>
        </ExecutionProvider>
      </TimetableProvider>
    </ThemeProvider>
  );
}

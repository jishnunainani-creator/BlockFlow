import React, { useState } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { TaskInboxView } from '../ExecutionOS/TaskInboxView';
import { ThoughtSpaceView } from './ThoughtSpaceView';
import { MobileQuickCaptureView } from './MobileQuickCaptureView';
import {
  Inbox,
  Brain,
  Zap,
} from 'lucide-react';
import { getUnprocessedCount } from '../../utils/quickCaptureStorage';

export type InboxTab = 'tasks' | 'notes' | 'quick-capture';

interface InboxAndNotesViewProps {
  initialTab?: InboxTab;
  onNavigate: (view: NavView) => void;
  onStartFocusMode: (target?: any) => void;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}

export const InboxAndNotesView: React.FC<InboxAndNotesViewProps> = ({
  initialTab = 'tasks',
  onNavigate,
  onStartFocusMode,
  userEmail,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<InboxTab>(initialTab);
  const [unprocessedCount, setUnprocessedCount] = useState<number>(() => getUnprocessedCount());

  React.useEffect(() => {
    const handleCount = () => setUnprocessedCount(getUnprocessedCount());
    window.addEventListener('blockflow_quick_capture_changed', handleCount);
    window.addEventListener('storage', handleCount);
    return () => {
      window.removeEventListener('blockflow_quick_capture_changed', handleCount);
      window.removeEventListener('storage', handleCount);
    };
  }, []);

  const tabs: { id: InboxTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'tasks', label: 'Universal Task Inbox', icon: Inbox },
    { id: 'notes', label: 'Thought Space (Notes)', icon: Brain },
    { id: 'quick-capture', label: 'Quick Capture', icon: Zap, badge: unprocessedCount > 0 ? unprocessedCount : undefined },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Top Segmented Sub-Navigation Bar */}
      <div className="shrink-0 bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 backdrop-blur-md flex items-center justify-between gap-3 overflow-x-auto scrollbar-none z-10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          {activeTab === 'notes' ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>100% Local-Only Storage</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Capture &amp; Action Hub</span>
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'tasks' && (
          <TaskInboxView onNavigate={onNavigate} onStartFocusMode={onStartFocusMode} />
        )}
        {activeTab === 'notes' && <ThoughtSpaceView onNavigate={onNavigate} />}
        {activeTab === 'quick-capture' && (
          <MobileQuickCaptureView
            onNavigate={onNavigate}
            userEmail={userEmail}
            onOpenAuth={onOpenAuth}
          />
        )}
      </div>
    </div>
  );
};

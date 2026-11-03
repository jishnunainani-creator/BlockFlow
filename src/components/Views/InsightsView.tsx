import React, { useState } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { DashboardView } from './DashboardView';
import { AnalyticsView } from './AnalyticsView';
import { ExecutionDashboardView } from './ExecutionDashboardView';
import { AICoachView } from './AICoachView';
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  Sparkles,
} from 'lucide-react';

export type InsightsTab = 'dashboard' | 'analytics' | 'execution' | 'coach';

interface InsightsViewProps {
  initialTab?: InsightsTab;
  onNavigate: (view: NavView) => void;
  userEmail?: string | null;
  onStartFocusMode: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  initialTab = 'dashboard',
  onNavigate,
  userEmail,
  onStartFocusMode,
}) => {
  const [activeTab, setActiveTab] = useState<InsightsTab>(initialTab);

  const tabs: { id: InsightsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics & Reflection', icon: BarChart3 },
    { id: 'execution', label: 'Execution Intelligence', icon: Brain },
    { id: 'coach', label: 'Smart Insights Coach', icon: Sparkles },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 select-none">
      {/* Top Insights Navigation Bar */}
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
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>One Source of Truth</span>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={onNavigate}
            userEmail={userEmail}
            onStartFocusMode={onStartFocusMode}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsView onNavigate={onNavigate} />}
        {activeTab === 'execution' && <ExecutionDashboardView onNavigate={onNavigate} />}
        {activeTab === 'coach' && <AICoachView onNavigate={onNavigate} />}
      </div>
    </div>
  );
};

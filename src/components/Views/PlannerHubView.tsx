import React, { useState } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { AdaptivePlannerView } from './AdaptivePlannerView';
import { PlannersDashboardView } from './PlannersDashboardView';
import AssignmentsView from './AssignmentsView';
import {
  Sliders,
  Layers,
  CheckSquare,
} from 'lucide-react';

export type PlannerTab = 'optimizer' | 'custom-planners' | 'assignments';

interface PlannerHubViewProps {
  initialTab?: PlannerTab;
  onNavigate?: (view: NavView) => void;
}

export const PlannerHubView: React.FC<PlannerHubViewProps> = ({
  initialTab = 'optimizer',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<PlannerTab>(initialTab);

  const tabs: { id: PlannerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'optimizer', label: 'Adaptive Optimizer', icon: Sliders },
    { id: 'custom-planners', label: 'Custom Planners & Exams', icon: Layers },
    { id: 'assignments', label: 'Assignments Tracker', icon: CheckSquare },
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
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span>Strategic Planning Suite</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'optimizer' && <AdaptivePlannerView onNavigate={onNavigate} />}
        {activeTab === 'custom-planners' && <PlannersDashboardView />}
        {activeTab === 'assignments' && <AssignmentsView onNavigate={onNavigate} />}
      </div>
    </div>
  );
};

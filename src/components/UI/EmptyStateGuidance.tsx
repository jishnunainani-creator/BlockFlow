import React from 'react';
import { useDemo } from '../../context/DemoContext';
import { Plus, Bot, Upload, Rocket, Play, CalendarX } from 'lucide-react';

interface EmptyStateGuidanceProps {
  onOpenAddBlock?: () => void;
  onOpenAISchedule?: (tab: 'voice' | 'text' | 'import') => void;
}

export const EmptyStateGuidance: React.FC<EmptyStateGuidanceProps> = ({ onOpenAddBlock, onOpenAISchedule }) => {
  const { loadDemoProfile, startTour } = useDemo();

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6 max-w-xl mx-auto my-6 animate-fade-in shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-[#3659C9]/15 border border-[#3659C9]/30 text-[#3659C9] mx-auto flex items-center justify-center">
        <CalendarX className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-white">Your schedule is open</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Start by scheduling your first focus activity or import existing coursework to see your daily flow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
        {onOpenAddBlock && (
          <button
            onClick={onOpenAddBlock}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-[#3659C9] text-white shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Create Activity</p>
              <p className="text-[11px] text-slate-400">Add a time block manually</p>
            </div>
          </button>
        )}

        {onOpenAISchedule && (
          <button
            onClick={() => onOpenAISchedule('voice')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
              <Bot className="w-4 h-4 text-[#3659C9]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Schedule with AI</p>
              <p className="text-[11px] text-slate-400">Generate from syllabus or text</p>
            </div>
          </button>
        )}

        {onOpenAISchedule && (
          <button
            onClick={() => onOpenAISchedule('import')}
            className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Import Timetable</p>
              <p className="text-[11px] text-slate-400">Upload JSON or calendar</p>
            </div>
          </button>
        )}

        <button
          onClick={() => loadDemoProfile('college_student')}
          className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-white flex items-center gap-3 transition-colors group"
        >
          <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
            <Rocket className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Load Demo Workspace</p>
            <p className="text-[11px] text-slate-400">Explore sample timetable</p>
          </div>
        </button>
      </div>

      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={startTour}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#3659C9] hover:text-[#4F73E3] transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Take the 2-Minute Product Tour</span>
        </button>
      </div>
    </div>
  );
};

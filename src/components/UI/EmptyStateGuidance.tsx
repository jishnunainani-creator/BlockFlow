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
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-6 max-w-xl mx-auto my-6 animate-fade-in shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
        <CalendarX className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-white">Your workspace is empty</h3>
        <p className="text-xs text-slate-400">Choose how you'd like to begin planning your productivity system.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
        {onOpenAddBlock && (
          <button
            onClick={onOpenAddBlock}
            className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-indigo-600 text-white group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Create Activity</p>
              <p className="text-[10px] text-slate-500">Build manual block</p>
            </div>
          </button>
        )}

        {onOpenAISchedule && (
          <button
            onClick={() => onOpenAISchedule('voice')}
            className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-purple-600 text-white group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Schedule with AI</p>
              <p className="text-[10px] text-purple-300">Voice or text AI prompt</p>
            </div>
          </button>
        )}

        {onOpenAISchedule && (
          <button
            onClick={() => onOpenAISchedule('import')}
            className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white flex items-center gap-3 transition-colors group"
          >
            <div className="p-2 rounded-xl bg-emerald-600 text-white group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Import Timetable</p>
              <p className="text-[10px] text-emerald-300">Upload JSON or syllabus</p>
            </div>
          </button>
        )}

        <button
          onClick={() => loadDemoProfile('college_student')}
          className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white flex items-center gap-3 transition-colors group"
        >
          <div className="p-2 rounded-xl bg-amber-600 text-white group-hover:scale-105 transition-transform">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">Load Demo Workspace</p>
            <p className="text-[10px] text-amber-300">Explore sample content</p>
          </div>
        </button>
      </div>

      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={startTour}
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Take the 2-Minute Product Tour</span>
        </button>
      </div>
    </div>
  );
};

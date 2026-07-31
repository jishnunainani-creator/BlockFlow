import React from 'react';
import { Sparkles, TrendingUp, Target, Award, ArrowRight, X } from 'lucide-react';

interface WeeklyAIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyAIReviewModal({ isOpen, onClose }: WeeklyAIReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>
        
        <div className="p-8 relative">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Sparkles size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Sunday Review</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Your Weekly Mentor Report</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Great work this week! You maintained strong focus during your deep work sessions, particularly on Tuesday and Thursday mornings. However, I noticed some burnout creeping in on Friday. Let's look at the numbers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <TrendingUp size={18} />
                  <span className="font-medium">Productivity</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">+12%</div>
                <div className="text-sm text-slate-500">vs last week</div>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Target size={18} />
                  <span className="font-medium">Focus Time</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">28h</div>
                <div className="text-sm text-slate-500">Total deep work</div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Award size={18} />
                  <span className="font-medium">Completion</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">85%</div>
                <div className="text-sm text-slate-500">Tasks finished</div>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">AI Recommendations for Next Week</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                  <p><strong>Shift coding blocks earlier:</strong> You're 40% more productive on coding tasks before 1 PM.</p>
                </li>
                <li className="flex gap-3 text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                  <p><strong>Add buffer times:</strong> You consistently underestimated assignment durations by 20% this week. I'll automatically suggest buffers next week.</p>
                </li>
                <li className="flex gap-3 text-slate-300">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></div>
                  <p><strong>Protect your Friday afternoons:</strong> Try to schedule only light reading or admin tasks after 3 PM on Fridays.</p>
                </li>
              </ul>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-colors text-lg"
            >
              Prepare Next Week's Schedule
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Trophy, Star, Zap, Code, BookOpen, Medal } from 'lucide-react';

export default function ProfessionalAchievementTimeline() {
  const achievements = [
    { id: 1, title: '100 Hours Deep Work', date: 'Oct 15, 2026', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
    { id: 2, title: '30-Day Study Streak', date: 'Oct 12, 2026', icon: Star, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { id: 3, title: 'First Full Stack Project', date: 'Sep 28, 2026', icon: Code, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { id: 4, title: 'A+ in Data Structures', date: 'May 15, 2026', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Trophy className="text-indigo-400" size={20} />
            Professional Timeline
          </h2>
          <p className="text-slate-400 text-sm">Your journey and milestones</p>
        </div>
      </div>

      <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
        {achievements.map((ach) => {
          const Icon = ach.icon;
          return (
            <div key={ach.id} className="relative">
              <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full ${ach.bg} ${ach.border} border-2 flex items-center justify-center`}>
                <Icon size={14} className={ach.color} />
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-200">{ach.title}</h3>
                  <span className="text-xs font-medium text-slate-500">{ach.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Medal size={14} className="text-indigo-400" />
                  <span className="text-xs text-indigo-400/80 font-medium">Verified Milestone</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

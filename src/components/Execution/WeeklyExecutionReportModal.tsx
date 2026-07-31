import React, { useEffect, useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { WeeklyExecutionReport } from '../../types/execution';
import { X, Calendar, BarChart2, Lightbulb } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  weekId: string;
}

export const WeeklyExecutionReportModal: React.FC<Props> = ({ isOpen, onClose, weekId }) => {
  const { generateWeeklyReport } = useExecution();
  const [report, setReport] = useState<WeeklyExecutionReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReport(generateWeeklyReport(weekId));
    }
  }, [isOpen, weekId, generateWeeklyReport]);

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Calendar className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Weekly Execution Report</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white mb-2">{Math.round(report.weeklyScore)}%</span>
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Weekly Score</span>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase mb-4">Time Efficiency</span>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-slate-300">Planned</span>
                <span className="text-lg font-bold text-white">{Math.round(report.totalPlannedHours)}h</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full mb-4">
                <div className="h-full bg-slate-500 rounded-full w-full" />
              </div>
              
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-slate-300">Completed</span>
                <span className="text-lg font-bold text-emerald-400">{Math.round(report.totalCompletedHours)}h</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (report.totalCompletedHours / (report.totalPlannedHours || 1)) * 100)}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
               <span className="text-xs font-bold text-slate-400 uppercase mb-4">Highlights</span>
               <div className="space-y-3">
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Most Productive Day</div>
                   <div className="text-sm text-white font-medium">{report.mostProductiveDay || 'N/A'}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Needs Attention</div>
                   <div className="text-sm text-white font-medium">{report.leastProductiveDay || 'N/A'}</div>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
             <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
               <BarChart2 size={16} className="text-indigo-400" />
               Daily Performance
             </h3>
             <div className="flex items-end justify-between h-32 gap-2 mt-8">
               {report.dailyScores.map((ds, i) => (
                 <div key={i} className="flex flex-col items-center flex-1 gap-2">
                   <div className="w-full bg-slate-800 rounded-t-sm relative h-full flex items-end">
                     <div 
                       className={`w-full rounded-t-sm transition-all duration-500 ${ds.score >= 80 ? 'bg-emerald-500' : ds.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} 
                       style={{ height: `${ds.score}%` }} 
                     />
                   </div>
                   <span className="text-[10px] font-bold text-slate-500">{ds.date.split('-')[2]}</span>
                 </div>
               ))}
               {report.dailyScores.length === 0 && (
                 <p className="text-xs text-slate-500 w-full text-center py-4">No daily score entries yet for this week</p>
               )}
             </div>
          </div>
          
          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-800 space-y-3">
             <h3 className="text-sm font-bold text-white flex items-center gap-2">
               <Lightbulb className="text-amber-400" size={16} /> AI Recommendations
             </h3>
             {report.aiRecommendations && report.aiRecommendations.length > 0 ? (
               <ul className="space-y-2">
                 {report.aiRecommendations.map((rec, i) => (
                   <li key={i} className="text-sm text-slate-300 leading-relaxed flex items-start gap-2">
                     <span className="text-indigo-400 mt-0.5">•</span>
                     <span>{rec}</span>
                   </li>
                 ))}
               </ul>
             ) : (
               <p className="text-sm text-slate-400 leading-relaxed">
                 You maintained solid consistency this week. Keep up your routine and log daily reflections for deeper insights.
               </p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

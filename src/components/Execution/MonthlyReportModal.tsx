import React, { useEffect, useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { MonthlyPerformanceReport } from '../../types/execution';
import { X, Award, Target, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  month: string;
}

export const MonthlyReportModal: React.FC<Props> = ({ isOpen, onClose, month }) => {
  const { generateMonthlyReport } = useExecution();
  const [report, setReport] = useState<MonthlyPerformanceReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReport(generateMonthlyReport(month));
    }
  }, [isOpen, month, generateMonthlyReport]);

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Award className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Monthly Overview: {month}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg Score</div>
              <div className="text-2xl font-black text-white">{Math.round(report.avgDailyScore)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Hours</div>
              <div className="text-2xl font-black text-emerald-400">{Math.round(report.totalHoursWorked)}h</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Goal Completion</div>
              <div className="text-2xl font-black text-indigo-400">{Math.round(report.goalCompletionPct)}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trend</div>
              <div className="flex justify-center items-center h-8 gap-1">
                <Activity className={`w-5 h-5 ${
                  report.productivityTrend === 'improving' ? 'text-emerald-400' :
                  report.productivityTrend === 'stable' ? 'text-amber-400' : 'text-red-400'
                }`} />
                <span className="text-xs font-bold capitalize text-slate-200">{report.productivityTrend}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-950/30 to-purple-950/30 rounded-2xl p-6 border border-indigo-500/20">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Target size={16} className="text-indigo-400" /> AI Executive Review
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              {report.aiMonthlyReview || "Excellent consistency this month. You've hit your primary targets regularly, with notable improvements in deep work blocks."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
               <h3 className="text-sm font-bold text-slate-300 mb-4">Category Breakdown</h3>
               <div className="space-y-4">
                 {Object.entries(report.hoursByCategory || {}).slice(0, 4).map(([cat, hours]) => (
                   <div key={cat}>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="text-slate-400 capitalize">{cat}</span>
                       <span className="text-white font-bold">{Math.round(hours)}h</span>
                     </div>
                     <div className="w-full bg-slate-800 rounded-full h-1.5">
                       <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (hours / (report.totalHoursWorked || 1)) * 100)}%` }} />
                     </div>
                   </div>
                 ))}
                 {Object.keys(report.hoursByCategory || {}).length === 0 && (
                   <p className="text-xs text-slate-500 py-2">No category hours logged yet</p>
                 )}
               </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
               <h3 className="text-sm font-bold text-slate-300 mb-4">Habit Consistency</h3>
               <div className="flex items-center gap-3 mb-4">
                 <div className="text-3xl font-black text-emerald-400">{Math.round(report.habitConsistency)}%</div>
                 <span className="text-xs text-slate-400">Consistency rating over 30 days</span>
               </div>
               <div className="grid grid-cols-7 gap-1">
                 {Array.from({length: 28}).map((_, i) => (
                   <div key={i} className={`aspect-square rounded-sm ${i < (report.reflectionCount || 0) ? 'bg-emerald-500/80' : 'bg-slate-800'}`} />
                 ))}
               </div>
               <div className="mt-4 flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                 <span>Reflections logged: {report.reflectionCount || 0}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

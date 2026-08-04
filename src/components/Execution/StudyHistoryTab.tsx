import React from 'react';
import { useSession } from '../../context/SessionContext';
import { BookOpen, GraduationCap, Clock, CheckCircle2, ChevronRight, Tag, HelpCircle } from 'lucide-react';

export const StudyHistoryTab: React.FC = () => {
  const { getStudyHistory } = useSession();
  const summary = getStudyHistory();

  if (!summary.hasData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 animate-fade-in">
        <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
        <h4 className="text-base font-semibold text-slate-300">No Study Sessions Logged Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Complete a study activity (Self Study, Reading, DSA, Assignment, etc.) and log what you worked on to build your topic-level learning history.
        </p>
      </div>
    );
  }

  const subjects = Object.keys(summary.subjectBreakdown);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Actual Study</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{summary.totalActualHours}h</p>
          <p className="text-[11px] text-slate-400">Total logged study time across sessions.</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Study</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{summary.totalScheduledHours}h</p>
          <p className="text-[11px] text-slate-400">Total study time scheduled in timetable.</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Adherence</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400">{summary.planAdherencePct}%</p>
          <p className="text-[11px] text-slate-400">Study sessions completed as planned.</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Logged Sessions</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">{summary.totalSessionsCount}</p>
          <p className="text-[11px] text-slate-400">Individual study sessions recorded.</p>
        </div>
      </div>

      {/* Topic-Level Learning History Tree */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Topic-Level Learning History
        </h4>

        <div className="space-y-4">
          {subjects.map((sub) => {
            const data = summary.subjectBreakdown[sub];
            const hours = (data.totalMinutes / 60).toFixed(1);

            return (
              <div key={sub} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                {/* Subject Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                      📚
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white">{sub}</h5>
                      <p className="text-[11px] text-slate-400">{data.topics.length} topics logged</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl">
                    {hours}h
                  </span>
                </div>

                {/* Topics Tree */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {data.topics.map((topicItem, idx) => {
                    const topHours = (topicItem.totalMinutes / 60).toFixed(1);

                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                            {topicItem.topic}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {topHours}h ({topicItem.sessionsCount} {topicItem.sessionsCount === 1 ? 'session' : 'sessions'})
                          </span>
                        </div>

                        {topicItem.subtopics.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <Tag className="w-3 h-3 text-slate-500" />
                            {topicItem.subtopics.map((st, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md font-medium"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

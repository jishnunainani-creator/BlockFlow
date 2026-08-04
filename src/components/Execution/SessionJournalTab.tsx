import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';
import { ExecutionSession } from '../../types/sessionLog';
import { COMPLETION_STATUS_CONFIG } from '../../types/timetable';
import { formatMinutesToTimeString } from '../../utils/timeUtils';
import { BookOpen, Search, Filter, Calendar, Star, Tag, ArrowRight, Info } from 'lucide-react';

export const SessionJournalTab: React.FC = () => {
  const { sessions } = useSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedDate && s.date !== selectedDate) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = s.plannedTitle.toLowerCase().includes(query) || s.actualTitle.toLowerCase().includes(query);
        const matchTopic = s.topic?.toLowerCase().includes(query);
        const matchNotes = s.notes?.toLowerCase().includes(query);
        const matchSubtopics = s.subtopics?.some((st) => st.toLowerCase().includes(query));
        return matchTitle || matchTopic || matchNotes || matchSubtopics;
      }
      return true;
    });
  }, [sessions, searchQuery, selectedStatus, selectedDate]);

  // Group by Date descending
  const groupedSessions = useMemo(() => {
    const map = new Map<string, ExecutionSession[]>();
    filteredSessions.forEach((s) => {
      const list = map.get(s.date) || [];
      list.push(s);
      map.set(s.date, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notice Banner distinguishing Session Journal from Daily Reflection */}
      <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-200">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">SESSION JOURNAL vs DAILY REFLECTION:</span> This journal tracks your individual activity execution records (what was planned vs what actually happened). Daily Reflection tracks your overall daily score and end-of-day journal.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by activity, topic (e.g. Graphs, BFS), or notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Date Picker Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Clear Date
            </button>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="partially_completed">Partially Completed</option>
            <option value="replaced">Replaced</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Journal Feed */}
      {groupedSessions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-semibold text-slate-300">No Session Logs Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Complete a scheduled activity or log what you actually worked on to build your execution journal.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSessions.map(([dateStr, dateSessions]) => (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>{new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium ml-1">
                  {dateSessions.length} {dateSessions.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {dateSessions.map((session) => {
                  const statusConfig = COMPLETION_STATUS_CONFIG[session.status as keyof typeof COMPLETION_STATUS_CONFIG] || COMPLETION_STATUS_CONFIG.completed;

                  return (
                    <div
                      key={session.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 space-y-3 transition-all shadow-sm"
                    >
                      {/* Top Row: Status & Time */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${statusConfig.bgClass}`}>
                            <span>{statusConfig.badge}</span>
                            <span>{statusConfig.label}</span>
                          </span>
                          {session.deviationReason && (
                            <span className="text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded-md font-medium">
                              Reason: {session.deviationReason}
                            </span>
                          )}
                        </div>

                        {session.focusRating && (
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{session.focusRating}/5</span>
                          </div>
                        )}
                      </div>

                      {/* Planned vs Actual Title */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-0.5">
                            Planned Activity
                          </span>
                          <p className="font-semibold text-slate-200">{session.plannedTitle}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatMinutesToTimeString(session.plannedStartMinutes)} – {formatMinutesToTimeString(session.plannedStartMinutes + session.plannedDuration)}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-0.5">
                            Actually Logged
                          </span>
                          <p className="font-semibold text-blue-300">{session.actualTitle}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatMinutesToTimeString(session.actualStartMinutes)} – {formatMinutesToTimeString(session.actualStartMinutes + session.actualDuration)}
                          </p>
                        </div>
                      </div>

                      {/* Topic & Subtopics */}
                      {(session.topic || (session.subtopics && session.subtopics.length > 0)) && (
                        <div className="space-y-1.5 pt-1">
                          {session.topic && (
                            <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                              <span>Topic: <strong className="text-white">{session.topic}</strong></span>
                            </p>
                          )}
                          {session.subtopics && session.subtopics.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Tag className="w-3 h-3 text-slate-500" />
                              {session.subtopics.map((st, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Session Notes */}
                      {session.notes && (
                        <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                          "{session.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

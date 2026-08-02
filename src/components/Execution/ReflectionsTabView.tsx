import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { MoodTracker } from './MoodTracker';
import { MoodGraph } from './MoodGraph';
import { DailyReflectionModal } from './DailyReflectionModal';
import { EndOfDayFlowModal } from './EndOfDayFlowModal';
import { loadDistractionLogs } from '../../utils/assignmentStorage';
import {
  FileText,
  Moon,
  Heart,
  Lightbulb,
  Zap,
  AlertCircle,
  Sparkles,
  BookOpen,
  Calendar,
} from 'lucide-react';

export default function ReflectionsTabView() {
  const { todayMood, moods, todayReflection, reflections, reflectionInsights, saveMood } = useExecution();

  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);

  const distractionLogs = loadDistractionLogs();

  return (
    <div className="space-y-6 text-slate-200 select-none">
      {/* ── TOP REFLECTION ACTIONS BAR ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Daily Reflection &amp; Evening Ritual
              {todayReflection && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Today Logged ✓
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Self-awareness journal, mood tracking, energy level mapping &amp; distraction analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReflectionModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <FileText size={16} className="text-purple-400" />
            <span>Write Reflection</span>
          </button>

          <button
            onClick={() => setShowEndOfDayModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Moon size={16} />
            <span>End My Day</span>
          </button>
        </div>
      </div>

      {/* ── MOOD TRACKER & MOOD TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Mood Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-400" />
              Today's Mood Entry
            </span>
            {todayMood && <span className="text-xs font-bold text-emerald-400">Recorded ✓</span>}
          </div>

          {!todayMood ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Select your current emotional state for AI pattern correlation:</p>
              <MoodTracker onSelectMood={saveMood} />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Logged Mood: <strong className="text-white capitalize">{todayMood.mood}</strong></p>
              <MoodGraph moods={moods} days={7} />
            </div>
          )}
        </div>

        {/* AI Reflection Insights */}
        <div className="bg-gradient-to-br from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/20 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Reflection Analysis &amp; Themes
          </span>

          {reflectionInsights.length > 0 ? (
            <ul className="space-y-2.5">
              {reflectionInsights.map((insight, i) => (
                <li key={i} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic py-4">
              Write daily reflections to allow BlockFlow AI to detect your recurring energy themes and productivity drivers.
            </p>
          )}
        </div>
      </div>

      {/* ── TODAY'S REFLECTION DETAILS & DISTRACTION PATTERNS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Reflection Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Latest Journal Entry
            </span>
            <span className="text-xs text-slate-500">{todayReflection?.date || 'No entry today'}</span>
          </div>

          {todayReflection ? (
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">What Went Well</span>
                <p className="text-slate-200">{todayReflection.whatWentWell || 'N/A'}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tomorrow's Improvement</span>
                <p className="text-slate-200">{todayReflection.improveTomorrow || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <p className="text-xs text-slate-400">You haven't written today's reflection yet.</p>
              <button
                onClick={() => setShowReflectionModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Log Today's Reflection
              </button>
            </div>
          )}
        </div>

        {/* Distraction Trigger Log */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Focus Distraction Logs
            </span>
            <span className="text-xs text-slate-500">{distractionLogs.length} triggers logged</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {distractionLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">{log.taskTitle}</p>
                  <p className="text-[10px] text-slate-500">Reason: <strong className="text-amber-300 capitalize">{log.reason}</strong> • {log.sessionMinutes}m elapsed</p>
                </div>
                <span className="text-[10px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}

            {distractionLogs.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">
                No focus interruptions recorded. Deep work sessions running clean!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DailyReflectionModal
        isOpen={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
      />
      <EndOfDayFlowModal
        isOpen={showEndOfDayModal}
        onClose={() => setShowEndOfDayModal(false)}
      />
    </div>
  );
}

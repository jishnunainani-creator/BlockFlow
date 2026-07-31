import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { minutesToTimeStr } from '../../utils/timeUtils';
import { playReminderChime } from '../../utils/notificationUtils';
import {
  Bell,
  BellRing,
  Clock,
  Volume2,
  CheckCircle2,
  AlertCircle,
  VolumeX,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const {
    currentWeekScheduledBlocks,
    updateScheduledBlock,
    enableNotifications,
    notificationsEnabled,
    addToast,
  } = useTimetable();

  const blocksWithReminders = currentWeekScheduledBlocks.filter(
    (b) => b.reminderMinutes && b.reminderMinutes > 0
  );

  const handleTestChime = () => {
    playReminderChime();
    addToast('7-Second Audio Chime Played 🔔', 'info');
  };

  const handleClearReminder = (id: string) => {
    updateScheduledBlock(id, { reminderMinutes: 0 });
    addToast('Reminder cleared', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Reminders & Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage active block alerts, browser notification permissions, and reminder chimes ({blocksWithReminders.length} active alerts)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Test Audio Chime</span>
          </button>
          <button
            onClick={enableNotifications}
            className={`px-4 py-2 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all ${
              notificationsEnabled
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>{notificationsEnabled ? 'Notifications Active ✓' : 'Enable Browser Alerts'}</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
        notificationsEnabled
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      }`}>
        <div className="flex items-center gap-2.5">
          {notificationsEnabled ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          <div>
            <span className="font-bold block text-sm">
              {notificationsEnabled ? 'Browser Desktop Notifications Enabled' : 'Browser Notifications Not Enabled Yet'}
            </span>
            <span className="text-slate-400">
              {notificationsEnabled ? 'You will receive popups and audio chimes before activities start.' : 'Click "Enable Browser Alerts" to allow push popups.'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Scheduled Reminders List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Active Activity Reminders ({blocksWithReminders.length})
        </h3>

        {blocksWithReminders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-6">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No active reminders configured</p>
            <p className="text-xs text-slate-500 mt-1">Set reminders on individual block cards in the Calendar view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {blocksWithReminders.map((b) => (
              <div
                key={b.id}
                style={{ borderLeftColor: b.color }}
                className="p-4 rounded-2xl bg-slate-900 border-l-[4px] border-y border-r border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{b.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Starts at {minutesToTimeStr(b.startMinutes)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                    Alert {b.reminderMinutes} minutes before
                  </span>
                </div>

                <button
                  onClick={() => handleClearReminder(b.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  title="Remove reminder"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

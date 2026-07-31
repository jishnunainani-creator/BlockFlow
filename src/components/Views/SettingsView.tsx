import React from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { useTheme } from '../../context/ThemeContext';
import { useDemo } from '../../context/DemoContext';
import { DEMO_PROFILES } from '../../types/demo';
import { signOut, isSupabaseConfigured } from '../../lib/supabase';
import { ResolutionSelector } from '../Timetable/ResolutionSelector';
import {
  Settings,
  User,
  Moon,
  Sun,
  Monitor,
  Clock,
  Shield,
  LogOut,
  Download,
  Trash2,
  HardDrive,
  Cloud,
  CheckCircle2,
  HelpCircle,
  Play,
  Rocket,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  userEmail?: string | null;
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userEmail, onOpenAuth }) => {
  const { resolution, setResolution, exportJSONBackup, clearCurrentWeek, addToast } = useTimetable();
  const { theme, setTheme } = useTheme();
  const { isDemoMode, activeProfile, loadDemoProfile, clearDemoData, startTour } = useDemo();

  const handleSignOut = async () => {
    await signOut();
    addToast('Signed out of account', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-8 select-none scrollbar-thin max-w-4xl">
      {/* Header Bar */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Customize profile details, enterprise theme, grid intervals, and cloud account sync
        </p>
      </div>

      {/* ── 1. USER PROFILE SECTION ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <User className="w-4 h-4 text-indigo-400" />
          <span>User Profile</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {userEmail ? userEmail[0].toUpperCase() : 'J'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{userEmail ? userEmail.split('@')[0] : 'Jishnu (Local User)'}</h4>
              <p className="text-xs text-slate-400">{userEmail || 'Offline Local Storage Mode'}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {userEmail ? 'Authenticated Account' : 'Guest Account'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs rounded-xl transition-colors shrink-0"
          >
            {userEmail ? 'Switch / Manage Account' : 'Sign In to Sync Cloud'}
          </button>
        </div>
      </div>

      {/* ── 2. APPEARANCE & THEME SECTION ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Appearance & Enterprise Theme</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
              theme === 'dark'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-xs font-bold">Enterprise Dark Mode</p>
              <p className="text-[10px] text-slate-500">Slate-950 quiet aesthetic</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
              theme === 'light'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs font-bold">Clean Light Mode</p>
              <p className="text-[10px] text-slate-500">Minimal high contrast</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
              theme === 'system'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5 text-sky-400" />
            <div>
              <p className="text-xs font-bold">System Theme</p>
              <p className="text-[10px] text-slate-500">Follow OS settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── 3. CALENDAR PREFERENCES SECTION ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Calendar Preferences</span>
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-bold text-white">Grid Resolution / Time Interval</p>
              <p className="text-slate-400 text-[11px]">Choose snapping step size for block scheduling</p>
            </div>
            <ResolutionSelector />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-bold text-white">Working Hours</p>
              <p className="text-slate-400 text-[11px]">06:00 AM – 11:00 PM (17-hour standard view)</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono font-semibold">
              06:00 - 23:00
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-bold text-white">Week Start Day</p>
              <p className="text-slate-400 text-[11px]">Standard business calendar start</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">
              Monday
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. ACCOUNT & DATA BACKUP ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Account Data & Cloud Backup</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportJSONBackup}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Cloud Backup (JSON)</span>
          </button>

          <button
            onClick={clearCurrentWeek}
            className="px-4 py-2.5 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Clear Current Week</span>
          </button>

          {userEmail && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors ml-auto"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out Account</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 5. HELP & SUPPORT (Feature 74) ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Help &amp; Support</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              Interactive Product Tour
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Re-launch the step-by-step interactive onboarding tour to explore all major BlockFlow features.
            </p>
          </div>

          <button
            onClick={startTour}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0"
          >
            Start Product Tour
          </button>
        </div>
      </div>

      {/* ── 6. DEMO WORKSPACE SCENARIOS (Features 72 & 77) ── */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>Demo Workspace Profiles</span>
          </h3>

          {isDemoMode && (
            <button
              onClick={clearDemoData}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={12} /> Exit Demo &amp; Restore My Data
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Instantly populate BlockFlow with realistic schedules, goals, reflections, and AI insights across different lifestyles. Your personal data is automatically backed up.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {DEMO_PROFILES.map((profile) => {
            const isActive = isDemoMode && activeProfile === profile.id;
            return (
              <div
                key={profile.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white flex items-center gap-2">
                      <span>{profile.icon}</span>
                      <span>{profile.title}</span>
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold mb-2">{profile.subtitle}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile.description}</p>
                </div>

                <button
                  onClick={() => loadDemoProfile(profile.id)}
                  disabled={isActive}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  <Sparkles size={12} />
                  <span>{isActive ? 'Current Active Workspace' : 'Load Demo Workspace'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

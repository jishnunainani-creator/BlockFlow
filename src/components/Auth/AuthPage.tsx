import React, { useState } from 'react';
import { isSupabaseConfigured, signInWithEmail, signUpWithEmail, signInWithOAuth } from '../../lib/supabase';
import { BlockFlowLogo } from '../Brand/BlockFlowLogo';
import {
  Mail,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Calendar,
  BarChart3,
  Cloud,
  ArrowRight,
  HardDrive,
  Check,
} from 'lucide-react';

interface AuthPageProps {
  onContinueAsGuest: () => void;
  onSuccess: (email?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onContinueAsGuest, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase URL & Anon Key missing. Continuing in local storage mode.');
      setTimeout(() => onSuccess('Guest User'), 800);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setSuccessMsg('Account created! Please check your inbox to confirm verification.');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        setSuccessMsg('Successfully authenticated!');
        setTimeout(() => onSuccess(email), 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github') => {
    setErrorMsg(null);
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase OAuth not configured. Continuing in local storage mode.');
      setTimeout(() => onSuccess('Guest User'), 800);
      return;
    }

    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to sign in with ${provider}.`);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden select-none">
      {/* ── LEFT SIDE (40%): Brand Presentation & Features Graphic ── */}
      <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-8 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Background glow circle */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div>
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 mb-8">
            <BlockFlowLogo size="md" />
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">BlockFlow</h1>
              <span className="text-xs text-indigo-400 font-semibold">SaaS Productivity Platform</span>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Plan visually. <br />
              Execute consistently. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                Improve intelligently.
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Transform your daily workflow with an enterprise timetable manager designed after Notion, Linear, Microsoft Teams, and Motion.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3.5 my-8">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Visual 5-Day Calendar Grid</h4>
              <p className="text-[11px] text-slate-400">Drag & drop scheduling, conflict detection, and sticky hour dividers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">AI Productivity Intelligence</h4>
              <p className="text-[11px] text-slate-400">Habit detection, adherence metrics, and automated smart scheduling.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Supabase Cloud Sync & Local Storage</h4>
              <p className="text-[11px] text-slate-400">Seamless real-time DB sync with zero-latency local fallback.</p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} BlockFlow Inc. · Enterprise Productivity Platform
        </div>
      </div>

      {/* ── RIGHT SIDE (60%): Dedicated Authentication Form Card ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {mode === 'signin' ? 'Welcome Back to BlockFlow' : 'Create Your Account'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {mode === 'signin' ? 'Sign in to access your cloud schedules & analytics' : 'Start organizing your schedule with AI intelligence'}
            </p>
          </div>

          {/* Offline Notice if Supabase Env Missing */}
          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-200 mb-0.5">Local Offline Mode Available</span>
                Supabase credentials not detected. You can sign in locally or use Instant Guest Mode.
              </div>
            </div>
          )}

          {/* Error / Success Banners */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
            </button>
          </form>

          {/* Social Auth */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <p className="text-[11px] text-center text-slate-500 font-medium">Or authenticate with</p>
            <div>
              <button
                onClick={() => handleOAuth('github')}
                type="button"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>🐙</span> Continue with GitHub
              </button>
            </div>
          </div>

          {/* Continue as Guest Button */}
          <div className="pt-2 text-center">
            <button
              onClick={onContinueAsGuest}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
            >
              <span>Continue in Offline Local Mode</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="text-center text-xs text-slate-400 pt-2">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Sign up now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  Cloud,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthPageProps {
  onContinueAsGuest: () => void;
  onSuccess: (email?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onContinueAsGuest, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-screen flex flex-col md:flex-row overflow-y-auto md:overflow-hidden select-none bg-white">
      {/* ── LEFT SIDE (40%): Brand Promotional Panel (Protected Dark Branded Identity) ── */}
      <div className="auth-brand-panel md:w-5/12 border-b md:border-b-0 md:border-r border-slate-800 p-6 sm:p-8 md:p-10 flex flex-col justify-between relative shrink-0 overflow-y-auto">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <BlockFlowLogo size="md" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">BlockFlow</h1>
              <span className="auth-subtitle text-xs font-medium tracking-wide block">
                SaaS Productivity Platform
              </span>
            </div>
          </div>

          {/* Main Headline & Description */}
          <div className="space-y-3.5 max-w-md my-4 sm:my-6 md:my-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Plan visually. <br />
              Execute consistently. <br />
              <span className="auth-accent-headline">
                Improve intelligently.
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Transform your daily workflow with an enterprise timetable manager designed after Notion, Linear, Microsoft Teams, and Motion.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3 my-6 md:my-8 relative z-10">
          <div className="auth-feature-card flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="p-2 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-500/30 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Visual 5-Day Calendar Grid</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                Drag & drop scheduling, conflict detection, and sticky hour dividers.
              </p>
            </div>
          </div>

          <div className="auth-feature-card flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="p-2 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">AI Productivity Intelligence</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                Habit detection, adherence metrics, and automated smart scheduling.
              </p>
            </div>
          </div>

          <div className="auth-feature-card flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Supabase Cloud Sync & Local Storage</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                Seamless real-time DB sync with zero-latency local fallback.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Meta / Copyright */}
        <div className="auth-copyright text-xs font-normal pt-2 relative z-10">
          © {new Date().getFullYear()} BlockFlow Inc. · Enterprise Productivity Platform
        </div>
      </div>

      {/* ── RIGHT SIDE (60%): Clean, Light Authentication Surface ── */}
      <div className="auth-form-surface flex-1 flex flex-col justify-center items-center p-6 sm:p-8 md:p-12 relative overflow-y-auto bg-white">
        <div className="w-full max-w-md space-y-6 my-auto">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h3 className="text-2xl font-bold tracking-tight">
              {mode === 'signin' ? 'Welcome Back to BlockFlow' : 'Create Your Account'}
            </h3>
            <p className="auth-form-subtitle text-xs font-medium">
              {mode === 'signin'
                ? 'Sign in to access your cloud schedules & analytics'
                : 'Start organizing your schedule with AI intelligence'}
            </p>
          </div>

          {/* Offline Notice if Supabase Env Missing (Pale Amber + Dark Amber/Brown Text) */}
          {!isSupabaseConfigured && (
            <div
              role="alert"
              className="auth-warning-panel p-3.5 rounded-xl border text-xs flex items-start gap-3 shadow-xs"
            >
              <AlertCircle className="auth-warning-icon w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="auth-warning-title font-bold block mb-0.5">
                  Local Offline Mode Available
                </span>
                <p className="leading-relaxed">
                  Supabase credentials not detected. You can sign in locally or use Instant Guest Mode.
                </p>
              </div>
            </div>
          )}

          {/* Error / Success Banners */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" aria-hidden="true" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer active:scale-[0.99]"
            >
              {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? 'Sign In to Workspace'
                  : 'Create Account'}
              </span>
            </button>
          </form>

          {/* Social Auth */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <p className="text-[11px] text-center text-slate-500 font-medium">Or authenticate with</p>
            <div>
              <button
                onClick={() => handleOAuth('github')}
                type="button"
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-400/20 cursor-pointer"
              >
                <span>🐙</span> Continue with GitHub
              </button>
            </div>
          </div>

          {/* Continue as Guest Button */}
          <div className="pt-1 text-center">
            <button
              onClick={onContinueAsGuest}
              type="button"
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300/30 cursor-pointer"
            >
              <span>Continue in Offline Local Mode</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="text-center text-xs text-slate-500 pt-1">
            {mode === 'signin' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded px-1 transition-colors cursor-pointer"
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
                  className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded px-1 transition-colors cursor-pointer"
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

import React from 'react';
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react';
import { NavView } from '../Navigation/Sidebar';

interface TermsOfServiceViewProps {
  onNavigate?: (view: NavView) => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-950 text-slate-100 select-none">
      <div className="max-w-4xl w-full mx-auto px-5 py-8 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                aria-label="Back to Settings"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  BlockFlow Terms of Service
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Draft — Subject to Legal Review
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Effective Date: November 2026 • Version 1.0 (Pre-Launch Draft)
              </p>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">Pre-Launch Draft Notice</h4>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              These draft terms outline the operating relationship and responsibilities between you and BlockFlow based on its real local-first software architecture. Legal review must be completed prior to public launch.
            </p>
          </div>
        </div>

        {/* Core Terms */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Acceptance */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or creating an account within BlockFlow ("the Software"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Software.
            </p>
          </section>

          {/* 2. User Sovereignty & Data Ownership */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              2. User Data Sovereignty & Local Storage Responsibility
            </h2>
            <p>
              BlockFlow operates as a local-first software application. You retain 100% intellectual property ownership of all schedules, goals, notes, tasks, and data entries you input into the Software.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong>Backup Responsibility:</strong> Because data in Guest Mode and Thought Space resides exclusively on your local device or browser storage, you are solely responsible for maintaining regular offline JSON backups.
              </li>
              <li>
                <strong>Browser Data Clearing:</strong> The creators of BlockFlow are not liable for any data loss resulting from browser cache clearances, private browsing sessions, browser uninstalls, hardware loss, or operating system storage resets.
              </li>
            </ul>
          </section>

          {/* 3. Acceptable Use */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              3. Acceptable Use & Security Conduct
            </h2>
            <p>
              When using BlockFlow and any connected cloud synchronization services, you agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Attempt to circumvent or tamper with PostgreSQL Row Level Security (RLS) policies.</li>
              <li>Inject malicious payloads or automated denial-of-service scripts against cloud synchronization endpoints.</li>
              <li>Attempt to read, modify, or delete another user's synchronized data records.</li>
            </ul>
          </section>

          {/* 4. Disclaimer of Warranties */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              4. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              THE SOFTWARE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p>
              UNDER NO CIRCUMSTANCES SHALL THE CREATORS OR OPERATORS OF BLOCKFLOW BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR ACADEMIC / PROFESSIONAL ADVERSE OUTCOMES ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE.
            </p>
          </section>

          {/* 5. Changes to Terms */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              5. Amendments to Terms
            </h2>
            <p>
              These draft terms may be updated or modified as the Software prepares for general commercial release. Continued use of the Software following any revisions constitutes your acceptance of the revised terms.
            </p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>BlockFlow Legal Office • Draft Review</span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('privacy-policy')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              View Privacy Policy →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

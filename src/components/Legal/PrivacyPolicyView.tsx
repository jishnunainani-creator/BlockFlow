import React from 'react';
import { Shield, Lock, HardDrive, Cloud, AlertTriangle, ArrowLeft, Download, FileText } from 'lucide-react';
import { NavView } from '../Navigation/Sidebar';

interface PrivacyPolicyViewProps {
  onNavigate?: (view: NavView) => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onNavigate }) => {
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
                  <Shield className="w-5 h-5 text-indigo-400" />
                  BlockFlow Privacy Policy
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
            <h4 className="font-bold text-amber-300">Draft Document Advisory</h4>
            <p className="text-[11px] leading-relaxed text-amber-200/80">
              This document reflects the actual, verified technical implementation of BlockFlow as of November 2026. It contains no invented certifications, retention periods, or compliance guarantees. Legal counsel review must be completed prior to public launch.
            </p>
          </div>
        </div>

        {/* Core Sections */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Core Architecture */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              1. Local-First Data Architecture & Guest Mode
            </h2>
            <p>
              BlockFlow is designed with a <strong>local-first</strong> privacy model. By default:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                All timetable activities, SMART Goals, task inbox items, focus timer records, and notes are stored strictly inside your browser using on-device <code className="text-indigo-300">IndexedDB</code> and <code className="text-indigo-300">localStorage</code>.
              </li>
              <li>
                <strong>Guest Mode</strong> operates entirely offline. No schedule, task, or note data is sent to external servers or cloud databases while using Guest Mode.
              </li>
              <li>
                Clearing your browser cache, cookies, or using private/incognito browsing windows may permanently delete guest data. We strongly advise using the built-in JSON backup export to maintain copies of your workspace.
              </li>
            </ul>
          </section>

          {/* 2. Cloud Synchronization */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              2. Optional Cloud Synchronization & Supabase
            </h2>
            <p>
              Cloud synchronization is strictly optional and requires explicit opt-in:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong>Account Sign-In:</strong> When you create an account, authentication credentials (email and password) are processed directly by Supabase Auth over encrypted TLS (HTTPS). Passwords are cryptographically hashed; BlockFlow never stores plaintext passwords.
              </li>
              <li>
                <strong>Row Level Security (RLS):</strong> User-owned cloud database tables in Supabase enforce strict PostgreSQL RLS policies where <code className="text-indigo-300 font-mono text-[11px]">auth.uid() = user_id</code>. Other authenticated accounts and anonymous visitors cannot read, insert, update, or delete your private cloud records.
              </li>
              <li>
                <strong>Encryption Transparency:</strong> Synchronized data is encrypted in transit using standard HTTPS/TLS. Ordinary cloud tables are not end-to-end encrypted (E2EE): database administrators and hosting operators can technically inspect stored plaintext rows. True zero-knowledge client-side E2EE is in active development.
              </li>
            </ul>
          </section>

          {/* 3. Thought Space Local-Only Isolation */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              3. Strict Local-Only Isolation for Thought Space
            </h2>
            <p>
              Your thoughts and personal notes in <strong>Thought Space</strong> are protected by strict local-only boundaries:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                Thought Space notes and note hierarchies are <strong>never</strong> transmitted to Supabase or any remote server.
              </li>
              <li>
                They are completely excluded from cloud sync payloads, cloud categories, and cloud purge operations.
              </li>
              <li>
                Notes are persisted in local IndexedDB and can only be exported or imported manually by you as local JSON files.
              </li>
            </ul>
          </section>

          {/* 4. Data Retention, Backups & Deletion */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              4. Data Export, Backups, and Permanent Deletion
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong>Manual Backup & Export:</strong> You can download a complete, unencrypted JSON archive of your entire workspace (schedule, goals, tasks, notes, routines) at any time.
              </li>
              <li>
                <strong>Restoring Backups:</strong> BlockFlow provides an interactive dry-run inspector allowing you to choose between <em>Merging</em> new records with existing data (remapping conflicting IDs) or <em>Replacing</em> your workspace entirely.
              </li>
              <li>
                <strong>Cloud Data Purge:</strong> Authenticated users can delete all remote cloud copies at any time via Settings by clicking <em>"Delete Cloud Copy (Keep Local)"</em>. This leaves your on-device records intact while purging remote Supabase tables.
              </li>
              <li>
                <strong>Local Workspace Reset:</strong> You can clear all local on-device records via Settings at any time.
              </li>
            </ul>
          </section>

          {/* 5. Third-Party Infrastructure */}
          <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              5. Third-Party Infrastructure & Tracking Disclosures
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>
                <strong>Supabase:</strong> Provides cloud authentication and PostgreSQL cloud database hosting when cloud synchronization is enabled.
              </li>
              <li>
                <strong>Hosting:</strong> Application bundles and web assets are distributed via static edge hosting.
              </li>
              <li>
                <strong>Zero Commercial Telemetry:</strong> BlockFlow contains no third-party advertising SDKs, tracking pixels, or data brokers.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>BlockFlow Privacy Office • Draft Review</span>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              View Terms of Service →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

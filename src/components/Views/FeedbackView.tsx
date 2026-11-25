import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquarePlus,
  Star,
  Send,
  RefreshCw,
  Cloud,
  HardDrive,
  CheckCircle2,
  Bug,
  Sparkles,
  Palette,
  Zap,
  MessageCircle,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Clock,
  User,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUS_CONFIG,
  FeedbackCategory,
  FeedbackItem,
  FeedbackStatus,
} from '../../types/feedback';
import {
  checkIsFeedbackAdmin,
  fetchFeedbackList,
  submitFeedback,
  updateFeedbackStatusAndNote,
} from '../../services/feedbackService';
import { getActiveUserId } from '../../utils/userScope';
import { isSupabaseConfigured } from '../../lib/supabase';

interface FeedbackViewProps {
  userEmail?: string | null;
  onOpenAuth: () => void;
  onNavigate?: (view: NavView) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs work',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Love it!',
};

function getCategoryIcon(category: FeedbackCategory) {
  switch (category) {
    case 'bug':
      return Bug;
    case 'feature':
      return Sparkles;
    case 'ui_ux':
      return Palette;
    case 'performance':
      return Zap;
    default:
      return MessageCircle;
  }
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  userEmail,
  onOpenAuth,
  onNavigate,
}) => {
  const { addToast } = useTimetable();
  const activeUserId = getActiveUserId();
  const supabaseReady = isSupabaseConfigured;

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List & sync state
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedTab, setFeedTab] = useState<'mine' | 'admin'>('mine');

  // Admin triage filters & draft edits
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<FeedbackStatus>('open');
  const [draftNote, setDraftNote] = useState('');
  const [showAdminSetupHelp, setShowAdminSetupHelp] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [adminFlag, listRes] = await Promise.all([
        checkIsFeedbackAdmin(userEmail),
        fetchFeedbackList(activeUserId),
      ]);
      setIsAdmin(adminFlag);
      setItems(listRes.items);
      setCloudSynced(listRes.cloudAvailable);
      if (adminFlag) {
        setFeedTab('admin');
      }
    } catch (err) {
      console.warn('Failed to load feedback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, activeUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      addToast('Please enter both a subject and feedback details.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const pageContext = `${window.innerWidth}x${window.innerHeight}`;
      const res = await submitFeedback(
        {
          category,
          rating,
          title,
          message,
          pageContext,
        },
        userEmail,
        activeUserId
      );

      setItems((prev) => [res.item, ...prev.filter((i) => i.id !== res.item.id)]);
      setTitle('');
      setMessage('');
      setRating(5);

      if (res.syncedToCloud) {
        setCloudSynced(true);
        addToast('Feedback submitted and synced to database! Thank you.', 'success');
      } else if (res.errorMessage) {
        addToast(`Saved locally (cloud sync pending: ${res.errorMessage})`, 'info');
      } else {
        addToast('Feedback saved locally! Sign in to sync with cloud.', 'success');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTriage = (item: FeedbackItem) => {
    setEditingNoteId(item.id);
    setDraftStatus(item.status);
    setDraftNote(item.adminNote || '');
  };

  const handleSaveTriage = async (feedbackId: string) => {
    const res = await updateFeedbackStatusAndNote(feedbackId, draftStatus, draftNote.trim());
    if (res.success) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                status: draftStatus,
                adminNote: draftNote.trim() || undefined,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setEditingNoteId(null);
      addToast('Feedback status & note updated.', 'success');
    } else {
      addToast(res.errorMessage || 'Could not update feedback status.', 'error');
    }
  };

  const myItems = useMemo(() => {
    if (!activeUserId) return items;
    return items.filter((item) => item.userId === activeUserId || !item.userId);
  }, [items, activeUserId]);

  const displayedItems = useMemo(() => {
    const source = feedTab === 'admin' ? items : myItems;
    return source.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.userEmail.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [feedTab, items, myItems, statusFilter, categoryFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = items.length;
    const avgRating =
      total > 0 ? (items.reduce((acc, i) => acc + i.rating, 0) / total).toFixed(1) : '-';
    const openCount = items.filter((i) => i.status === 'open').length;
    return { total, avgRating, openCount };
  }, [items]);

  const adminSqlSnippet = `INSERT INTO public.feedback_admins (email) VALUES ('${userEmail || 'your-email@example.com'}') ON CONFLICT DO NOTHING;`;

  const handleCopySql = () => {
    navigator.clipboard?.writeText(adminSqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 space-y-6 select-none scrollbar-thin">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        {onNavigate && (
          <PageBreadcrumb items={[{ label: 'Feedback' }]} onNavigate={onNavigate} />
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <MessageSquarePlus className="w-6 h-6 text-indigo-400" />
              <span>Feedback &amp; Feature Requests</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Share bug reports, design ideas, or feature requests. Submissions sync directly with the BlockFlow database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sync Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                cloudSynced
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              {cloudSynced ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Database Synced</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userEmail ? 'Local Queue' : 'Guest (Local)'}</span>
                </>
              )}
            </div>

            {!userEmail && supabaseReady && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                Sign In to Sync
              </button>
            )}

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh feedback from database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Feedback Submission Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Submit Feedback
              </h2>
              {userEmail && (
                <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  as {userEmail}
                </span>
              )}
            </div>

            {/* Category Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat.id);
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        active
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="text-xs font-semibold truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Star Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Experience Rating</label>
                <span className="text-xs font-semibold text-amber-400">
                  {RATING_LABELS[hoverRating || rating]} ({hoverRating || rating}/5)
                </span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const filled = starVal <= (hoverRating || rating);
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(starVal)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      aria-label={`Rate ${starVal} out of 5`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          filled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject / Title */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-title" className="text-xs font-bold text-slate-300 block">
                Subject
              </label>
              <input
                id="feedback-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Add keyboard shortcut for Focus Mode"
                maxLength={120}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-message" className="text-xs font-bold text-slate-300 block">
                Details
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what worked well, what broke, or what feature would help your daily workflow..."
                rows={4}
                maxLength={2000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors resize-y"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </form>

          {/* RIGHT: Submitted Feedback & Owner Inbox */}
          <div className="lg:col-span-7 space-y-4">
            {/* Summary & Tabs */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFeedTab('mine')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      feedTab === 'mine'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    My Submissions ({myItems.length})
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setFeedTab('admin')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        feedTab === 'admin'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>All Users Inbox ({items.length})</span>
                    </button>
                  )}
                </div>

                {/* Quick Metrics */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    Avg Rating: <strong className="text-amber-400">{stats.avgRating} ★</strong>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    Open: <strong className="text-white">{stats.openCount}</strong>
                  </div>
                </div>
              </div>

              {/* Filter & Search Row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search feedback..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as FeedbackCategory | 'all')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {FEEDBACK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'all')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="planned">Planned</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Feedback List */}
            {displayedItems.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 space-y-2">
                <MessageSquarePlus className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No feedback items yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Submit your first idea, bug report, or rating on the left. Once synced, you can track its status right here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedItems.map((item) => {
                  const catMeta =
                    FEEDBACK_CATEGORIES.find((c) => c.id === item.category) ||
                    FEEDBACK_CATEGORIES[4];
                  const statusMeta = FEEDBACK_STATUS_CONFIG[item.status];
                  const CatIcon = getCategoryIcon(item.category);
                  const isEditing = editingNoteId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.badgeClass}`}
                            >
                              <CatIcon className="w-3 h-3" />
                              {catMeta.label}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.label}
                            </span>
                            <span className="text-amber-400 text-xs font-bold">
                              {'★'.repeat(item.rating)}
                              <span className="text-slate-600">{'★'.repeat(5 - item.rating)}</span>
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        </div>

                        <div className="text-right text-[10px] text-slate-500 space-y-0.5 shrink-0">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{item.userEmail}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </p>

                      {item.adminNote && !isEditing && (
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-indigo-300">Owner Reply: </span>
                            <span>{item.adminNote}</span>
                          </div>
                        </div>
                      )}

                      {/* Admin Triage Controls */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-800/80">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleStartTriage(item)}
                              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                            >
                              Update Status / Reply →
                            </button>
                          ) : (
                            <div className="space-y-2 pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={draftStatus}
                                  onChange={(e) => setDraftStatus(e.target.value as FeedbackStatus)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                                >
                                  <option value="open">Open</option>
                                  <option value="in_review">In Review</option>
                                  <option value="planned">Planned</option>
                                  <option value="resolved">Resolved</option>
                                </select>
                                <input
                                  type="text"
                                  value={draftNote}
                                  onChange={(e) => setDraftNote(e.target.value)}
                                  placeholder="Optional reply visible to user..."
                                  className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveTriage(item.id)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Owner Admin Setup Collapsible */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdminSetupHelp(!showAdminSetupHelp)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Owner Setup: How to view all users&apos; feedback in your Admin Inbox</span>
                </span>
                {showAdminSetupHelp ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showAdminSetupHelp && (
                <div className="px-4 pb-4 pt-1 space-y-2.5 text-xs text-slate-400 border-t border-slate-800/70">
                  <p>
                    1. Run migration{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300">
                      supabase/migrations/20261125_user_feedback.sql
                    </code>{' '}
                    in your Supabase SQL Editor.
                  </p>
                  <p>
                    2. Register your owner email in{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300">
                      public.feedback_admins
                    </code>{' '}
                    so Row-Level Security grants you access to all users&apos; submissions:
                  </p>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300">
                    <span className="flex-1 overflow-x-auto">{adminSqlSnippet}</span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 cursor-pointer"
                      title="Copy SQL"
                    >
                      {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

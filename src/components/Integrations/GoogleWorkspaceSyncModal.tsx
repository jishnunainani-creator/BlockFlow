import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  CheckSquare,
  Square,
  Plus,
  LogIn,
  LogOut,
  Info,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import {
  getGoogleWorkspaceConnection,
  initiateGoogleWorkspaceAuth,
  disconnectGoogleWorkspace,
  fetchScheduleEmailsFromGmail,
  SAMPLE_ACADEMIC_EMAILS,
  GoogleWorkspaceConnectionState,
  RawGmailMessage,
} from '../../services/googleWorkspaceService';
import {
  ExtractedEmailEvent,
  extractEventFromGmailMessage,
  convertExtractedEventToScheduledBlock,
  checkEventConflict,
} from '../../utils/emailEventParser';
import { DAYS_OF_WEEK, minutesToTimeStr, timeStrToMinutes } from '../../utils/timeUtils';
import { ScheduledBlock } from '../../types/timetable';

interface GoogleWorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleWorkspaceSyncModal: React.FC<GoogleWorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentWeekScheduledBlocks, currentWeekId, bulkAddScheduledBlocks, addScheduledBlock, addToast } = useTimetable();

  const [connection, setConnection] = useState<GoogleWorkspaceConnectionState>({
    isConnected: false,
    email: null,
    provider: 'demo',
    hasGmailScope: false,
    hasCalendarScope: false,
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    'newer_than:14d (subject:lecture OR subject:exam OR subject:class OR subject:assignment OR subject:meeting OR subject:schedule OR filename:invite.ics)'
  );

  const [rawEmails, setRawEmails] = useState<RawGmailMessage[]>([]);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEmailEvent[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'events' | 'emails' | 'settings'>('events');

  // Load connection state on open
  useEffect(() => {
    if (isOpen) {
      loadConnection();
    }
  }, [isOpen]);

  const loadConnection = async () => {
    try {
      const conn = await getGoogleWorkspaceConnection();
      setConnection(conn);
      // If in demo mode or already connected, automatically run initial scan with available emails
      if (conn.isConnected && rawEmails.length === 0) {
        handleScanInbox(conn);
      }
    } catch (err) {
      console.warn('Failed to inspect workspace connection:', err);
    }
  };

  const handleConnectOAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await initiateGoogleWorkspaceAuth();
      if (res?.error) {
        addToast(`Google login error: ${res.error.message}`, 'error');
      } else {
        addToast('Redirecting to Google Workspace consent screen...', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Could not initiate Google login', 'error');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleEnableDemoMode = () => {
    setConnection({
      isConnected: true,
      email: 'student.demo@ahduni.edu.in',
      provider: 'demo',
      hasGmailScope: true,
      hasCalendarScope: true,
    });
    addToast('Demo Google Workspace enabled with sample academic emails', 'info');
    parseAndSetEmails(SAMPLE_ACADEMIC_EMAILS);
  };

  const handleDisconnect = () => {
    disconnectGoogleWorkspace();
    setConnection({
      isConnected: false,
      email: null,
      provider: 'demo',
      hasGmailScope: false,
      hasCalendarScope: false,
    });
    setRawEmails([]);
    setExtractedEvents([]);
    setSelectedEventIds(new Set());
    addToast('Disconnected from Google Workspace', 'info');
  };

  const parseAndSetEmails = (messages: RawGmailMessage[]) => {
    setRawEmails(messages);
    const events = messages.map(extractEventFromGmailMessage);
    setExtractedEvents(events);
    setSelectedEventIds(new Set(events.map((e) => e.id)));
  };

  const handleScanInbox = async (activeConn: GoogleWorkspaceConnectionState = connection) => {
    setIsScanning(true);
    try {
      if (activeConn.provider === 'demo') {
        // Use realistic sample emails in demo mode
        await new Promise((r) => setTimeout(r, 600));
        parseAndSetEmails(SAMPLE_ACADEMIC_EMAILS);
        addToast(`Found ${SAMPLE_ACADEMIC_EMAILS.length} schedule emails in inbox`, 'success');
      } else {
        // Fetch from real Gmail API using saved or Supabase OAuth provider token
        const token = localStorage.getItem('blockflow_google_workspace_token');
        if (!token) {
          throw new Error('No active Google OAuth token found. Please sign in or use demo mode.');
        }
        const msgs = await fetchScheduleEmailsFromGmail(token, searchQuery);
        if (msgs.length === 0) {
          addToast('No schedule-related emails found in your specified date window.', 'info');
        } else {
          parseAndSetEmails(msgs);
          addToast(`Found ${msgs.length} matching schedule emails!`, 'success');
        }
      }
    } catch (err: any) {
      console.warn('Gmail scan error:', err);
      addToast(err.message || 'Failed to scan Gmail inbox', 'error');
      // Graceful fallback to demo data if API call fails
      parseAndSetEmails(SAMPLE_ACADEMIC_EMAILS);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedEventIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEventIds(next);
  };

  const handleSelectAll = () => {
    if (selectedEventIds.size === extractedEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(extractedEvents.map((e) => e.id)));
    }
  };

  // Update event attribute inline (e.g. adjust start time or day)
  const handleUpdateEvent = (id: string, updates: Partial<ExtractedEmailEvent>) => {
    setExtractedEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  // Import single block
  const handleImportSingle = (event: ExtractedEmailEvent) => {
    const block = convertExtractedEventToScheduledBlock(event, currentWeekId);
    addScheduledBlock(block);
    addToast(`Added "${block.title}" to ${DAYS_OF_WEEK[block.dayOfWeek]?.full || 'your'} timetable!`, 'success');
    // Remove from candidate list
    setExtractedEvents((prev) => prev.filter((e) => e.id !== event.id));
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      next.delete(event.id);
      return next;
    });
  };

  // Bulk import selected
  const handleImportSelected = () => {
    const toImport = extractedEvents.filter((e) => selectedEventIds.has(e.id));
    if (toImport.length === 0) return;

    const blocks: ScheduledBlock[] = toImport.map((event) =>
      convertExtractedEventToScheduledBlock(event, currentWeekId)
    );

    bulkAddScheduledBlocks(blocks);
    addToast(`Successfully imported ${blocks.length} events to your Timetable! 🚀`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-500/20 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Google Workspace &amp; Gmail Sync
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Calendar View
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan your Gmail for lecture notices, exam dates, and invites to schedule them into your timetable.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Connection Bar */}
        <div className="px-4 py-3 bg-slate-100/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connection.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {connection.isConnected ? (
                <>
                  Connected as <span className="font-bold text-slate-900 dark:text-white">{connection.email}</span>
                  {connection.provider === 'demo' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                      Demo Mode
                    </span>
                  )}
                </>
              ) : (
                'Not connected to Google Workspace'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {connection.isConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => handleScanInbox()}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Scan Gmail Inbox'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Disconnect account"
                >
                  <LogOut size={13} />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={isLoadingAuth}
                  className="px-3 py-1.5 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <LogIn size={13} />
                  <span>Connect Google Account</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnableDemoMode}
                  className="px-3 py-1.5 rounded-lg font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Try Demo Simulation</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'events'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar size={14} />
            <span>Detected Events ({extractedEvents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'emails'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Mail size={14} />
            <span>Raw Emails ({rawEmails.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!connection.isConnected && (
            <div className="p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Connect your Google Workspace
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Authorize BlockFlow to read academic announcements and calendar invites from Gmail. Or test the full extraction workflow instantly with sample university emails.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConnectOAuth}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <LogIn size={14} />
                  <span>Sign In with Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnableDemoMode}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Test with Demo Emails</span>
                </button>
              </div>
            </div>
          )}

          {connection.isConnected && activeTab === 'events' && (
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between text-xs pb-1">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer"
                >
                  {selectedEventIds.size === extractedEvents.length && extractedEvents.length > 0 ? (
                    <CheckSquare size={15} className="text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square size={15} />
                  )}
                  <span>
                    Select All ({selectedEventIds.size}/{extractedEvents.length})
                  </span>
                </button>

                <span className="text-[11px] text-slate-400">
                  Target week: <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">{currentWeekId}</span>
                </span>
              </div>

              {extractedEvents.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-2">
                  <p className="text-xs font-medium text-slate-500">
                    No schedule events detected. Click "Scan Gmail Inbox" above to look for lecture notices and calendar invites.
                  </p>
                </div>
              ) : (
                extractedEvents.map((event) => {
                  const isSelected = selectedEventIds.has(event.id);
                  const conflictInfo = checkEventConflict(event, currentWeekScheduledBlocks);

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isSelected
                          ? 'bg-slate-50/80 dark:bg-slate-850/80 border-indigo-300 dark:border-indigo-900/60 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      {/* Top Row: Checkbox, Title, Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(event.id)}
                            className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                          <div className="min-w-0">
                            <input
                              type="text"
                              value={event.title}
                              onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                              className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden transition-colors w-full"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              From: <span className="text-slate-700 dark:text-slate-300 font-medium">{event.emailFrom}</span> • Subject: "{event.emailSubject}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              event.sourceType === 'ics'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {event.sourceType === 'ics' ? '📅 ICS Invite' : '✨ AI Extracted'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {event.category}
                          </span>
                        </div>
                      </div>

                      {/* Controls Row: Day, Time, Duration */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        {/* Day Selector */}
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <select
                            value={event.dayOfWeek}
                            onChange={(e) => handleUpdateEvent(event.id, { dayOfWeek: Number(e.target.value) })}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.index} value={day.index}>
                                {day.full}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Start Time Input */}
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <input
                            type="time"
                            value={event.startTime}
                            onChange={(e) => handleUpdateEvent(event.id, { startTime: e.target.value })}
                            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>

                        {/* Duration Chips */}
                        <div className="flex items-center gap-1">
                          {[30, 45, 60, 90, 120].map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => handleUpdateEvent(event.id, { duration: dur })}
                              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                event.duration === dur
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {dur}m
                            </button>
                          ))}
                        </div>

                        <div className="ml-auto">
                          <button
                            type="button"
                            onClick={() => handleImportSingle(event)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Add to Timetable</span>
                          </button>
                        </div>
                      </div>

                      {/* Conflict Alert Banner */}
                      {conflictInfo.hasConflict && conflictInfo.conflictingBlock && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>
                            Overlaps with existing block: <strong className="underline">{conflictInfo.conflictingBlock.title}</strong> ({conflictInfo.conflictingBlock.duration}m at {minutesToTimeStr(conflictInfo.conflictingBlock.startMinutes)}). You can adjust the time slot above.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {connection.isConnected && activeTab === 'emails' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Filter size={13} className="text-indigo-500" />
                  Gmail Search Filter
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Gmail search query..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleScanInbox()}
                    disabled={isScanning}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 cursor-pointer transition-colors"
                  >
                    Run Search
                  </button>
                </div>
              </div>

              {rawEmails.map((email) => (
                <div
                  key={email.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {email.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(email.dateStr).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    From: {email.from}
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {email.bodyText}
                  </div>
                  {email.icsContent && (
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Has attached VCALENDAR .ics event</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          {connection.isConnected && extractedEvents.length > 0 && (
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={selectedEventIds.size === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 size={15} />
              <span>Import Selected ({selectedEventIds.size}) to Timetable</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

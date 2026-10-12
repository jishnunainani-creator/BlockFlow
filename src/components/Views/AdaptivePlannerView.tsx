import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { loadTaskInbox, saveTaskInbox, loadPersonalRules } from '../../utils/taskInboxStorage';
import { loadAssignments } from '../../utils/assignmentStorage';
import { loadExecutionSessions } from '../../utils/sessionStorage';
import { TaskInboxItem, PersonalRule, Assignment } from '../../types/executionOS';
import { ExecutionSession } from '../../types/sessionLog';
import { ScheduledBlock, Priority } from '../../types/timetable';
import {
  PlanningIssue,
  PlanningIssueType,
  PlanningIssueSeverity,
  ProposedPlanItem,
  CandidateSlot,
  ScheduleConstraintConfig,
} from '../../types/adaptivePlanner';
import {
  detectPlanningIssues,
  findFeasibleCandidateSlots,
  generateProposalForIssue,
  validateProposalSlot,
  DEFAULT_CONSTRAINT_CONFIG,
} from '../../utils/adaptivePlannerEngine';
import {
  loadStoredProposals,
  saveStoredProposals,
  loadPlannerConfig,
  savePlannerConfig,
} from '../../utils/adaptivePlannerStorage';
import {
  DAYS_OF_WEEK,
  minutesToTimeStr,
  formatMinutesToTimeString,
  timeStrToMinutes,
} from '../../utils/timeUtils';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface AdaptivePlannerViewProps {
  onNavigate?: (view: NavView) => void;
}

export const AdaptivePlannerView: React.FC<AdaptivePlannerViewProps> = ({ onNavigate }) => {
  const {
    scheduledBlocks,
    currentWeekScheduledBlocks,
    currentWeekId,
    addScheduledBlock,
    updateScheduledBlock,
    addToast,
  } = useTimetable();

  // ── State ──────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskInboxItem[]>(() => loadTaskInbox());
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadAssignments());
  const [personalRules, setPersonalRules] = useState<PersonalRule[]>(() => loadPersonalRules());
  const [sessions, setSessions] = useState<ExecutionSession[]>(() => loadExecutionSessions());
  const [config, setConfig] = useState<ScheduleConstraintConfig>(() => loadPlannerConfig());

  // Proposals State
  const [proposals, setProposals] = useState<ProposedPlanItem[]>(() => loadStoredProposals());

  // Filter & UI States
  const [activeTab, setActiveTab] = useState<'issues' | 'proposals' | 'execution'>('issues');
  const [issueFilter, setIssueFilter] = useState<'all' | 'overdue' | 'conflicts' | 'missed' | 'unfittable'>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Edit Proposal Modal State
  const [editingProposal, setEditingProposal] = useState<ProposedPlanItem | null>(null);
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(0);
  const [editStartMinutes, setEditStartMinutes] = useState<number>(540);
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editValidationError, setEditValidationError] = useState<string | null>(null);

  // ── Reload canonical data ──────────────────────────────────────────
  const refreshCanonicalData = useCallback(() => {
    setTasks(loadTaskInbox());
    setAssignments(loadAssignments());
    setPersonalRules(loadPersonalRules());
    setSessions(loadExecutionSessions());
  }, []);

  useEffect(() => {
    refreshCanonicalData();
  }, [refreshCanonicalData]);

  // Sync proposals with storage changes
  useEffect(() => {
    const handleProposalSync = () => {
      setProposals(loadStoredProposals());
    };
    window.addEventListener('blockflow_adaptive_proposals_changed', handleProposalSync);
    window.addEventListener('storage', handleProposalSync);
    return () => {
      window.removeEventListener('blockflow_adaptive_proposals_changed', handleProposalSync);
      window.removeEventListener('storage', handleProposalSync);
    };
  }, []);

  // ── Detect Issues ──────────────────────────────────────────────────
  const detectedIssues = useMemo(() => {
    return detectPlanningIssues({
      tasks,
      assignments,
      scheduledBlocks,
      currentWeekId,
      personalRules,
      executionSessions: sessions,
      config,
    });
  }, [tasks, assignments, scheduledBlocks, currentWeekId, personalRules, sessions, config]);

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    if (issueFilter === 'all') return detectedIssues;
    if (issueFilter === 'overdue') {
      return detectedIssues.filter(
        (i) => i.type === 'overdue_task' || i.type === 'impending_deadline'
      );
    }
    if (issueFilter === 'conflicts') {
      return detectedIssues.filter((i) => i.type === 'schedule_conflict');
    }
    if (issueFilter === 'missed') {
      return detectedIssues.filter((i) => i.type === 'missed_session');
    }
    if (issueFilter === 'unfittable') {
      return detectedIssues.filter(
        (i) => i.type === 'unfittable_task' || i.type === 'overloaded_day'
      );
    }
    return detectedIssues;
  }, [detectedIssues, issueFilter]);

  // Active Pending Proposals
  const pendingProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'pending');
  }, [proposals]);

  const approvedProposals = useMemo(() => {
    return proposals.filter((p) => p.status === 'approved');
  }, [proposals]);

  // ── Action Handlers ────────────────────────────────────────────────
  const handleScanSchedule = () => {
    setIsScanning(true);
    refreshCanonicalData();
    setTimeout(() => {
      setIsScanning(false);
      addToast(`Schedule scan complete: ${detectedIssues.length} planning issues analyzed.`, 'info');
    }, 350);
  };

  const handleGenerateProposal = (issue: PlanningIssue) => {
    const prop = generateProposalForIssue({
      issue,
      scheduledBlocks,
      personalRules,
      currentWeekId,
      config,
    });

    if (!prop) {
      addToast(
        `No feasible slot found before deadline for "${issue.target.title}". Consider shortening or extending deadline.`,
        'warning'
      );
      return;
    }

    const updated = [prop, ...proposals.filter((p) => p.issueId !== issue.id)];
    setProposals(updated);
    saveStoredProposals(updated);
    setActiveTab('proposals');
    addToast(`Generated realistic recovery proposal for "${issue.target.title}".`, 'success');
  };

  const handleGenerateAllProposals = () => {
    let generatedCount = 0;
    const newProposals: ProposedPlanItem[] = [...proposals];

    detectedIssues.forEach((issue) => {
      const existing = newProposals.find((p) => p.issueId === issue.id && p.status === 'pending');
      if (!existing) {
        const prop = generateProposalForIssue({
          issue,
          scheduledBlocks,
          personalRules,
          currentWeekId,
          config,
        });
        if (prop) {
          newProposals.push(prop);
          generatedCount++;
        }
      }
    });

    if (generatedCount > 0) {
      setProposals(newProposals);
      saveStoredProposals(newProposals);
      setActiveTab('proposals');
      addToast(`Generated ${generatedCount} recovery proposals. Review and approve below.`, 'success');
    } else {
      addToast('All actionable issues already have active proposals or are balanced.', 'info');
    }
  };

  const handleApproveProposal = (proposalId: string) => {
    const updated = proposals.map((p) =>
      p.id === proposalId ? { ...p, status: 'approved' as const } : p
    );
    setProposals(updated);
    saveStoredProposals(updated);
    addToast('Proposal approved. Click "Apply Approved Changes" when ready.', 'info');
  };

  const handleRejectProposal = (proposalId: string) => {
    const updated = proposals.map((p) =>
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    );
    setProposals(updated);
    saveStoredProposals(updated);
    addToast('Proposal rejected. Schedule preserved unchanged.', 'info');
  };

  const handleDeleteProposal = (proposalId: string) => {
    const updated = proposals.filter((p) => p.id !== proposalId);
    setProposals(updated);
    saveStoredProposals(updated);
  };

  const handleSelectAlternativeSlot = (proposalId: string, slot: CandidateSlot) => {
    const updated = proposals.map((p) => {
      if (p.id === proposalId) {
        const remainingAlts = [
          p.selectedSlot,
          ...p.alternativeSlots.filter(
            (s) => s.startMinutes !== slot.startMinutes || s.dayOfWeek !== slot.dayOfWeek
          ),
        ];
        return {
          ...p,
          selectedSlot: slot,
          alternativeSlots: remainingAlts,
        };
      }
      return p;
    });
    setProposals(updated);
    saveStoredProposals(updated);
    addToast(`Switched to slot on ${slot.dateLabel} at ${minutesToTimeStr(slot.startMinutes)}.`, 'info');
  };

  // ── Open Edit Proposal Modal ───────────────────────────────────────
  const handleOpenEditModal = (proposal: ProposedPlanItem) => {
    setEditingProposal(proposal);
    setEditDayOfWeek(proposal.selectedSlot.dayOfWeek);
    setEditStartMinutes(proposal.selectedSlot.startMinutes);
    setEditDuration(proposal.proposedDuration);
    setEditValidationError(null);
  };

  const handleSaveEditedProposal = () => {
    if (!editingProposal) return;

    // Check validity of custom slot
    const customSlot: CandidateSlot = {
      dateLabel: DAYS_OF_WEEK[editDayOfWeek]?.full || `Day ${editDayOfWeek + 1}`,
      dayOfWeek: editDayOfWeek,
      weekId: currentWeekId,
      startMinutes: editStartMinutes,
      endMinutes: editStartMinutes + editDuration,
      duration: editDuration,
      rankingScore: 90,
      rankingReasons: ['User manually customized this slot.'],
      isRecommended: true,
    };

    const validation = validateProposalSlot(
      customSlot,
      scheduledBlocks,
      editingProposal.entityType === 'block' ? editingProposal.entityId : undefined
    );

    if (!validation.isValid) {
      setEditValidationError(validation.conflictMessage || 'Selected time collides with an existing block.');
      return;
    }

    const updated = proposals.map((p) => {
      if (p.id === editingProposal.id) {
        return {
          ...p,
          proposedDuration: editDuration,
          selectedSlot: customSlot,
          reason: `Customized by user: ${customSlot.dateLabel} at ${minutesToTimeStr(editStartMinutes)}.`,
        };
      }
      return p;
    });

    setProposals(updated);
    saveStoredProposals(updated);
    setEditingProposal(null);
    addToast('Updated proposal with custom time slot.', 'success');
  };

  // ── APPLY PROPOSALS TO CANONICAL STORES ─────────────────────────────
  const handleApplyApprovedProposals = () => {
    const toApply = proposals.filter((p) => p.status === 'approved');
    if (toApply.length === 0) {
      addToast('No approved proposals to apply. Click "Approve" on a proposal first.', 'warning');
      return;
    }

    let appliedCount = 0;
    const currentTasks = loadTaskInbox();
    let tasksUpdated = false;

    // We keep track of simulated placed blocks in this batch to prevent intra-batch double booking
    const placedInThisBatch: ScheduledBlock[] = [...scheduledBlocks];

    const successfullyAppliedIds: string[] = [];

    for (const proposal of toApply) {
      // Pre-application validation against live current blocks & intra-batch blocks
      const validation = validateProposalSlot(
        proposal.selectedSlot,
        placedInThisBatch,
        proposal.entityType === 'block' ? proposal.entityId : undefined
      );

      if (!validation.isValid) {
        addToast(
          `Cannot apply proposal for "${proposal.title}": ${validation.conflictMessage}`,
          'error'
        );
        continue;
      }

      // 1. If rescheduling an existing block
      if (proposal.entityType === 'block') {
        updateScheduledBlock(proposal.entityId, {
          dayOfWeek: proposal.selectedSlot.dayOfWeek,
          startMinutes: proposal.selectedSlot.startMinutes,
          duration: proposal.proposedDuration,
          status: 'rescheduled',
        });

        // Update intra-batch record
        const bIdx = placedInThisBatch.findIndex((b) => b.id === proposal.entityId);
        if (bIdx >= 0) {
          placedInThisBatch[bIdx] = {
            ...placedInThisBatch[bIdx],
            dayOfWeek: proposal.selectedSlot.dayOfWeek,
            startMinutes: proposal.selectedSlot.startMinutes,
            duration: proposal.proposedDuration,
          };
        }
      }
      // 2. If scheduling a task from Inbox
      else if (proposal.entityType === 'task') {
        const matchingTask = currentTasks.find((t) => t.id === proposal.entityId);
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const newBlockData: Omit<ScheduledBlock, 'id' | 'weekId'> = {
          blockId,
          title: proposal.title,
          color: '#3B82F6',
          priority: matchingTask?.priority || 'high',
          icon: 'target',
          dayOfWeek: proposal.selectedSlot.dayOfWeek,
          startMinutes: proposal.selectedSlot.startMinutes,
          duration: proposal.proposedDuration,
          taskId: proposal.entityId,
          goalId: matchingTask?.goalId,
          status: 'scheduled',
        };

        addScheduledBlock(newBlockData);

        // Update task status in canonical task inbox
        if (matchingTask) {
          matchingTask.status = 'scheduled';
          matchingTask.scheduledBlockId = blockId;
          matchingTask.scheduledDayOfWeek = proposal.selectedSlot.dayOfWeek;
          matchingTask.scheduledStartMinutes = proposal.selectedSlot.startMinutes;
          tasksUpdated = true;
        }

        // Add to intra-batch simulation
        placedInThisBatch.push({
          ...newBlockData,
          id: blockId,
          weekId: proposal.selectedSlot.weekId,
        });

        // If split part has companion slot, also add companion part
        if (proposal.splitPart?.companionSlot) {
          const comp = proposal.splitPart.companionSlot;
          const compBlockId = `block-${Date.now()}-part2`;
          addScheduledBlock({
            blockId: compBlockId,
            title: `${proposal.title} (Part 2)`,
            color: '#3B82F6',
            priority: matchingTask?.priority || 'high',
            icon: 'target',
            dayOfWeek: comp.dayOfWeek,
            startMinutes: comp.startMinutes,
            duration: proposal.proposedDuration,
            taskId: proposal.entityId,
            goalId: matchingTask?.goalId,
            status: 'scheduled',
          });
        }
      }

      successfullyAppliedIds.push(proposal.id);
      appliedCount++;
    }

    if (tasksUpdated) {
      saveTaskInbox(currentTasks);
      setTasks(currentTasks);
    }

    // Mark applied proposals
    const updatedProposals = proposals.map((p) =>
      successfullyAppliedIds.includes(p.id)
        ? { ...p, status: 'applied' as const, appliedAt: Date.now() }
        : p
    );
    setProposals(updatedProposals);
    saveStoredProposals(updatedProposals);

    if (appliedCount > 0) {
      addToast(`Successfully applied ${appliedCount} schedule changes to your timetable!`, 'success');
    }
  };

  const handleClearAppliedProposals = () => {
    const updated = proposals.filter((p) => p.status !== 'applied' && p.status !== 'rejected');
    setProposals(updated);
    saveStoredProposals(updated);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* ── TOP HEADER BAR ── */}
      <header className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageBreadcrumb items={[{ label: 'Plan & Organize' }, { label: 'Adaptive Planner' }]} />
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#3659C9] dark:text-[#4F73E3]" />
              Adaptive Planner
            </h1>
            {detectedIssues.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {detectedIssues.length} issue{detectedIssues.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Detect schedule problems, evaluate realistic alternatives, and safely recover your schedule.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScanSchedule}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            title="Scan timetable & tasks for new bottlenecks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Scan Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
            title="Adjust availability windows & buffer settings"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Preferences</span>
          </button>

          {detectedIssues.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateAllProposals}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white flex items-center gap-1.5 transition-colors shadow-xs"
              title="Automatically find candidate slots for all actionable issues"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Recovery Plan</span>
            </button>
          )}
        </div>
      </header>

      {/* ── NAVIGATION TABS & FILTER BAR ── */}
      <div className="px-5 py-2.5 border-b border-slate-800/60 bg-slate-900/40 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Main Section Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'issues'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Planning Issues ({detectedIssues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'proposals'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span>Proposed Plan ({pendingProposals.length + approvedProposals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('execution')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'execution'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Plan vs Reality Log</span>
          </button>
        </div>

        {/* Issue Filter Chips (visible on issues tab) */}
        {activeTab === 'issues' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setIssueFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                issueFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({detectedIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setIssueFilter('overdue')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                issueFilter === 'overdue'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overdue & Deadlines
            </button>
            <button
              type="button"
              onClick={() => setIssueFilter('conflicts')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                issueFilter === 'conflicts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Conflicts
            </button>
            <button
              type="button"
              onClick={() => setIssueFilter('missed')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                issueFilter === 'missed'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missed Sessions
            </button>
            <button
              type="button"
              onClick={() => setIssueFilter('unfittable')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                issueFilter === 'unfittable'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Capacity & Overload
            </button>
          </div>
        )}

        {/* Proposals Action Bar (visible on proposals tab) */}
        {activeTab === 'proposals' && proposals.length > 0 && (
          <div className="flex items-center gap-2">
            {approvedProposals.length > 0 && (
              <button
                type="button"
                onClick={handleApplyApprovedProposals}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Approved Changes ({approvedProposals.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAppliedProposals}
              className="px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear Dismissed
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN SCROLLABLE CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {/* TAB 1: ACTIONABLE PLANNING ISSUES */}
        {activeTab === 'issues' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">Your Schedule Is Balanced & Healthy</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Zero overdue commitments, schedule overlaps, or unmanageable capacity deficits were detected.
                  All current timetable blocks respect your configured availability limits.
                </p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('calendar')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Calendar & Timetable</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredIssues.map((issue) => {
                  const severityBadge =
                    issue.severity === 'critical'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : issue.severity === 'high'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30';

                  const typeIcon =
                    issue.type === 'overdue_task' || issue.type === 'impending_deadline' ? (
                      <Clock className="w-4 h-4 text-rose-400" />
                    ) : issue.type === 'schedule_conflict' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : issue.type === 'missed_session' ? (
                      <RefreshCw className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Flame className="w-4 h-4 text-blue-400" />
                    );

                  return (
                    <div
                      key={issue.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 shrink-0 mt-0.5">
                            {typeIcon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${severityBadge}`}
                              >
                                {issue.severity}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">{issue.whatHappened}</p>
                          </div>
                        </div>

                        {/* Proposal Generator CTA */}
                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleGenerateProposal(issue)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3659C9] hover:bg-[#2B47A8] dark:bg-[#4F73E3] dark:hover:bg-[#6384ED] text-white flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Find Alternative</span>
                          </button>
                        </div>
                      </div>

                      {/* Diagnostic Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/60">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Why it matters
                          </span>
                          <p className="text-slate-400">{issue.whyItMatters}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Recommended action
                          </span>
                          <p className="text-slate-300">{issue.recommendedAction}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROPOSED PLAN & ALTERNATIVES */}
        {activeTab === 'proposals' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {proposals.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-white">No Active Recovery Proposals</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Find Alternative" next to any detected issue, or "Generate Recovery Plan" to let the
                  deterministic scheduler calculate optimal time slots.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('issues')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
                >
                  View Active Issues ({detectedIssues.length})
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {proposals.map((prop) => {
                  const isApproved = prop.status === 'approved';
                  const isRejected = prop.status === 'rejected';
                  const isApplied = prop.status === 'applied';

                  const badgeClass = isApplied
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : isApproved
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : isRejected
                        ? 'bg-slate-700/40 text-slate-400 border-slate-600'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                  const proposalTypeLabel =
                    prop.proposalType === 'split_task'
                      ? 'Split Task'
                      : prop.proposalType === 'shorten_session'
                        ? 'Shorten Session'
                        : prop.proposalType === 'resolve_conflict'
                          ? 'Resolve Conflict'
                          : prop.proposalType === 'reschedule_session'
                            ? 'Reschedule Session'
                            : 'Schedule Task';

                  return (
                    <div
                      key={prop.id}
                      className={`p-4 rounded-xl bg-slate-900 border transition-colors space-y-3 ${
                        isApproved
                          ? 'border-blue-500/50 bg-blue-950/10'
                          : isApplied
                            ? 'border-emerald-500/40 bg-emerald-950/10 opacity-80'
                            : isRejected
                              ? 'border-slate-800 opacity-60'
                              : 'border-slate-800'
                      }`}
                    >
                      {/* Proposal Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60">
                            {proposalTypeLabel}
                          </span>
                          <h3 className="text-sm font-bold text-white">{prop.title}</h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                            {prop.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Proposal Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {!isApplied && (
                            <>
                              {!isApproved ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveProposal(prop.id)}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors"
                                  title="Approve this recommendation"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveProposal(prop.id)}
                                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approved</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(prop)}
                                className="px-2 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center gap-1 transition-colors"
                                title="Edit day, time, or duration manually"
                              >
                                <Edit2 className="w-3 h-3 text-slate-400" />
                                <span>Edit</span>
                              </button>

                              {!isRejected ? (
                                <button
                                  type="button"
                                  onClick={() => handleRejectProposal(prop.id)}
                                  className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                                  title="Reject proposal"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveProposal(prop.id)}
                                  className="px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200"
                                >
                                  Restore
                                </button>
                              )}
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteProposal(prop.id)}
                            className="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Delete proposal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Current Time vs Proposed Time Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            Current Schedule
                          </span>
                          <p className="text-slate-300">
                            {prop.currentSlot
                              ? `${DAYS_OF_WEEK[prop.currentSlot.dayOfWeek]?.full} at ${minutesToTimeStr(
                                  prop.currentSlot.startMinutes
                                )} (${prop.originalDuration}m)`
                              : 'Unscheduled backlog task'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-blue-500/30 space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#60A5FA]">
                            Proposed Time Slot
                          </span>
                          <p className="font-semibold text-white">
                            {prop.selectedSlot.dateLabel} · {minutesToTimeStr(prop.selectedSlot.startMinutes)} –{' '}
                            {minutesToTimeStr(prop.selectedSlot.endMinutes)} ({prop.proposedDuration}m)
                          </p>
                        </div>
                      </div>

                      {/* Explanation & Ranking Criteria */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          Why this slot was selected
                        </span>
                        <ul className="space-y-1 text-slate-300">
                          {prop.selectedSlot.rankingReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#60A5FA]">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>

                        {prop.tradeOffs && (
                          <p className="text-[11px] text-amber-400/90 pt-1">
                            <strong>Trade-off Note:</strong> {prop.tradeOffs}
                          </p>
                        )}
                      </div>

                      {/* Feasible Alternatives Dropdown Selector */}
                      {prop.alternativeSlots.length > 0 && !isApplied && (
                        <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[11px] text-slate-400">Other Feasible Slots:</span>
                          {prop.alternativeSlots.map((alt, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleSelectAlternativeSlot(prop.id, alt)}
                              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                            >
                              {alt.dateLabel} at {minutesToTimeStr(alt.startMinutes)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANNED VS REALITY EXECUTION CONTEXT */}
        {activeTab === 'execution' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Execution History & Reliability Model
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                BlockFlow strictly distinguishes between an overdue task, a missed session, and a completed
                task. Schedule changes are never manufactured from missing data, and tasks are never marked
                complete merely because scheduled time elapsed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Logged Sessions
                </span>
                <div className="text-2xl font-bold text-white">{sessions.length}</div>
                <p className="text-slate-400">Verified recorded focus blocks</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Completed Focus Sessions
                </span>
                <div className="text-2xl font-bold text-emerald-400">
                  {sessions.filter((s) => s.status === 'completed').length}
                </div>
                <p className="text-slate-400">Sessions marked complete</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Missed / Skipped Sessions
                </span>
                <div className="text-2xl font-bold text-rose-400">
                  {
                    sessions.filter(
                      (s) => s.status === 'skipped' || s.status === 'cancelled'
                    ).length
                  }
                </div>
                <p className="text-slate-400">Eligible for catch-up recovery</p>
              </div>
            </div>

            {/* List of recent sessions */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Session Execution Records
              </h4>
              {sessions.length === 0 ? (
                <p className="text-xs text-slate-500">No session execution entries logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 10).map((sess) => (
                    <div
                      key={sess.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{sess.plannedTitle}</span>
                        <span className="text-slate-400 ml-2">
                          {sess.date} · {sess.plannedDuration}m
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          sess.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL 1: EDIT PROPOSAL TIME MODAL ── */}
      {editingProposal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#3659C9]" />
                Edit Proposed Time: {editingProposal.title}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editValidationError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editValidationError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Day Selector */}
              <div>
                <label className="block text-slate-400 mb-1">Target Day of Week</label>
                <select
                  value={editDayOfWeek}
                  onChange={(e) => {
                    setEditDayOfWeek(parseInt(e.target.value, 10));
                    setEditValidationError(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d.full}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time Selector */}
              <div>
                <label className="block text-slate-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formatMinutesToTimeString(editStartMinutes)}
                  onChange={(e) => {
                    setEditStartMinutes(timeStrToMinutes(e.target.value));
                    setEditValidationError(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              {/* Duration Selector */}
              <div>
                <label className="block text-slate-400 mb-1">Duration (Minutes)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setEditDuration(mins);
                        setEditValidationError(null);
                      }}
                      className={`py-1 rounded text-xs font-medium border transition-colors ${
                        editDuration === mins
                          ? 'bg-[#3659C9] border-[#3659C9] text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedProposal}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3659C9] hover:bg-[#2B47A8] text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: PLANNER CONSTRAINT PREFERENCES MODAL ── */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#3659C9]" />
                Scheduling Preferences
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Availability Window</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Earliest Start:</span>
                    <input
                      type="time"
                      value={formatMinutesToTimeString(config.availabilityStartMinutes)}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          availabilityStartMinutes: timeStrToMinutes(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Latest End:</span>
                    <input
                      type="time"
                      value={formatMinutesToTimeString(config.availabilityEndMinutes)}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          availabilityEndMinutes: timeStrToMinutes(e.target.value),
                        }))
                      }
                      className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Daily Planned Workload (Hours)</label>
                <input
                  type="number"
                  min="4"
                  max="14"
                  value={config.maxDailyPlannedHours}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      maxDailyPlannedHours: Number(e.target.value) || 8,
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Preferred Peak Energy Window</label>
                <select
                  value={config.preferredWindow || 'morning'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      preferredWindow: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="morning">Morning Focus (09:00 AM – 12:00 PM)</option>
                  <option value="afternoon">Afternoon Focus (02:00 PM – 05:00 PM)</option>
                  <option value="evening">Evening Focus (06:00 PM – 09:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Buffer Between Activities (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={config.minBreakBetweenBlocksMinutes}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      minBreakBetweenBlocksMinutes: Number(e.target.value) || 15,
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  savePlannerConfig(config);
                  setShowConfigModal(false);
                  addToast('Saved scheduling preferences.', 'success');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3659C9] hover:bg-[#2B47A8] text-white"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

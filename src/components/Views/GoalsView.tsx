import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { Goal } from '../../types/timetable';
import { loadGoals, saveGoals, normalizeGoal, isSmartOnboardingSeen } from '../../utils/storage';
import { calculateGoalMetrics } from '../../utils/goalEngine';
import { GoalWizardModal } from '../Goals/GoalWizardModal';
import { GoalDetailModal } from '../Goals/GoalDetailModal';
import { PlanGoalScheduleModal } from '../Goals/PlanGoalScheduleModal';
import { SmartOnboardingModal } from '../Goals/SmartOnboardingModal';
import {
  Target,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Archive,
  CalendarPlus,
  PlusCircle,
  Filter,
  BookOpen,
} from 'lucide-react';

import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';

type TabFilter = 'active' | 'scheduled' | 'overdue' | 'completed' | 'archived';

interface GoalsViewProps {
  onNavigate?: (view: NavView) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onNavigate }) => {
  const { currentWeekScheduledBlocks, scheduledBlocks, addToast } = useTimetable();
  const allBlocks = currentWeekScheduledBlocks?.length > 0 ? currentWeekScheduledBlocks : scheduledBlocks || [];

  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('active');

  // Modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [planGoal, setPlanGoal] = useState<Goal | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(0);

  useEffect(() => {
    setGoals(loadGoals());
    if (!isSmartOnboardingSeen()) {
      setOnboardingInitialStep(0);
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleSaveGoal = (newGoal: Goal, planImmediately?: boolean) => {
    const updated = [newGoal, ...goals];
    setGoals(updated);
    saveGoals(updated);
    addToast(`Created SMART Goal: "${newGoal.title}"! 🎯`, 'success');

    if (planImmediately) {
      setPlanGoal(newGoal);
    }
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    saveGoals(updated);
    setSelectedGoal(updatedGoal);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    setGoals(updated);
    saveGoals(updated);
    addToast('Goal removed', 'info');
  };

  const handleQuickIncrement = (e: React.MouseEvent, rawGoal: Goal) => {
    e.stopPropagation();
    const g = normalizeGoal(rawGoal);
    const currentVal = g.smart?.currentValue ?? 0;
    const targetVal = g.smart?.targetValue ?? 10;
    const unitStr = g.smart?.unit ?? 'units';
    const updatedVal = currentVal + 1;
    const isCompleted = updatedVal >= targetVal;

    const updated: Goal = {
      ...g,
      status: isCompleted ? 'completed' : g.status,
      smart: {
        ...g.smart,
        currentValue: updatedVal,
      },
    };

    const newGoals = goals.map((item) => (item.id === g.id ? updated : item));
    setGoals(newGoals);
    saveGoals(newGoals);
    addToast(`Logged +1 ${unitStr} for "${g.title}"`, 'success');
  };

  // Metrics across all goals for top KPI metrics (Memoized)
  const goalsWithMetrics = React.useMemo(() => {
    return goals.map((g) => ({
      goal: g,
      metrics: calculateGoalMetrics(g, allBlocks),
    }));
  }, [goals, allBlocks]);

  const activeGoals = React.useMemo(() => goalsWithMetrics.filter((item) => item.goal.status === 'active'), [goalsWithMetrics]);
  const completedGoals = React.useMemo(() => goalsWithMetrics.filter((item) => item.goal.status === 'completed'), [goalsWithMetrics]);
  const archivedGoals = React.useMemo(() => goalsWithMetrics.filter((item) => item.goal.status === 'archived'), [goalsWithMetrics]);
  const overdueGoals = React.useMemo(() => activeGoals.filter((item) => item.metrics.isOverdue), [activeGoals]);
  const scheduledGoals = React.useMemo(() => activeGoals.filter((item) => item.metrics.plannedHours > 0), [activeGoals]);

  // Filter based on activeTab
  const displayedItems = React.useMemo(() => {
    return goalsWithMetrics.filter((item) => {
      if (activeTab === 'active') return item.goal.status === 'active';
      if (activeTab === 'scheduled') return item.goal.status === 'active' && item.metrics.plannedHours > 0;
      if (activeTab === 'overdue') return item.goal.status === 'active' && item.metrics.isOverdue;
      if (activeTab === 'completed') return item.goal.status === 'completed';
      if (activeTab === 'archived') return item.goal.status === 'archived';
      return true;
    });
  }, [goalsWithMetrics, activeTab]);

  // Aggregate totals
  const totalTargetEffort = React.useMemo(() => activeGoals.reduce((sum, item) => sum + item.metrics.estimatedTotalHours, 0), [activeGoals]);
  const totalCompletedEffort = React.useMemo(() => goalsWithMetrics.reduce((sum, item) => sum + item.metrics.completedHours, 0), [goalsWithMetrics]);
  const totalPlannedEffort = React.useMemo(() => activeGoals.reduce((sum, item) => sum + item.metrics.plannedHours, 0), [activeGoals]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-5 sm:p-8 space-y-5 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      {onNavigate && (
        <PageBreadcrumb
          items={[{ label: 'Goals & Planning' }]}
          onNavigate={onNavigate}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-[#3659C9]" />
            <span>SMART Goals &amp; Planning</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Turn specific ambition into scheduled timetable actions ({activeGoals.length} active goals)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setOnboardingInitialStep(1);
              setIsOnboardingOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            title="Learn how SMART goals work"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#3659C9]" />
            <span>Learn about SMART goals</span>
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-4 py-2 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New SMART Goal</span>
          </button>
        </div>
      </div>

      {/* ── SUMMARY KPI STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Active Goals
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeGoals.length}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">{completedGoals.length} completed all-time</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Planned in Schedule
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalPlannedEffort}h</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">{scheduledGoals.length} goals with timetable slots</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Completed Effort
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalCompletedEffort}h</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">From finished sessions</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
            Target Effort
          </span>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#4F73E3] font-mono">{totalTargetEffort}h</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">Across active goals</p>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Active ({activeGoals.length})
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Planned in Timetable ({scheduledGoals.length})
          </button>

          {overdueGoals.length > 0 && (
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'overdue'
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold'
                  : 'text-amber-700 dark:text-amber-400/80 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10'
              }`}
            >
              Needs Review ({overdueGoals.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'completed'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Completed ({completedGoals.length})
          </button>

          {archivedGoals.length > 0 && (
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'archived'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Archived ({archivedGoals.length})
            </button>
          )}
        </div>
      </div>

      {/* ── GOALS LIST / COMPACT SECTION ── */}
      {displayedItems.length > 0 ? (
        <div className="space-y-4">
          {displayedItems.map(({ goal, metrics }) => {
            const isCompleted = goal.status === 'completed';

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer group flex flex-col gap-4 shadow-sm ${
                  isCompleted ? 'opacity-80' : ''
                }`}
              >
                {/* ── Top Bar: Category, Status & Target Deadline ── */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: goal.color || '#3659C9' }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      {goal.category}
                    </span>

                    {metrics.isOverdue && !isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle size={11} /> Overdue by {metrics.daysOverdue}d
                      </span>
                    )}

                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={13} className="text-slate-500" />
                    <span>Target:</span>
                    <strong className="text-slate-200 font-medium">
                      {new Date(metrics.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                </div>

                {/* ── Middle: Title & Scope Description ── */}
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-slate-100 transition-colors">
                    {goal.title}
                  </h3>
                  {goal.smart?.specificDetails && (
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl line-clamp-2">
                      {goal.smart.specificDetails}
                    </p>
                  )}
                </div>

                {/* ── Progress Section ── */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-slate-300 font-medium">
                      {metrics.naturalProgressSummary}
                    </span>
                    <span className="font-mono font-bold text-white text-xs">
                      {metrics.actualCurrentValue} / {metrics.targetValue} {metrics.unit} ({metrics.progressPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${metrics.progressPct}%`,
                        backgroundColor: isCompleted ? '#10B981' : goal.color || '#3659C9',
                      }}
                    />
                  </div>
                </div>

                {/* ── Bottom Strip: Next Action & Action Buttons ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Next Action & Schedule Commitment */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-1.5 text-slate-300">
                      <Clock size={13} className="text-[#3659C9] shrink-0" />
                      <span className="text-slate-400">Next Action:</span>
                      <strong className="text-white font-medium">{metrics.nextAction}</strong>
                    </div>

                    <span className="text-xs text-slate-500 font-mono">
                      {metrics.plannedHours}h planned · {metrics.remainingHours}h remaining
                    </span>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {!isCompleted && (
                      <button
                        onClick={(e) => handleQuickIncrement(e, goal)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                        title={`Quick log: +1 ${goal.smart?.unit || 'unit'}`}
                      >
                        <PlusCircle size={14} className="text-emerald-400" />
                        <span>+1 {goal.smart?.unit || 'unit'}</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanGoal(goal);
                        }}
                        className="px-3.5 py-1.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CalendarPlus size={14} />
                        <span>Plan in Timetable</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGoal(goal);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto my-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#3659C9]/15 border border-[#3659C9]/30 text-[#3659C9] flex items-center justify-center mx-auto shadow-sm">
            <Target size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {activeTab === 'active' && 'Turn your ambitions into a plan'}
              {activeTab === 'scheduled' && 'No Goals Planned in Timetable'}
              {activeTab === 'overdue' && 'No Overdue Goals — You’re on track!'}
              {activeTab === 'completed' && 'No Completed Goals Yet'}
              {activeTab === 'archived' && 'Archive is Empty'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              SMART turns broad wishes into clear, measurable milestones and reserves focused time slots on your timetable.
            </p>
          </div>

          {/* Guided 3-step pill bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-[#3659C9] uppercase">1. Specific</span>
              <p className="text-xs text-slate-300">Name a clear outcome & countable target.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">2. Realistic</span>
              <p className="text-xs text-slate-300">Estimate study hours & weekly days.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-purple-400 uppercase">3. Schedule</span>
              <p className="text-xs text-slate-300">Place focus sessions in your calendar.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#3659C9] hover:bg-[#2F4EB8] text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={15} /> <span>Create a SMART Goal</span>
            </button>
            <button
              onClick={() => {
                setOnboardingInitialStep(1);
                setIsOnboardingOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <BookOpen size={14} className="text-[#3659C9]" />
              <span>How SMART Works</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SMART ONBOARDING GUIDE MODAL ── */}
      <SmartOnboardingModal
        isOpen={isOnboardingOpen}
        initialStep={onboardingInitialStep}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCreateGoal={() => setIsWizardOpen(true)}
      />

      {/* ── GOAL CREATION WIZARD MODAL ── */}
      <GoalWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSaveGoal={handleSaveGoal}
      />

      {/* ── GOAL DETAIL MODAL ── */}
      <GoalDetailModal
        goal={selectedGoal}
        isOpen={selectedGoal !== null}
        onClose={() => setSelectedGoal(null)}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
      />

      {/* ── PLAN IN SCHEDULE MODAL ── */}
      <PlanGoalScheduleModal
        goal={planGoal}
        isOpen={planGoal !== null}
        onClose={() => setPlanGoal(null)}
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavView } from '../Navigation/Sidebar';
import { PageBreadcrumb } from '../Navigation/PageBreadcrumb';
import { useTimetable } from '../../context/TimetableContext';
import { ScheduledBlock, CompletionStatus, Goal } from '../../types/timetable';
import { TaskInboxItem, Assignment } from '../../types/executionOS';
import { loadTaskInbox, saveTaskInbox } from '../../utils/taskInboxStorage';
import { loadAssignments } from '../../utils/assignmentStorage';
import { loadGoals } from '../../utils/storage';
import { getISOWeekString } from '../../utils/timeUtils';
import { selectTodayBlocks, selectBlockCounts } from '../../utils/dataSelectors';

import { MyDayHeader } from '../MyDay/MyDayHeader';
import { DailyScheduleList } from '../MyDay/DailyScheduleList';
import { DailyTasksList } from '../MyDay/DailyTasksList';
import { DailyAssignmentsList } from '../MyDay/DailyAssignmentsList';
import { DailyGoalsList } from '../MyDay/DailyGoalsList';
import { DailyGoalsCard } from '../DailyGoals/DailyGoalsCard';
import { DailyGoalEditorModal } from '../DailyGoals/DailyGoalEditorModal';
import { PlanMyDayModal } from '../DailyGoals/PlanMyDayModal';
import { EndOfDayFlowModal } from '../Execution/EndOfDayFlowModal';
import { DailyGoal } from '../../types/dailyGoals';
import { loadDailyGoals, saveDailyGoals } from '../../utils/dailyGoalsStorage';
import { AddScheduledBlockModal } from '../MyDay/AddScheduledBlockModal';
import { AddTaskModal } from '../MyDay/AddTaskModal';
import { EditScheduledBlockModal } from '../MyDay/EditScheduledBlockModal';
import { QuickCaptureItem } from '../../types/quickCapture';
import { QuickCaptureModal } from '../QuickCapture/QuickCaptureModal';
import { ConvertCaptureModal } from '../QuickCapture/ConvertCaptureModal';

interface MyDayViewProps {
  onNavigate?: (view: NavView) => void;
  onStartFocusMode?: (target?: {
    title?: string;
    blockId?: string;
    taskId?: string;
    goalId?: string;
    plannedDurationMinutes?: number;
  }) => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  onNavigate,
  onStartFocusMode,
}) => {
  const {
    scheduledBlocks,
    libraryBlocks,
    addScheduledBlock,
    updateScheduledBlock,
    deleteScheduledBlock,
    updateBlockStatus,
    addToast,
  } = useTimetable();

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Tasks, Assignments, Goals state
  const [tasks, setTasks] = useState<TaskInboxItem[]>(() => loadTaskInbox());
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadAssignments());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>(() => loadDailyGoals());

  // Modal states
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [convertingCaptureItem, setConvertingCaptureItem] = useState<QuickCaptureItem | null>(null);
  const [editingBlock, setEditingBlock] = useState<ScheduledBlock | null>(null);
  const [isDailyGoalEditorOpen, setIsDailyGoalEditorOpen] = useState(false);
  const [editingDailyGoal, setEditingDailyGoal] = useState<DailyGoal | null>(null);
  const [isPlanDayOpen, setIsPlanDayOpen] = useState(false);
  const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);

  // Sync tasks, assignments, goals, and daily goals on mount or focus
  useEffect(() => {
    setTasks(loadTaskInbox());
    setAssignments(loadAssignments());
    setGoals(loadGoals());
    setDailyGoals(loadDailyGoals());

    const handleDailyGoalsChange = () => setDailyGoals(loadDailyGoals());
    window.addEventListener('blockflow_daily_goals_updated', handleDailyGoalsChange);
    return () => window.removeEventListener('blockflow_daily_goals_updated', handleDailyGoalsChange);
  }, []);

  // Filter scheduled blocks for the selected date using canonical selector
  const selectedDateBlocks = useMemo(() => {
    return selectTodayBlocks(scheduledBlocks, selectedDate);
  }, [scheduledBlocks, selectedDate]);

  // Workload summary calculations using canonical selector
  const blockStats = useMemo(() => {
    return selectBlockCounts(selectedDateBlocks);
  }, [selectedDateBlocks]);

  const totalScheduledMinutes = blockStats.totalPlannedMinutes;
  const completedBlocksCount = blockStats.completed;

  // Tasks due on selected date or overdue
  const selectedYMD = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const pendingTasksCount = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'archived' &&
        (!t.deadline || t.deadline <= selectedYMD)
    ).length;
  }, [tasks, selectedYMD]);

  const overdueTasksCount = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.status !== 'archived' &&
        t.deadline &&
        t.deadline < selectedYMD
    ).length;
  }, [tasks, selectedYMD]);

  const activeAssignmentsCount = useMemo(() => {
    return assignments.filter(
      (a) => a.status !== 'submitted' && a.status !== 'graded'
    ).length;
  }, [assignments]);

  // ── Handlers ──

  const handleToggleBlockStatus = useCallback(
    (blockId: string, currentStatus?: CompletionStatus) => {
      const isCompleted =
        currentStatus === 'completed' || currentStatus === 'faster';
      const nextStatus: CompletionStatus = isCompleted ? 'scheduled' : 'completed';
      updateBlockStatus(blockId, nextStatus);
      addToast(
        isCompleted ? 'Block marked pending' : 'Block marked completed',
        'success'
      );
    },
    [updateBlockStatus, addToast]
  );

  const handleToggleTaskComplete = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === taskId) {
            const isCompleted = t.status === 'completed';
            return {
              ...t,
              status: (isCompleted ? 'backlog' : 'completed') as TaskInboxItem['status'],
            };
          }
          return t;
        });
        saveTaskInbox(updated);
        return updated;
      });
      addToast('Task updated', 'info');
    },
    [addToast]
  );

  const handleAddTask = useCallback(
    (newTask: TaskInboxItem) => {
      setTasks((prev) => {
        const updated = [newTask, ...prev];
        saveTaskInbox(updated);
        return updated;
      });
      addToast('Task created', 'success');
    },
    [addToast]
  );

  const handleAddBlock = useCallback(
    (blockData: Omit<ScheduledBlock, 'id' | 'weekId'>) => {
      addScheduledBlock(blockData);
      addToast('Block scheduled', 'success');
    },
    [addScheduledBlock, addToast]
  );

  const handleUpdateBlock = useCallback(
    (blockId: string, partial: Partial<ScheduledBlock>) => {
      updateScheduledBlock(blockId, partial);
      addToast('Block updated', 'success');
    },
    [updateScheduledBlock, addToast]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteScheduledBlock(blockId);
      addToast('Block deleted', 'info');
    },
    [deleteScheduledBlock, addToast]
  );

  const handleSaveDailyGoal = useCallback((updatedGoal: DailyGoal) => {
    setDailyGoals((prev) => {
      const exists = prev.some((g) => g.id === updatedGoal.id);
      const next = exists
        ? prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
        : [...prev, updatedGoal];
      saveDailyGoals(next);
      return next;
    });
  }, []);

  const handleUpdateDailyGoalsList = useCallback((updatedList: DailyGoal[]) => {
    setDailyGoals(updatedList);
    saveDailyGoals(updatedList);
  }, []);

  const handleDeleteDailyGoal = useCallback((goalId: string) => {
    setDailyGoals((prev) => {
      const next = prev.filter((g) => g.id !== goalId);
      saveDailyGoals(next);
      return next;
    });
  }, []);

  const handleToggleMustDo = useCallback((goalId: string) => {
    setDailyGoals((prev) => {
      const next = prev.map((g) =>
        g.id === goalId ? { ...g, isMustDo: !g.isMustDo, updatedAt: Date.now() } : g
      );
      saveDailyGoals(next);
      return next;
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 select-none scrollbar-thin">
      {/* ── BREADCRUMB ── */}
      <PageBreadcrumb items={[{ label: 'My Day' }]} onNavigate={onNavigate} />

      {/* ── SECTION A: DAILY HEADER ── */}
      <MyDayHeader
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        totalScheduledMinutes={totalScheduledMinutes}
        completedBlocksCount={completedBlocksCount}
        totalBlocksCount={selectedDateBlocks.length}
        tasksCount={pendingTasksCount}
        overdueTasksCount={overdueTasksCount}
        activeAssignmentsCount={activeAssignmentsCount}
        onOpenAddBlock={() => setIsAddBlockOpen(true)}
        onOpenAddTask={() => setIsAddTaskOpen(true)}
        onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
        onStartFocusMode={onStartFocusMode}
        onOpenPlanDay={() => setIsPlanDayOpen(true)}
        onOpenEndOfDay={() => setIsEndOfDayOpen(true)}
      />

      {/* ── MAIN 2-COLUMN COMMAND CENTRE WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Schedule (Chronological) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <DailyScheduleList
            blocks={selectedDateBlocks}
            selectedDate={selectedDate}
            onToggleStatus={handleToggleBlockStatus}
            onEditBlock={(block) => setEditingBlock(block)}
            onStartFocus={
              onStartFocusMode
                ? (block) =>
                    onStartFocusMode({
                      title: block.title,
                      blockId: block.id,
                      plannedDurationMinutes: block.duration,
                      goalId: block.goalId,
                    })
                : undefined
            }
            onOpenAddBlock={() => setIsAddBlockOpen(true)}
            onNavigateToCalendar={
              onNavigate ? () => onNavigate('calendar') : undefined
            }
          />
        </div>

        {/* Right Column: Priority Tasks, Assignments & Goals */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Today's Goals (Daily Goals & Reflection feature) */}
          <DailyGoalsCard
            dateStr={selectedYMD}
            goals={dailyGoals}
            scheduledBlocks={selectedDateBlocks}
            onSaveGoal={handleSaveDailyGoal}
            onUpdateGoalsList={handleUpdateDailyGoalsList}
            onDeleteGoal={handleDeleteDailyGoal}
            onOpenEditor={(g) => {
              setEditingDailyGoal(g || null);
              setIsDailyGoalEditorOpen(true);
            }}
            onOpenPlanDay={() => setIsPlanDayOpen(true)}
            onStartFocus={
              onStartFocusMode
                ? (goal) =>
                    onStartFocusMode({
                      title: goal.title,
                      goalId: goal.id,
                      plannedDurationMinutes: goal.estimateMin || 25,
                    })
                : undefined
            }
            addToast={addToast}
          />

          {/* Priority Tasks */}
          <DailyTasksList
            tasks={tasks}
            selectedDate={selectedDate}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onNavigateToInbox={
              onNavigate ? () => onNavigate('task-inbox') : undefined
            }
            onStartFocus={
              onStartFocusMode
                ? (task) =>
                    onStartFocusMode({
                      title: task.title,
                      taskId: task.id,
                      plannedDurationMinutes: task.estimatedDuration ?? task.estimatedMinutes,
                    })
                : undefined
            }
          />

          {/* Assignments & Deadlines */}
          <DailyAssignmentsList
            assignments={assignments}
            onNavigateToAssignments={
              onNavigate ? () => onNavigate('assignments') : undefined
            }
          />

          {/* Active SMART Goals & Progress */}
          <DailyGoalsList
            goals={goals}
            scheduledBlocks={scheduledBlocks}
            onNavigateToGoals={
              onNavigate ? () => onNavigate('goals') : undefined
            }
          />
        </div>
      </div>

      {/* ── MODALS ── */}
      {isAddBlockOpen && (
        <AddScheduledBlockModal
          isOpen={isAddBlockOpen}
          onClose={() => setIsAddBlockOpen(false)}
          selectedDate={selectedDate}
          libraryBlocks={libraryBlocks}
          goals={goals}
          onAddBlock={handleAddBlock}
        />
      )}

      {isAddTaskOpen && (
        <AddTaskModal
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          selectedDate={selectedDate}
          goals={goals}
          onAddTask={handleAddTask}
        />
      )}

      {editingBlock && (
        <EditScheduledBlockModal
          isOpen={Boolean(editingBlock)}
          onClose={() => setEditingBlock(null)}
          block={editingBlock}
          onSave={handleUpdateBlock}
          onDelete={handleDeleteBlock}
          onStartFocus={onStartFocusMode ? () => onStartFocusMode() : undefined}
        />
      )}

      {/* Quick Capture Modal */}
      {isQuickCaptureOpen && (
        <QuickCaptureModal
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
          onSaved={() => {
            setTasks(loadTaskInbox());
            addToast('Saved to Universal Inbox', 'success');
          }}
          onSaveAndConvert={(item) => {
            setConvertingCaptureItem(item);
          }}
        />
      )}

      {/* Convert Capture Modal */}
      {convertingCaptureItem && (
        <ConvertCaptureModal
          isOpen={Boolean(convertingCaptureItem)}
          onClose={() => setConvertingCaptureItem(null)}
          item={convertingCaptureItem}
          onConverted={() => {
            setTasks(loadTaskInbox());
            setGoals(loadGoals());
          }}
        />
      )}

      {/* Daily Goal Editor Modal */}
      {isDailyGoalEditorOpen && (
        <DailyGoalEditorModal
          isOpen={isDailyGoalEditorOpen}
          onClose={() => {
            setIsDailyGoalEditorOpen(false);
            setEditingDailyGoal(null);
          }}
          goal={editingDailyGoal}
          dateStr={selectedYMD}
          scheduledBlocks={selectedDateBlocks}
          existingMustDoCount={dailyGoals.filter((g) => g.date === selectedYMD && g.isMustDo).length}
          onSave={handleSaveDailyGoal}
          onDelete={handleDeleteDailyGoal}
        />
      )}

      {/* Plan My Day Modal */}
      {isPlanDayOpen && (
        <PlanMyDayModal
          isOpen={isPlanDayOpen}
          onClose={() => setIsPlanDayOpen(false)}
          dateStr={selectedYMD}
          goals={dailyGoals}
          scheduledBlocks={selectedDateBlocks}
          onToggleMustDo={handleToggleMustDo}
          onOpenCreateGoal={() => {
            setEditingDailyGoal(null);
            setIsDailyGoalEditorOpen(true);
          }}
          onCompletePlan={() => {
            addToast('Plan confirmed! Have a focused, productive day 🚀', 'success');
          }}
        />
      )}

      {/* End My Day Reflection Modal */}
      {isEndOfDayOpen && (
        <EndOfDayFlowModal
          isOpen={isEndOfDayOpen}
          onClose={() => setIsEndOfDayOpen(false)}
          dateStr={selectedYMD}
        />
      )}
    </div>
  );
};

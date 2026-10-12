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

import { MyDayHeader } from '../MyDay/MyDayHeader';
import { DailyScheduleList } from '../MyDay/DailyScheduleList';
import { DailyTasksList } from '../MyDay/DailyTasksList';
import { DailyAssignmentsList } from '../MyDay/DailyAssignmentsList';
import { DailyGoalsList } from '../MyDay/DailyGoalsList';
import { AddScheduledBlockModal } from '../MyDay/AddScheduledBlockModal';
import { AddTaskModal } from '../MyDay/AddTaskModal';
import { EditScheduledBlockModal } from '../MyDay/EditScheduledBlockModal';
import { QuickCaptureItem } from '../../types/quickCapture';
import { QuickCaptureModal } from '../QuickCapture/QuickCaptureModal';
import { ConvertCaptureModal } from '../QuickCapture/ConvertCaptureModal';

interface MyDayViewProps {
  onNavigate?: (view: NavView) => void;
  onStartFocusMode?: () => void;
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

  // Modal states
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [convertingCaptureItem, setConvertingCaptureItem] = useState<QuickCaptureItem | null>(null);
  const [editingBlock, setEditingBlock] = useState<ScheduledBlock | null>(null);

  // Sync tasks, assignments, and goals on mount or focus
  useEffect(() => {
    setTasks(loadTaskInbox());
    setAssignments(loadAssignments());
    setGoals(loadGoals());
  }, []);

  // Filter scheduled blocks for the selected date
  const selectedDateBlocks = useMemo(() => {
    const weekId = getISOWeekString(selectedDate);
    const dayOfWeek = (selectedDate.getDay() + 6) % 7;
    return (scheduledBlocks || []).filter(
      (b) => b && b.weekId === weekId && b.dayOfWeek === dayOfWeek
    );
  }, [scheduledBlocks, selectedDate]);

  // Workload summary calculations
  const totalScheduledMinutes = useMemo(() => {
    return selectedDateBlocks.reduce((acc, b) => acc + (b.duration || 0), 0);
  }, [selectedDateBlocks]);

  const completedBlocksCount = useMemo(() => {
    return selectedDateBlocks.filter(
      (b) => b.status === 'completed' || b.status === 'faster'
    ).length;
  }, [selectedDateBlocks]);

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
            onStartFocus={onStartFocusMode ? () => onStartFocusMode() : undefined}
            onOpenAddBlock={() => setIsAddBlockOpen(true)}
            onNavigateToCalendar={
              onNavigate ? () => onNavigate('calendar') : undefined
            }
          />
        </div>

        {/* Right Column: Priority Tasks, Assignments & SMART Goals */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Priority Tasks */}
          <DailyTasksList
            tasks={tasks}
            selectedDate={selectedDate}
            onToggleTaskComplete={handleToggleTaskComplete}
            onOpenAddTask={() => setIsAddTaskOpen(true)}
            onNavigateToInbox={
              onNavigate ? () => onNavigate('task-inbox') : undefined
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
    </div>
  );
};

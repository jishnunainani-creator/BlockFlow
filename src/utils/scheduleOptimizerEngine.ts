import { ScheduledBlock } from '../types/timetable';
import { EnergyProfile, ScheduleOptimization } from '../types/executionOS';

export function optimizeTodaySchedule(
  blocks: ScheduledBlock[],
  energy: EnergyProfile
): ScheduleOptimization[] {
  const optimizations: ScheduleOptimization[] = [];
  
  // Basic optimization logic as placeholder
  if (blocks.length > 4) {
    optimizations.push({
      id: 'opt_1',
      title: 'Schedule too dense',
      description: 'Consider adding breaks between heavy tasks.',
      impact: 'Medium',
      type: 'break'
    });
  }
  
  return optimizations;
}

export function generateAssignmentStudyPlan(
  title: string,
  dueDate: string,
  estimatedHours: number
): { date: string; durationMinutes: number; title: string }[] {
  const plan = [];
  const sessions = Math.ceil(estimatedHours / 2);
  const currentDate = new Date();
  
  for (let i = 0; i < sessions; i++) {
    plan.push({
      date: currentDate.toISOString().split('T')[0],
      durationMinutes: 120,
      title: `Study session ${i + 1} for ${title}`
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return plan;
}

export function findSmartRescheduleSlot(
  block: ScheduledBlock,
  existingBlocks: ScheduledBlock[],
  option: 'tomorrow' | 'weekend' | 'ai'
): { dayOfWeek: number; startMinutes: number } {
  // Simple smart logic for finding a slot
  let dayOfWeek = block.dayOfWeek;
  const startMinutes = 540; // 9:00 AM

  if (option === 'tomorrow') {
    dayOfWeek = (dayOfWeek + 1) % 7;
  } else if (option === 'weekend') {
    dayOfWeek = 6; // Saturday
  }

  return { dayOfWeek, startMinutes };
}

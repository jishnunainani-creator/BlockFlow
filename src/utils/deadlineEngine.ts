import { TaskInboxItem, Assignment } from '../types/executionOS';
import { ScheduledBlock } from '../types/timetable';

export type DeadlineRiskLevel = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';

export interface DeadlineRiskResult {
  riskLevel: DeadlineRiskLevel;
  badgeLabel: string;
  badgeColorClass: string;
  requiredHours: number;
  daysRemaining: number;
  availableFreeHours: number;
  explanation: string;
}

export function calculateDeadlineRisk(
  item: { title: string; deadline?: string; dueDate?: string; estimatedDuration?: number; estimatedHours?: number },
  blocks: ScheduledBlock[] = []
): DeadlineRiskResult {
  const deadlineStr = item.deadline || item.dueDate;
  const durationMins = item.estimatedDuration || (item.estimatedHours ? item.estimatedHours * 60 : 60);
  const requiredHours = Math.round((durationMins / 60) * 10) / 10;

  if (!deadlineStr) {
    return {
      riskLevel: 'ON_TRACK',
      badgeLabel: '🟢 On Track',
      badgeColorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      requiredHours,
      daysRemaining: 30,
      availableFreeHours: 100,
      explanation: 'No fixed deadline constraint.',
    };
  }

  const targetTime = new Date(deadlineStr).getTime();
  const nowTime = new Date().getTime();
  const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, diffDays);

  // Available free hours before deadline (assuming 8 hrs/day free capacity)
  const availableFreeHours = Math.max(1, daysRemaining * 8);

  const loadRatio = requiredHours / availableFreeHours;

  let riskLevel: DeadlineRiskLevel = 'ON_TRACK';
  let badgeLabel = '🟢 On Track';
  let badgeColorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let explanation = `Healthy buffer: ${requiredHours}h required before ${daysRemaining} days remaining (${availableFreeHours}h free time).`;

  if (daysRemaining <= 1 || loadRatio > 0.9) {
    riskLevel = 'CRITICAL';
    badgeLabel = '🔴 Critical Risk';
    badgeColorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    explanation = `High Urgency: Requires ${requiredHours}h with only ${daysRemaining} days remaining before deadline.`;
  } else if (daysRemaining <= 3 || loadRatio > 0.6) {
    riskLevel = 'AT_RISK';
    badgeLabel = '🟡 At Risk';
    badgeColorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    explanation = `Tighter schedule: ${requiredHours}h required with ${daysRemaining} days remaining before deadline.`;
  }

  return {
    riskLevel,
    badgeLabel,
    badgeColorClass,
    requiredHours,
    daysRemaining,
    availableFreeHours,
    explanation,
  };
}

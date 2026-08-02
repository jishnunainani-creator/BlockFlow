import { TaskInboxItem, PersonalRule } from '../types/executionOS';
import { getUserScopedKey } from './userScope';

const TASK_INBOX_KEY = 'blockflow_task_inbox_v1';
const PERSONAL_RULES_KEY = 'blockflow_personal_rules_v1';

export const DEFAULT_PERSONAL_RULES: PersonalRule[] = [
  {
    id: 'rule-no-work-after-10pm',
    title: 'No Heavy Work After 10:00 PM',
    ruleType: 'no_work_after_time',
    priority: 'strict',
    timeValue: 1320, // 22:00 / 10 PM
    description: 'Prevent scheduling high-priority or heavy study sessions after 10:00 PM to ensure sleep quality.',
    isActive: true,
  },
  {
    id: 'rule-min-15m-break',
    title: 'At Least 15-Minute Recovery Break',
    ruleType: 'min_break_between_blocks',
    priority: 'preference',
    durationValue: 15,
    description: 'Require a 15-minute rest interval after 90+ minute focus sessions.',
    isActive: true,
  },
  {
    id: 'rule-max-6h-daily-focus',
    title: 'Max 6 Hours High-Priority Work / Day',
    ruleType: 'max_daily_hours',
    priority: 'preference',
    hoursValue: 6,
    description: 'Cap maximum planned high-priority focus time to 6 hours per day to prevent burnout.',
    isActive: true,
  },
];

export function loadTaskInbox(): TaskInboxItem[] {
  try {
    const key = getUserScopedKey(TASK_INBOX_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load task inbox from storage', e);
  }
  return [];
}

export function saveTaskInbox(tasks: TaskInboxItem[]): void {
  try {
    const key = getUserScopedKey(TASK_INBOX_KEY);
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save task inbox to storage', e);
  }
}

export function loadPersonalRules(): PersonalRule[] {
  try {
    const key = getUserScopedKey(PERSONAL_RULES_KEY);
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load personal rules from storage', e);
  }
  return DEFAULT_PERSONAL_RULES;
}

export function savePersonalRules(rules: PersonalRule[]): void {
  try {
    const key = getUserScopedKey(PERSONAL_RULES_KEY);
    localStorage.setItem(key, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save personal rules to storage', e);
  }
}

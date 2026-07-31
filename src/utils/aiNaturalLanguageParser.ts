import { ScheduledBlock, Priority } from '../types/timetable';
import { DAYS_OF_WEEK } from './timeUtils';

export interface ParsedScheduleResult {
  title: string;
  dayOfWeek: number; // 0..6
  startMinutes: number; // 0..1440
  duration: number; // in minutes
  priority: Priority;
  category: string;
  description?: string;
  hasConflict: boolean;
  conflictMessage?: string;
  suggestedStartMinutes?: number;
}

export function parseNaturalLanguageSchedule(
  input: string,
  existingBlocks: ScheduledBlock[] = []
): ParsedScheduleResult {
  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. Detect Day of Week
  let dayOfWeek = (new Date().getDay() + 6) % 7; // Default today (0=Mon)

  if (lower.includes('tomorrow')) {
    dayOfWeek = (dayOfWeek + 1) % 7;
  } else if (lower.includes('monday') || lower.includes('mon')) {
    dayOfWeek = 0;
  } else if (lower.includes('tuesday') || lower.includes('tue')) {
    dayOfWeek = 1;
  } else if (lower.includes('wednesday') || lower.includes('wed')) {
    dayOfWeek = 2;
  } else if (lower.includes('thursday') || lower.includes('thu')) {
    dayOfWeek = 3;
  } else if (lower.includes('friday') || lower.includes('fri')) {
    dayOfWeek = 4;
  } else if (lower.includes('saturday') || lower.includes('sat')) {
    dayOfWeek = 5;
  } else if (lower.includes('sunday') || lower.includes('sun')) {
    dayOfWeek = 6;
  }

  // 2. Detect Start Time & Duration
  let startMinutes = 540; // Default 09:00 AM
  let duration = 60; // Default 60 min

  if (lower.includes('afternoon') || lower.includes('after lunch')) {
    startMinutes = 840; // 02:00 PM
  } else if (lower.includes('tonight') || lower.includes('evening') || lower.includes('before dinner')) {
    startMinutes = 1200; // 08:00 PM
  } else if (lower.includes('morning')) {
    startMinutes = 540; // 09:00 AM
  }

  // Time matching regex like "9 to 10:30", "from 6 to 7 PM", "9:00 - 10:30"
  const timeRangeMatch = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeRangeMatch) {
    let startH = parseInt(timeRangeMatch[1], 10);
    let startM = parseInt(timeRangeMatch[2] || '0', 10);
    const startAmPm = (timeRangeMatch[3] || '').toLowerCase();

    let endH = parseInt(timeRangeMatch[4], 10);
    let endM = parseInt(timeRangeMatch[5] || '0', 10);
    const endAmPm = (timeRangeMatch[6] || '').toLowerCase();

    if (startAmPm === 'pm' && startH < 12) startH += 12;
    if (endAmPm === 'pm' && endH < 12) endH += 12;

    // Handle relative 6 to 7 PM where PM only specified at end
    if (endAmPm === 'pm' && !startAmPm && startH < 12) {
      startH += 12;
    }

    startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes > startMinutes) {
      duration = endMinutes - startMinutes;
    }
  }

  // Duration explicit matching: "for 90 minutes", "for 2 hours"
  const durationMatch = clean.match(/for\s*(\d+)\s*(minute|min|hour|hr)s?/i);
  if (durationMatch) {
    const val = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      duration = val * 60;
    } else {
      duration = val;
    }
  }

  // 3. Detect Priority & Category
  let priority: Priority = 'medium';
  if (lower.includes('high') || lower.includes('important') || lower.includes('urgent')) {
    priority = 'high';
  } else if (lower.includes('low')) {
    priority = 'low';
  }

  let category = 'General';
  if (lower.includes('dsa') || lower.includes('study') || lower.includes('exam') || lower.includes('reading')) {
    category = 'Study';
  } else if (lower.includes('internship') || lower.includes('work') || lower.includes('api')) {
    category = 'Work';
  } else if (lower.includes('gym') || lower.includes('workout') || lower.includes('exercise')) {
    category = 'Health';
  }

  // 4. Extract Activity Title
  let title = clean
    .replace(/schedule|book|study|workout|gym/i, '')
    .replace(/tomorrow|today|tonight|morning|evening|afternoon/gi, '')
    .replace(/from\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '')
    .replace(/for\s*\d+\s*(?:minutes|mins|hours|hrs)/gi, '')
    .replace(/priority\s*(high|medium|low)/gi, '')
    .trim();

  if (!title || title.length < 2) {
    if (category === 'Health') title = 'Gym Workout';
    else if (category === 'Study') title = 'Study Session';
    else title = 'Scheduled Activity';
  }

  // Capitalize title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // 5. Conflict Engine Check
  const start = startMinutes;
  const end = startMinutes + duration;

  const overlapping = existingBlocks.find((b) => {
    if (b.dayOfWeek !== dayOfWeek) return false;
    const bStart = b.startMinutes;
    const bEnd = b.startMinutes + b.duration;
    return Math.max(start, bStart) < Math.min(end, bEnd);
  });

  const hasConflict = !!overlapping;
  let conflictMessage: string | undefined;
  let suggestedStartMinutes: number | undefined;

  if (overlapping) {
    conflictMessage = `Conflict detected: You already have "${overlapping.title}" scheduled at that time.`;
    suggestedStartMinutes = overlapping.startMinutes + overlapping.duration + 15; // 15m buffer after
  }

  return {
    title,
    dayOfWeek,
    startMinutes,
    duration,
    priority,
    category,
    description: `AI Scheduled from natural input: "${input}"`,
    hasConflict,
    conflictMessage,
    suggestedStartMinutes,
  };
}

export function parseTimetableScheduleText(text: string): Omit<ScheduledBlock, 'id' | 'weekId'>[] {
  const lines = text.split('\n');
  const results: Omit<ScheduledBlock, 'id' | 'weekId'>[] = [];

  let currentDay = 0; // Default Mon

  lines.forEach((line) => {
    const l = line.trim();
    if (!l) return;

    const lower = l.toLowerCase();
    if (lower.startsWith('monday')) currentDay = 0;
    else if (lower.startsWith('tuesday')) currentDay = 1;
    else if (lower.startsWith('wednesday')) currentDay = 2;
    else if (lower.startsWith('thursday')) currentDay = 3;
    else if (lower.startsWith('friday')) currentDay = 4;
    else if (lower.startsWith('saturday')) currentDay = 5;
    else if (lower.startsWith('sunday')) currentDay = 6;

    // Line matching format: "9:00-10:00 Data Structures" or "14:00 - 16:00 DBMS"
    const match = l.match(/(\d{1,2})(?::(\d{2}))?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s+(.+)/i);
    if (match) {
      let startH = parseInt(match[1], 10);
      let startM = parseInt(match[2] || '0', 10);
      let endH = parseInt(match[3], 10);
      let endM = parseInt(match[4] || '0', 10);
      const title = match[5].trim();

      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const duration = endMin > startMin ? endMin - startMin : 60;

      results.push({
        blockId: `imp-${Date.now()}-${Math.random().toString().slice(2, 6)}`,
        title,
        description: 'Imported from timetable text',
        color: '#6366F1',
        priority: 'medium',
        icon: 'book-open',
        dayOfWeek: currentDay,
        startMinutes: startMin,
        duration,
        status: 'not_started',
      });
    }
  });

  return results;
}

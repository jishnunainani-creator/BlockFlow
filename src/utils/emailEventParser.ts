import { ScheduledBlock, Priority } from '../types/timetable';
import { RawGmailMessage } from '../services/googleWorkspaceService';
import { minutesToTimeStr, timeStrToMinutes } from './timeUtils';

export interface ExtractedEmailEvent {
  id: string;
  emailId: string;
  emailSubject: string;
  emailFrom: string;
  emailDate: string;
  title: string;
  dayOfWeek: number; // 0=Mon ... 6=Sun
  targetDate?: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  duration: number; // in minutes
  category: string;
  priority: Priority;
  color: string;
  location?: string;
  sourceType: 'ics' | 'llm' | 'heuristic';
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Parses iCalendar (.ics) format VEVENT block
 */
export function parseIcsContent(icsString: string): Partial<ExtractedEmailEvent> | null {
  if (!icsString || !icsString.includes('BEGIN:VEVENT')) {
    return null;
  }

  try {
    const lines = icsString.split(/\r\n|\n|\r/);
    let summary = '';
    let location = '';
    let description = '';
    let dtstartRaw = '';
    let dtendRaw = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // Handle folded lines starting with space or tab
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].substring(1);
        i++;
      }

      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).trim();
      } else if (line.startsWith('LOCATION:')) {
        location = line.substring(9).trim();
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12).trim();
      } else if (line.startsWith('DTSTART')) {
        const parts = line.split(':');
        dtstartRaw = parts[parts.length - 1].trim();
      } else if (line.startsWith('DTEND')) {
        const parts = line.split(':');
        dtendRaw = parts[parts.length - 1].trim();
      }
    }

    if (!summary && !dtstartRaw) return null;

    // Parse DTSTART (e.g., 20261125T090000Z or 20261125T090000 or 20261125)
    let year = 0, month = 0, day = 0, hour = 9, minute = 0;
    if (dtstartRaw.length >= 8) {
      year = parseInt(dtstartRaw.substring(0, 4), 10);
      month = parseInt(dtstartRaw.substring(4, 6), 10) - 1;
      day = parseInt(dtstartRaw.substring(6, 8), 10);
    }

    if (dtstartRaw.includes('T')) {
      const timePart = dtstartRaw.split('T')[1];
      if (timePart.length >= 4) {
        hour = parseInt(timePart.substring(0, 2), 10);
        minute = parseInt(timePart.substring(2, 4), 10);
      }
    }

    // Parse DTEND if available to calculate duration
    let duration = 60;
    if (dtendRaw && dtendRaw.includes('T')) {
      const endPart = dtendRaw.split('T')[1];
      if (endPart.length >= 4) {
        const endHour = parseInt(endPart.substring(0, 2), 10);
        const endMinute = parseInt(endPart.substring(2, 4), 10);
        const diff = (endHour * 60 + endMinute) - (hour * 60 + minute);
        if (diff > 0 && diff <= 480) {
          duration = diff;
        }
      }
    }

    const startDate = year > 0 ? new Date(year, month, day) : new Date();
    // Monday = 0, Sunday = 6 in BlockFlow
    const dayOfWeek = (startDate.getDay() + 6) % 7;
    const targetDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    return {
      title: summary || 'Imported Calendar Event',
      dayOfWeek,
      targetDate,
      startTime,
      duration,
      location: location || undefined,
      notes: description || undefined,
      sourceType: 'ics',
      confidence: 'high',
      category: 'Meeting',
      priority: 'medium',
      color: 'indigo',
    };
  } catch (err) {
    console.warn('Error parsing ICS content:', err);
    return null;
  }
}

/**
 * Heuristically extracts event schedule details from email subject and body
 */
export function extractEventFromEmailText(
  subject: string,
  bodyText: string
): Partial<ExtractedEmailEvent> | null {
  const combined = `${subject} ${bodyText}`.toLowerCase();

  // 1. Detect Day of Week
  let dayOfWeek = (new Date().getDay() + 6) % 7; // default today
  let dayFound = false;

  const daysMap: [string[], number][] = [
    [['monday', 'mon'], 0],
    [['tuesday', 'tue'], 1],
    [['wednesday', 'wed'], 2],
    [['thursday', 'thu'], 3],
    [['friday', 'fri'], 4],
    [['saturday', 'sat'], 5],
    [['sunday', 'sun'], 6],
  ];

  for (const [tokens, d] of daysMap) {
    if (tokens.some((token) => combined.includes(token))) {
      dayOfWeek = d;
      dayFound = true;
      break;
    }
  }

  if (!dayFound && combined.includes('tomorrow')) {
    dayOfWeek = (dayOfWeek + 1) % 7;
    dayFound = true;
  }

  // 2. Detect Times: e.g. "10:00 to 11:30", "14:00 - 15:30", "10:00am - 11:30am", "4pm to 5pm", "from 16:00 to 17:00"
  let startMinutes = 540; // 09:00 default
  let duration = 60;
  let timeFound = false;

  // Pattern 1: 24h or 12h range: "14:00 to 15:30" or "10:00 - 11:30" or "10:00am - 11:30am"
  const rangeRegex = /(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|until)\s*(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
  const rangeMatch = combined.match(rangeRegex);

  const parseTimeToken = (token: string): number | null => {
    const cleanToken = token.trim().toLowerCase();
    const isPm = cleanToken.includes('pm');
    const isAm = cleanToken.includes('am');
    const timeOnly = cleanToken.replace(/am|pm/g, '').trim();
    const parts = timeOnly.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isNaN(h)) return null;

    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;

    return h * 60 + m;
  };

  if (rangeMatch) {
    const tStart = parseTimeToken(rangeMatch[1]);
    const tEnd = parseTimeToken(rangeMatch[2]);
    if (tStart !== null) {
      startMinutes = tStart;
      timeFound = true;
      if (tEnd !== null && tEnd > tStart) {
        duration = tEnd - tStart;
      }
    }
  } else {
    // Single time pattern: "at 14:00", "at 4pm", "from 10:00"
    const singleRegex = /(?:at|from)\s*(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    const singleMatch = combined.match(singleRegex);
    if (singleMatch) {
      const t = parseTimeToken(singleMatch[1]);
      if (t !== null) {
        startMinutes = t;
        timeFound = true;
      }
    }
  }

  // 3. Determine Category, Priority, and Color based on Academic Keywords
  let category = 'Academic';
  let priority: Priority = 'medium';
  let color = 'indigo';

  if (combined.includes('exam') || combined.includes('midterm') || combined.includes('endsem') || combined.includes('quiz') || combined.includes('test')) {
    category = 'Exam';
    priority = 'high';
    color = 'rose';
  } else if (combined.includes('assignment') || combined.includes('submission') || combined.includes('deadline') || combined.includes('homework')) {
    category = 'Assignment';
    priority = 'high';
    color = 'amber';
  } else if (combined.includes('office hour') || combined.includes('consultation') || combined.includes('meeting') || combined.includes('sync')) {
    category = 'Meeting';
    priority = 'medium';
    color = 'emerald';
  } else if (combined.includes('lecture') || combined.includes('class') || combined.includes('talk') || combined.includes('seminar') || combined.includes('workshop')) {
    category = 'Lecture';
    priority = 'medium';
    color = 'indigo';
  }

  // Clean Title from Subject
  const cleanTitle = subject
    .replace(/^(re:|fwd:|fw:|calendar invite:)\s*/i, '')
    .trim() || 'Imported Academic Event';

  return {
    title: cleanTitle,
    dayOfWeek,
    startTime: minutesToTimeStr(startMinutes),
    duration,
    category,
    priority,
    color,
    sourceType: 'heuristic',
    confidence: dayFound && timeFound ? 'high' : dayFound || timeFound ? 'medium' : 'low',
  };
}

/**
 * Extracts calendar event from a RawGmailMessage (trying ICS first, then text heuristics)
 */
export function extractEventFromGmailMessage(msg: RawGmailMessage): ExtractedEmailEvent {
  // 1. Try ICS format if present
  if (msg.icsContent) {
    const icsParsed = parseIcsContent(msg.icsContent);
    if (icsParsed && icsParsed.title && icsParsed.startTime) {
      return {
        id: `event_${msg.id}`,
        emailId: msg.id,
        emailSubject: msg.subject,
        emailFrom: msg.from,
        emailDate: msg.dateStr,
        title: icsParsed.title,
        dayOfWeek: icsParsed.dayOfWeek ?? 0,
        targetDate: icsParsed.targetDate,
        startTime: icsParsed.startTime,
        duration: icsParsed.duration ?? 60,
        category: icsParsed.category || 'Meeting',
        priority: icsParsed.priority || 'medium',
        color: icsParsed.color || 'indigo',
        location: icsParsed.location,
        sourceType: 'ics',
        confidence: 'high',
        notes: `Imported from calendar invite: ${msg.subject}`,
      };
    }
  }

  // 2. Try text extraction heuristics
  const textParsed = extractEventFromEmailText(msg.subject, msg.bodyText);
  return {
    id: `event_${msg.id}`,
    emailId: msg.id,
    emailSubject: msg.subject,
    emailFrom: msg.from,
    emailDate: msg.dateStr,
    title: textParsed?.title || msg.subject,
    dayOfWeek: textParsed?.dayOfWeek ?? 0,
    startTime: textParsed?.startTime || '09:00',
    duration: textParsed?.duration || 60,
    category: textParsed?.category || 'Academic',
    priority: textParsed?.priority || 'medium',
    color: textParsed?.color || 'indigo',
    sourceType: 'heuristic',
    confidence: textParsed?.confidence || 'medium',
    notes: `Imported from Gmail: ${msg.subject}`,
  };
}

/**
 * Converts an ExtractedEmailEvent into a native BlockFlow ScheduledBlock
 */
export function convertExtractedEventToScheduledBlock(
  event: ExtractedEmailEvent,
  weekId: string
): ScheduledBlock {
  const startMinutes = timeStrToMinutes(event.startTime);
  return {
    id: `sb_gmail_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    blockId: `lib_gmail_${event.category.toLowerCase()}`,
    title: event.title,
    description: event.notes || `Imported from Gmail (${event.emailFrom})`,
    dayOfWeek: event.dayOfWeek,
    startMinutes,
    duration: event.duration,
    color: event.color,
    priority: event.priority,
    icon: event.sourceType === 'ics' ? 'calendar' : 'mail',
    status: 'scheduled',
    weekId,
  };
}

/**
 * Checks if the extracted event conflicts with any existing block in the timetable
 */
export function checkEventConflict(
  event: ExtractedEmailEvent,
  existingBlocks: ScheduledBlock[]
): { hasConflict: boolean; conflictingBlock?: ScheduledBlock } {
  const eventStart = timeStrToMinutes(event.startTime);
  const eventEnd = eventStart + event.duration;

  const conflict = existingBlocks.find((b) => {
    if (b.dayOfWeek !== event.dayOfWeek) return false;
    const blockStart = b.startMinutes;
    const blockEnd = blockStart + b.duration;
    return eventStart < blockEnd && eventEnd > blockStart;
  });

  return {
    hasConflict: Boolean(conflict),
    conflictingBlock: conflict,
  };
}

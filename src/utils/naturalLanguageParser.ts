import { ConvertedEntityType, ExtractedDetails } from '../types/quickCapture';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Format a Date object to local YYYY-MM-DD string
 */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fast, deterministic client-side parser to extract dates, times, durations,
 * priorities, and suggested entity types from natural language inputs.
 * Runs completely locally with zero network or AI dependencies.
 */
export function parseNaturalLanguageInput(rawText: string): ExtractedDetails {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const matchedKeywords: string[] = [];

  const now = new Date();
  let suggestedDate: string | undefined = undefined;
  let suggestedTimeMinutes: number | undefined = undefined;
  let suggestedDuration: number | undefined = undefined;
  let suggestedPriority: 'high' | 'medium' | 'low' | undefined = undefined;
  let suggestedType: ConvertedEntityType = 'task';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. DATE PARSING
  // Match "today"
  if (/\btoday\b/i.test(lower)) {
    suggestedDate = toLocalDateString(now);
    matchedKeywords.push('today');
  }
  // Match "tomorrow"
  else if (/\btomorrow\b/i.test(lower)) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    suggestedDate = toLocalDateString(tmrw);
    matchedKeywords.push('tomorrow');
  }
  // Match day names like "by friday", "on monday", "next wednesday", or just "friday"
  else {
    for (let dayIndex = 0; dayIndex < DAY_NAMES.length; dayIndex++) {
      const dayName = DAY_NAMES[dayIndex];
      const dayRegex = new RegExp(`\\b(by|on|this|next)?\\s*${dayName}\\b`, 'i');
      if (dayRegex.test(lower)) {
        const todayDayIndex = now.getDay();
        let daysToAdd = dayIndex - todayDayIndex;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Next occurrence
        }
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        suggestedDate = toLocalDateString(targetDate);
        matchedKeywords.push(dayName);
        break;
      }
    }
  }

  // 2. TIME PARSING (e.g., "at 6 PM", "at 6:30 pm", "at 14:00", "at 9am")
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2}):(\d{2})\b/i;
  const timeMatch = lower.match(timeRegex);
  if (timeMatch) {
    if (timeMatch[3]) {
      // 12-hour format with AM/PM
      let hour = parseInt(timeMatch[1], 10);
      const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3].toLowerCase();
      if (meridiem === 'pm' && hour < 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
      suggestedTimeMinutes = hour * 60 + minute;
      matchedKeywords.push(timeMatch[0]);
    } else if (timeMatch[4]) {
      // 24-hour format (e.g. at 14:30)
      const hour = parseInt(timeMatch[4], 10);
      const minute = parseInt(timeMatch[5], 10);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        suggestedTimeMinutes = hour * 60 + minute;
        matchedKeywords.push(timeMatch[0]);
      }
    }
  }

  // 3. DURATION PARSING (e.g., "for 45 minutes", "for 45m", "for 1 hour", "for 1.5 hours", "for 2h")
  const durationMinutesRegex = /\b(?:for\s+)?(\d+)\s*(?:minutes?|mins?|m)\b/i;
  const durationHoursRegex = /\b(?:for\s+)?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i;

  const minMatch = lower.match(durationMinutesRegex);
  const hourMatch = lower.match(durationHoursRegex);

  if (minMatch) {
    suggestedDuration = parseInt(minMatch[1], 10);
    matchedKeywords.push(minMatch[0]);
  } else if (hourMatch) {
    suggestedDuration = Math.round(parseFloat(hourMatch[1]) * 60);
    matchedKeywords.push(hourMatch[0]);
  }

  // 4. PRIORITY PARSING
  if (/\b(urgent|asap|critical|high priority|important)\b/i.test(lower)) {
    suggestedPriority = 'high';
    matchedKeywords.push('high priority');
  } else if (/\b(low priority|someday|when free|minor)\b/i.test(lower)) {
    suggestedPriority = 'low';
    matchedKeywords.push('low priority');
  } else {
    suggestedPriority = 'medium';
  }

  // 5. SUGGESTED ENTITY TYPE INFERENCE
  if (/\b(remind|remind me|reminder|alert me|notify)\b/i.test(lower)) {
    suggestedType = 'reminder';
    confidence = 'high';
  } else if (/\b(goal|improve my|learn|master|gpa|habit|target)\b/i.test(lower)) {
    suggestedType = 'smart_goal';
    confidence = 'high';
  } else if (
    suggestedTimeMinutes !== undefined ||
    (suggestedDuration !== undefined && /\b(study|work|workout|gym|class|lecture|meeting|session)\b/i.test(lower))
  ) {
    suggestedType = 'timetable_block';
    confidence = 'high';
  } else {
    suggestedType = 'task';
    confidence = matchedKeywords.length > 0 ? 'medium' : 'low';
  }

  // 6. CLEANED TITLE SUGGESTION
  let suggestedTitle = text
    .replace(/^remind me to\s+/i, '')
    .replace(/^remember to\s+/i, '')
    .replace(/^don't forget to\s+/i, '')
    .replace(/^need to\s+/i, '')
    .replace(/^have to\s+/i, '')
    .replace(/^must\s+/i, '')
    .trim();

  // Capitalize first letter
  if (suggestedTitle.length > 0) {
    suggestedTitle = suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1);
  } else {
    suggestedTitle = text;
  }

  return {
    suggestedType,
    suggestedTitle,
    suggestedDate,
    suggestedTimeMinutes,
    suggestedDuration,
    suggestedPriority,
    confidence,
    matchedKeywords,
  };
}

import assert from 'node:assert';
import {
  parseIcsContent,
  extractEventFromEmailText,
  extractEventFromGmailMessage,
  checkEventConflict,
  convertExtractedEventToScheduledBlock,
} from './emailEventParser.ts';
import { SAMPLE_ACADEMIC_EMAILS } from '../services/googleWorkspaceService.ts';
import { ScheduledBlock } from '../types/timetable.ts';

// Test 1: ICS Content Parsing
{
  const icsSample = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VEVENT
UID:test_sync_123@university.edu
SUMMARY:CS402 Machine Learning Lab
LOCATION:Room 201
DTSTART:20261126T143000Z
DTEND:20261126T160000Z
DESCRIPTION:Practical hands-on session on transformers.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const parsed = parseIcsContent(icsSample);
  assert.ok(parsed, 'ICS parser should return a parsed event');
  assert.strictEqual(parsed.title, 'CS402 Machine Learning Lab');
  assert.strictEqual(parsed.startTime, '14:30');
  assert.strictEqual(parsed.duration, 90, 'Duration should be 90 minutes (14:30 to 16:00)');
  assert.strictEqual(parsed.location, 'Room 201');
}

// Test 2: Text Extraction Heuristics for Exam Notice
{
  const examEmail = SAMPLE_ACADEMIC_EMAILS[0];
  const parsed = extractEventFromEmailText(examEmail.subject, examEmail.bodyText);
  assert.ok(parsed, 'Should extract event from exam announcement');
  assert.strictEqual(parsed.dayOfWeek, 2, 'Wednesday should be day index 2');
  assert.strictEqual(parsed.startTime, '10:00');
  assert.strictEqual(parsed.duration, 90, '10:00 to 11:30 should be 90 minutes');
  assert.strictEqual(parsed.category, 'Exam');
  assert.strictEqual(parsed.priority, 'high');
}

// Test 3: Text Extraction Heuristics for Afternoon Guest Lecture
{
  const lectureEmail = SAMPLE_ACADEMIC_EMAILS[1];
  const parsed = extractEventFromEmailText(lectureEmail.subject, lectureEmail.bodyText);
  assert.ok(parsed, 'Should extract event from lecture announcement');
  assert.strictEqual(parsed.dayOfWeek, 4, 'Friday should be day index 4');
  assert.strictEqual(parsed.startTime, '14:00');
  assert.strictEqual(parsed.duration, 90, '14:00 to 15:30 should be 90 minutes');
  assert.strictEqual(parsed.category, 'Lecture');
}

// Test 4: Full Extraction from RawGmailMessage with ICS
{
  const icsEmail = SAMPLE_ACADEMIC_EMAILS[3];
  const event = extractEventFromGmailMessage(icsEmail);
  assert.strictEqual(event.title, 'Capstone Project Sprint Sync');
  assert.strictEqual(event.sourceType, 'ics');
  assert.strictEqual(event.confidence, 'high');
  assert.strictEqual(event.startTime, '09:00');
  assert.strictEqual(event.duration, 60);

  const block = convertExtractedEventToScheduledBlock(event, 'week_2026_w48');
  assert.strictEqual(block.title, 'Capstone Project Sprint Sync');
  assert.strictEqual(block.weekId, 'week_2026_w48');
  assert.strictEqual(block.status, 'scheduled');
}

// Test 5: Conflict Detection
{
  const event = extractEventFromGmailMessage(SAMPLE_ACADEMIC_EMAILS[0]); // Wednesday 10:00 - 11:30
  const existingBlocks: ScheduledBlock[] = [
    {
      id: 'existing_1',
      blockId: 'lib_1',
      title: 'Database Systems',
      dayOfWeek: 2, // Wednesday
      startMinutes: 630, // 10:30 (overlaps with 10:00 - 11:30)
      duration: 60,
      priority: 'medium',
      color: 'blue',
      icon: 'book',
      status: 'scheduled',
      weekId: 'week_2026_w48',
    },
  ];

  const conflictResult = checkEventConflict(event, existingBlocks);
  assert.strictEqual(conflictResult.hasConflict, true, 'Should detect overlap');
  assert.strictEqual(conflictResult.conflictingBlock?.id, 'existing_1');

  // Non-conflicting block on another day
  const nonConflictingBlocks: ScheduledBlock[] = [
    {
      id: 'existing_2',
      blockId: 'lib_2',
      title: 'Operating Systems',
      dayOfWeek: 3, // Thursday
      startMinutes: 600, // 10:00
      duration: 60,
      priority: 'medium',
      color: 'blue',
      icon: 'book',
      status: 'scheduled',
      weekId: 'week_2026_w48',
    },
  ];

  const noConflictResult = checkEventConflict(event, nonConflictingBlocks);
  assert.strictEqual(noConflictResult.hasConflict, false, 'Should not conflict on different day');
}

console.log('✅ All emailEventParser tests passed successfully!');

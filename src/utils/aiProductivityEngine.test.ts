import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateAIInsights,
  generateWeeklyAIReport,
  getProductivityDNA,
  calculateAdherenceMetrics,
} from './aiProductivityEngine.ts';
import { parseNaturalLanguageSchedule } from './aiNaturalLanguageParser.ts';
import { parseNaturalLanguageInput } from './naturalLanguageParser.ts';
import { ScheduledBlock } from '../types/timetable.ts';

describe('PHASE 3: Authentic AI & Honest Productivity Insights', () => {
  describe('1. AI Insights — Empty State & Data Threshold Boundaries', () => {
    test('empty schedule produces honest data-gathering guidance with 0 confidence', () => {
      const insights = generateAIInsights([], []);
      assert.strictEqual(insights.length, 1);
      assert.strictEqual(insights[0].id, 'ins-empty');
      assert.strictEqual(insights[0].confidence, 0);
      assert.strictEqual(insights[0].dataStatus, 'insufficient');
      assert.match(insights[0].dataRequirement || '', /Requires at least 3 scheduled blocks/i);
    });

    test('under 3 morning blocks reports insufficient data rather than fake peak', () => {
      const fewBlocks: ScheduledBlock[] = [
        {
          id: 'b1',
          blockId: 'lib-1',
          title: 'Math Morning',
          color: '#3B82F6',
          priority: 'high',
          icon: 'code',
          dayOfWeek: 1,
          startMinutes: 480, // 8:00 AM
          duration: 60,
          weekId: '2026-W45',
          status: 'completed',
        },
      ];

      const insights = generateAIInsights(fewBlocks, []);
      // Should NOT claim "Morning Productivity Peak Identified"
      const morningPeak = insights.find((i) => i.id === 'ins-morning-peak');
      assert.strictEqual(morningPeak, undefined, 'Must not claim morning peak with only 1 block');

      // Should provide data-gathering status
      const gathering = insights.find((i) => i.id === 'ins-circadian-gathering');
      assert.ok(gathering, 'Must report circadian gathering status');
      assert.strictEqual(gathering?.dataStatus, 'insufficient');
      assert.strictEqual(gathering?.confidence, 0);
      assert.match(gathering?.dataRequirement || '', /Requires at least 3 morning/i);
    });

    test('3+ morning blocks with 70%+ completion produces statistical insight with dynamic confidence', () => {
      const morningBlocks: ScheduledBlock[] = [
        { id: 'm1', blockId: 'l1', title: 'DSA', color: '', priority: 'high', icon: '', dayOfWeek: 0, startMinutes: 480, duration: 60, weekId: 'w1', status: 'completed' },
        { id: 'm2', blockId: 'l1', title: 'DSA', color: '', priority: 'high', icon: '', dayOfWeek: 1, startMinutes: 480, duration: 60, weekId: 'w1', status: 'completed' },
        { id: 'm3', blockId: 'l1', title: 'DSA', color: '', priority: 'high', icon: '', dayOfWeek: 2, startMinutes: 480, duration: 60, weekId: 'w1', status: 'completed' },
      ];

      const insights = generateAIInsights(morningBlocks, []);
      const morningPeak = insights.find((i) => i.id === 'ins-morning-peak');
      assert.ok(morningPeak, 'Morning peak should trigger with 3 completed blocks');
      assert.strictEqual(morningPeak?.dataStatus, 'sufficient');
      assert.strictEqual(morningPeak?.methodology, 'statistical');
      // Confidence is dynamic (65 + 3*4 = 77) rather than arbitrary hardcoded 94
      assert.strictEqual(morningPeak?.confidence, 77);
      assert.strictEqual(morningPeak?.sampleCount, 3);
    });

    test('fitness habit requires minimum 3 completed sessions', () => {
      // 2 sessions: insufficient
      const twoFitness: ScheduledBlock[] = [
        { id: 'f1', blockId: 'l1', title: 'Gym Workout', color: '', priority: 'low', icon: '', dayOfWeek: 1, startMinutes: 1000, duration: 60, weekId: 'w1', status: 'completed' },
        { id: 'f2', blockId: 'l1', title: 'Gym Workout', color: '', priority: 'low', icon: '', dayOfWeek: 3, startMinutes: 1000, duration: 60, weekId: 'w1', status: 'completed' },
      ];
      assert.strictEqual(
        generateAIInsights(twoFitness, []).some((i) => i.id === 'ins-habit-fitness'),
        false,
        'Should not claim habit with only 2 sessions'
      );

      // 3 sessions: triggers habit insight with dynamic confidence
      const threeFitness: ScheduledBlock[] = [
        ...twoFitness,
        { id: 'f3', blockId: 'l1', title: 'Gym Workout', color: '', priority: 'low', icon: '', dayOfWeek: 5, startMinutes: 1000, duration: 60, weekId: 'w1', status: 'completed' },
      ];
      const habit = generateAIInsights(threeFitness, []).find((i) => i.id === 'ins-habit-fitness');
      assert.ok(habit);
      assert.strictEqual(habit?.dataStatus, 'sufficient');
      assert.strictEqual(habit?.methodology, 'statistical');
      assert.strictEqual(habit?.confidence, 87); // 75 + 3*4 = 87
    });

    test('3+ consecutive high-priority blocks on the same day triggers heuristic overload warning', () => {
      const overloadBlocks: ScheduledBlock[] = [
        { id: 'o1', blockId: 'l1', title: 'Algorithms', color: '', priority: 'high', icon: '', dayOfWeek: 2, startMinutes: 540, duration: 90, weekId: 'w1' },
        { id: 'o2', blockId: 'l1', title: 'Operating Systems', color: '', priority: 'high', icon: '', dayOfWeek: 2, startMinutes: 630, duration: 90, weekId: 'w1' },
        { id: 'o3', blockId: 'l1', title: 'System Design', color: '', priority: 'high', icon: '', dayOfWeek: 2, startMinutes: 720, duration: 90, weekId: 'w1' },
      ];

      const insights = generateAIInsights(overloadBlocks, []);
      const warning = insights.find((i) => i.id === 'ins-overload');
      assert.ok(warning, 'Overload warning must trigger for 3 consecutive high-priority blocks');
      assert.strictEqual(warning?.methodology, 'heuristic');
      assert.strictEqual(warning?.dataStatus, 'sufficient');
    });
  });

  describe('2. Weekly AI Report — Honest Non-Fabricated Figures', () => {
    test('empty weekly schedule produces transparent no-activity report without mock data', () => {
      const report = generateWeeklyAIReport('2026-W45', []);
      assert.strictEqual(report.adherenceScore, 0);
      assert.strictEqual(report.adherenceGrade, 'D');
      assert.strictEqual(report.topPerformingDay, 'No activity recorded');
      assert.strictEqual(report.mostProductiveActivity, 'None recorded yet');
      assert.strictEqual(report.mostSkippedActivity, 'None recorded yet');
      assert.ok(report.highlights.some((h) => h.includes('no scheduled activities recorded')));
    });

    test('reports authentic activity names without defaulting to hardcoded mocks', () => {
      const blocks: ScheduledBlock[] = [
        { id: '1', blockId: 'l1', title: 'Physics Research', color: '', priority: 'high', icon: '', dayOfWeek: 0, startMinutes: 600, duration: 120, weekId: 'w1', status: 'completed' },
        { id: '2', blockId: 'l1', title: 'History Essay', color: '', priority: 'medium', icon: '', dayOfWeek: 0, startMinutes: 750, duration: 60, weekId: 'w1', status: 'skipped' },
      ];

      const report = generateWeeklyAIReport('2026-W45', blocks);
      assert.strictEqual(report.mostProductiveActivity, 'Physics Research');
      assert.strictEqual(report.mostSkippedActivity, 'History Essay');
      assert.strictEqual(report.topPerformingDay, 'Monday');
      assert.strictEqual(report.completedHours, 2);
      assert.strictEqual(report.plannedHours, 3);
    });

    test('100% adherence reports zero skipped activities honestly', () => {
      const blocks: ScheduledBlock[] = [
        { id: '1', blockId: 'l1', title: 'Deep Work', color: '', priority: 'high', icon: '', dayOfWeek: 1, startMinutes: 600, duration: 60, weekId: 'w1', status: 'completed' },
      ];
      const report = generateWeeklyAIReport('2026-W45', blocks);
      assert.strictEqual(report.mostSkippedActivity, 'Zero skipped sessions');
      assert.ok(report.highlights.some((h) => h.includes('Zero sessions skipped')));
    });
  });

  describe('3. Productivity DNA Threshold Disclosures', () => {
    test('explicitly states minimum data threshold requirements when history is low', () => {
      const dnaEmpty = getProductivityDNA({ scheduledBlocks: [] });
      assert.match(dnaEmpty.peakFocusWindow, /needs 3\+ completed sessions/i);
      assert.match(dnaEmpty.preferredSessionMinutes, /needs 3\+ completed sessions/i);
      assert.match(dnaEmpty.mostProductiveDay, /needs 5\+ completed sessions/i);
      assert.match(dnaEmpty.leastProductiveTime, /needs 5\+ blocks/i);
    });

    test('computes authentic metrics once thresholds are met', () => {
      const completed: ScheduledBlock[] = [
        { id: 'c1', blockId: '', title: '', color: '', priority: 'low', icon: '', dayOfWeek: 0, startMinutes: 500, duration: 45, weekId: '', status: 'completed' },
        { id: 'c2', blockId: '', title: '', color: '', priority: 'low', icon: '', dayOfWeek: 0, startMinutes: 550, duration: 45, weekId: '', status: 'completed' },
        { id: 'c3', blockId: '', title: '', color: '', priority: 'low', icon: '', dayOfWeek: 0, startMinutes: 600, duration: 60, weekId: '', status: 'completed' },
      ];

      const dna = getProductivityDNA({ scheduledBlocks: completed });
      assert.strictEqual(dna.preferredSessionMinutes, '50 mins'); // (45 + 45 + 60) / 3 = 50
      assert.strictEqual(dna.peakFocusWindow, '8:00 AM – 11:30 AM (Morning)');
    });
  });

  describe('4. Natural Language Schedule Parser Robustness', () => {
    test('handles empty and whitespace input safely', () => {
      const res = parseNaturalLanguageSchedule('');
      assert.strictEqual(res.title, 'Scheduled Activity');
      assert.strictEqual(res.duration, 60);
      assert.strictEqual(res.startMinutes, 540);
    });

    test('handles midnight crossover intervals accurately', () => {
      // "11pm to 1am Hackathon" -> 23:00 (1380m) to 01:00 (60m next day) = 120 mins
      const res = parseNaturalLanguageSchedule('Hackathon 11pm to 1am');
      assert.strictEqual(res.startMinutes, 1380);
      assert.strictEqual(res.duration, 120);
    });

    test('clamps duration within valid range (15m to 720m)', () => {
      const resShort = parseNaturalLanguageSchedule('Quick sync for 5 mins');
      assert.strictEqual(resShort.duration, 15, 'Must clamp minimum duration to 15m');

      const resLong = parseNaturalLanguageSchedule('Marathon for 20 hours');
      assert.strictEqual(resLong.duration, 720, 'Must clamp maximum duration to 720m (12h)');
    });

    test('client-side quick capture parser extracts date, time, and priority safely', () => {
      const parsed = parseNaturalLanguageInput('Submit machine learning assignment tomorrow at 4 PM high priority');
      assert.strictEqual(parsed.suggestedPriority, 'high');
      assert.strictEqual(parsed.suggestedTimeMinutes, 16 * 60); // 16:00 = 960m
      assert.ok(parsed.suggestedDate);
      assert.strictEqual(parsed.confidence, 'high');
    });
  });
});

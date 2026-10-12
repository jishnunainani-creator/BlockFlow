import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createActiveSession,
  pauseActiveSession,
  resumeActiveSession,
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  isSessionFinished,
  finalizeSession,
} from './focusSessionEngine.ts';

describe('focusSessionEngine - Timestamp-Based Focus Tracking', () => {
  const BASE_TIME = 1700000000000; // Reference epoch in ms

  it('creates active session with accurate timestamps and duration', () => {
    const session = createActiveSession({
      taskTitle: 'Algorithm Practice',
      blockId: 'block-123',
      taskId: 'task-456',
      plannedDurationMinutes: 25,
      now: BASE_TIME,
    });

    assert.strictEqual(session.taskTitle, 'Algorithm Practice');
    assert.strictEqual(session.blockId, 'block-123');
    assert.strictEqual(session.taskId, 'task-456');
    assert.strictEqual(session.status, 'running');
    assert.strictEqual(session.startedAt, BASE_TIME);
    assert.strictEqual(session.lastStartedAt, BASE_TIME);
    assert.strictEqual(session.durationSeconds, 25 * 60);
    assert.strictEqual(session.endsAt, BASE_TIME + 25 * 60 * 1000);
    assert.strictEqual(session.accumulatedFocusSeconds, 0);
  });

  it('calculates elapsed time accurately as wall-clock progresses', () => {
    const session = createActiveSession({
      taskTitle: 'Writing Documentation',
      durationSeconds: 1500, // 25 mins
      now: BASE_TIME,
    });

    // 5 minutes later
    const now5m = BASE_TIME + 5 * 60 * 1000;
    assert.strictEqual(calculateElapsedSeconds(session, now5m), 300);
    assert.strictEqual(calculateRemainingSeconds(session, now5m), 1200);
    assert.strictEqual(isSessionFinished(session, now5m), false);
  });

  it('handles browser tab backgrounding / suspension while running', () => {
    const session = createActiveSession({
      taskTitle: 'System Design',
      durationSeconds: 1800, // 30 mins
      now: BASE_TIME,
    });

    // Browser suspended for 20 minutes (1200 seconds)
    const now20m = BASE_TIME + 20 * 60 * 1000;
    assert.strictEqual(calculateElapsedSeconds(session, now20m), 1200);
    assert.strictEqual(calculateRemainingSeconds(session, now20m), 600);
  });

  it('never counts paused intervals towards focus time', () => {
    const session = createActiveSession({
      taskTitle: 'Exam Preparation',
      durationSeconds: 1500, // 25 mins
      now: BASE_TIME,
    });

    // Run for 10 minutes (600 seconds)
    const pauseTime = BASE_TIME + 10 * 60 * 1000;
    const paused = pauseActiveSession(session, pauseTime);

    assert.strictEqual(paused.status, 'paused');
    assert.strictEqual(paused.accumulatedFocusSeconds, 600);
    assert.strictEqual(calculateElapsedSeconds(paused, pauseTime), 600);
    assert.strictEqual(calculateRemainingSeconds(paused, pauseTime), 900);

    // Browser is left paused for 45 minutes!
    const suspendedPauseTime = pauseTime + 45 * 60 * 1000;
    assert.strictEqual(calculateElapsedSeconds(paused, suspendedPauseTime), 600);
    assert.strictEqual(calculateRemainingSeconds(paused, suspendedPauseTime), 900);
  });

  it('resumes accurately and continues counting from resume timestamp', () => {
    const session = createActiveSession({
      taskTitle: 'Chemistry Lab',
      durationSeconds: 1500, // 25 mins
      now: BASE_TIME,
    });

    // Run for 10 minutes (600 seconds), then pause
    const pauseTime = BASE_TIME + 10 * 60 * 1000;
    const paused = pauseActiveSession(session, pauseTime);

    // Paused for 15 minutes, then resumed
    const resumeTime = pauseTime + 15 * 60 * 1000;
    const resumed = resumeActiveSession(paused, resumeTime);

    assert.strictEqual(resumed.status, 'running');
    assert.strictEqual(resumed.lastStartedAt, resumeTime);
    assert.strictEqual(resumed.accumulatedFocusSeconds, 600);

    // Run for another 5 minutes after resuming
    const nowAfterResume = resumeTime + 5 * 60 * 1000;
    assert.strictEqual(calculateElapsedSeconds(resumed, nowAfterResume), 900); // 600 + 300
    assert.strictEqual(calculateRemainingSeconds(resumed, nowAfterResume), 600);
  });

  it('is idempotent on duplicate pause or duplicate resume calls', () => {
    const session = createActiveSession({
      taskTitle: 'Math Problem Set',
      durationSeconds: 1200,
      now: BASE_TIME,
    });

    const pauseTime = BASE_TIME + 300 * 1000;
    const paused1 = pauseActiveSession(session, pauseTime);
    // Duplicate pause click
    const paused2 = pauseActiveSession(paused1, pauseTime + 1000);
    assert.strictEqual(paused2.accumulatedFocusSeconds, 300);

    const resumeTime = pauseTime + 2000;
    const resumed1 = resumeActiveSession(paused2, resumeTime);
    // Duplicate resume click
    const resumed2 = resumeActiveSession(resumed1, resumeTime + 500);
    assert.strictEqual(resumed2.lastStartedAt, resumeTime);
  });

  it('detects session completion when total elapsed reaches duration', () => {
    const session = createActiveSession({
      taskTitle: 'Physics Review',
      durationSeconds: 600, // 10 mins
      now: BASE_TIME,
    });

    const completionTime = BASE_TIME + 600 * 1000;
    assert.strictEqual(calculateElapsedSeconds(session, completionTime), 600);
    assert.strictEqual(calculateRemainingSeconds(session, completionTime), 0);
    assert.strictEqual(isSessionFinished(session, completionTime), true);

    // Overtime test: does not return negative remaining seconds
    const overTime = completionTime + 120 * 1000;
    assert.strictEqual(calculateRemainingSeconds(session, overTime), 0);
    assert.strictEqual(isSessionFinished(session, overTime), true);
  });

  it('finalizes session into canonical ExecutionSession and FocusSessionLog', () => {
    const session = createActiveSession({
      taskTitle: 'DSA Graphs',
      blockId: 'block-graphs-1',
      taskId: 'task-graphs-9',
      goalId: 'goal-mastery-3',
      plannedDurationMinutes: 50,
      durationSeconds: 50 * 60,
      now: BASE_TIME,
    });

    // Ran for 45 minutes
    const finishTime = BASE_TIME + 45 * 60 * 1000;
    const result = finalizeSession({
      session,
      now: finishTime,
      userNotes: 'Finished Dijkstra and Bellman-Ford implementations.',
      status: 'completed',
      rating: 5,
    });

    assert.strictEqual(result.actualDurationMinutes, 45);
    assert.strictEqual(result.actualDurationSeconds, 2700);

    // Focus session log checks
    assert.strictEqual(result.focusSessionLog.taskTitle, 'DSA Graphs');
    assert.strictEqual(result.focusSessionLog.blockId, 'block-graphs-1');
    assert.strictEqual(result.focusSessionLog.taskId, 'task-graphs-9');
    assert.strictEqual(result.focusSessionLog.goalId, 'goal-mastery-3');
    assert.strictEqual(result.focusSessionLog.actualMinutes, 45);
    assert.strictEqual(result.focusSessionLog.plannedMinutes, 50);
    assert.strictEqual(result.focusSessionLog.status, 'completed');
    assert.ok(result.focusSessionLog.notes?.includes('Dijkstra'));

    // Canonical execution session checks
    assert.strictEqual(result.executionSession.scheduledBlockId, 'block-graphs-1');
    assert.strictEqual(result.executionSession.actualTitle, 'DSA Graphs');
    assert.strictEqual(result.executionSession.actualDuration, 45);
    assert.strictEqual(result.executionSession.plannedDuration, 50);
    assert.strictEqual(result.executionSession.focusRating, 5);
    assert.strictEqual(result.executionSession.status, 'completed');
  });
});

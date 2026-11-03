import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrimaryNavActive, NavView } from '../components/Navigation/Sidebar';
import { ROUTES, PATH_TO_VIEW_MAP } from './routes';
import { CalendarTab } from '../components/Views/CalendarView';
import { PlannerTab } from '../components/Views/PlannerHubView';
import { InboxTab } from '../components/Views/InboxAndNotesView';
import { InsightsTab } from '../components/Views/InsightsView';

test('PHASE 6: Navigation & UI Consolidation', async (t) => {
  await t.test('1. Verified 8 Consolidated Primary Destinations Active State Mapping', () => {
    // 1. Today
    assert.equal(isPrimaryNavActive('my-day', 'my-day'), true);
    assert.equal(isPrimaryNavActive('my-day', 'calendar'), false);

    // 2. Timetable absorbs library, templates, resources
    assert.equal(isPrimaryNavActive('calendar', 'calendar'), true);
    assert.equal(isPrimaryNavActive('calendar', 'library'), true);
    assert.equal(isPrimaryNavActive('calendar', 'templates'), true);
    assert.equal(isPrimaryNavActive('calendar', 'resources'), true);
    assert.equal(isPrimaryNavActive('calendar', 'goals'), false);

    // 3. Planner absorbs custom planners and assignments
    assert.equal(isPrimaryNavActive('adaptive-planner', 'adaptive-planner'), true);
    assert.equal(isPrimaryNavActive('adaptive-planner', 'my-planners'), true);
    assert.equal(isPrimaryNavActive('adaptive-planner', 'assignments'), true);
    assert.equal(isPrimaryNavActive('adaptive-planner', 'task-inbox'), false);

    // 4. Goals
    assert.equal(isPrimaryNavActive('goals', 'goals'), true);
    assert.equal(isPrimaryNavActive('goals', 'my-day'), false);

    // 5. Inbox & Notes absorbs thought-space and quick-add
    assert.equal(isPrimaryNavActive('task-inbox', 'task-inbox'), true);
    assert.equal(isPrimaryNavActive('task-inbox', 'thought-space'), true);
    assert.equal(isPrimaryNavActive('task-inbox', 'quick-add'), true);
    assert.equal(isPrimaryNavActive('task-inbox', 'focus'), false);

    // 6. Focus
    assert.equal(isPrimaryNavActive('focus', 'focus'), true);
    assert.equal(isPrimaryNavActive('focus', 'analytics'), false);

    // 7. Insights absorbs dashboard, execution, ai-insights
    assert.equal(isPrimaryNavActive('analytics', 'analytics'), true);
    assert.equal(isPrimaryNavActive('analytics', 'dashboard'), true);
    assert.equal(isPrimaryNavActive('analytics', 'execution'), true);
    assert.equal(isPrimaryNavActive('analytics', 'ai-insights'), true);
    assert.equal(isPrimaryNavActive('analytics', 'calendar'), false);

    // 8. Settings absorbs reminders, privacy-policy, terms
    assert.equal(isPrimaryNavActive('settings', 'settings'), true);
    assert.equal(isPrimaryNavActive('settings', 'privacy-policy'), true);
    assert.equal(isPrimaryNavActive('settings', 'terms'), true);
    assert.equal(isPrimaryNavActive('settings', 'reminders'), true);
    assert.equal(isPrimaryNavActive('settings', 'my-day'), false);
  });

  await t.test('2. Complete Backward-Compatible URL Route Resolution', () => {
    // Primary routes
    assert.equal(PATH_TO_VIEW_MAP['/today'], 'my-day');
    assert.equal(PATH_TO_VIEW_MAP['/timetable'], 'calendar');
    assert.equal(PATH_TO_VIEW_MAP['/calendar'], 'calendar');
    assert.equal(PATH_TO_VIEW_MAP['/planner'], 'adaptive-planner');
    assert.equal(PATH_TO_VIEW_MAP['/goals'], 'goals');
    assert.equal(PATH_TO_VIEW_MAP['/inbox'], 'task-inbox');
    assert.equal(PATH_TO_VIEW_MAP['/tasks'], 'task-inbox');
    assert.equal(PATH_TO_VIEW_MAP['/focus'], 'focus');
    assert.equal(PATH_TO_VIEW_MAP['/insights'], 'analytics');
    assert.equal(PATH_TO_VIEW_MAP['/settings'], 'settings');

    // Consolidated sub-route backward compatibility
    assert.equal(PATH_TO_VIEW_MAP['/library'], 'library');
    assert.equal(PATH_TO_VIEW_MAP['/templates'], 'templates');
    assert.equal(PATH_TO_VIEW_MAP['/resources'], 'resources');
    assert.equal(PATH_TO_VIEW_MAP['/planners'], 'my-planners');
    assert.equal(PATH_TO_VIEW_MAP['/assignments'], 'assignments');
    assert.equal(PATH_TO_VIEW_MAP['/notes'], 'thought-space');
    assert.equal(PATH_TO_VIEW_MAP['/thought-space'], 'thought-space');
    assert.equal(PATH_TO_VIEW_MAP['/dashboard'], 'dashboard');
    assert.equal(PATH_TO_VIEW_MAP['/execution'], 'execution');
    assert.equal(PATH_TO_VIEW_MAP['/ai-coach'], 'ai-insights');
    assert.equal(PATH_TO_VIEW_MAP['/privacy'], 'privacy-policy');
    assert.equal(PATH_TO_VIEW_MAP['/terms'], 'terms');
  });

  await t.test('3. Consolidated Sub-Tab Architecture Definition Verification', () => {
    // Timetable tabs
    const validCalendarTabs: CalendarTab[] = ['grid', 'library', 'templates', 'resources'];
    assert.equal(validCalendarTabs.length, 4);

    // Planner tabs
    const validPlannerTabs: PlannerTab[] = ['optimizer', 'custom-planners', 'assignments'];
    assert.equal(validPlannerTabs.length, 3);

    // Inbox & Notes tabs
    const validInboxTabs: InboxTab[] = ['tasks', 'notes', 'quick-capture'];
    assert.equal(validInboxTabs.length, 3);

    // Insights tabs
    const validInsightsTabs: InsightsTab[] = ['dashboard', 'analytics', 'execution', 'coach'];
    assert.equal(validInsightsTabs.length, 4);
  });
});

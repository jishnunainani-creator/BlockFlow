import test from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKFLOW_TOUR_STEPS } from '../data/tourSteps';
import {
  calculateTooltipCoords,
  findTourTargetElement,
  ViewportDimensions,
} from './tourPositioning';

test('INTERACTIVE PRODUCT TOUR — Comprehensive System Test Suite', async (t) => {
  await t.test('1. Verified All 8 Consolidated Primary Destinations Covered in Tour Steps', () => {
    assert.equal(BLOCKFLOW_TOUR_STEPS.length, 9);

    const routesCovered = BLOCKFLOW_TOUR_STEPS.map((s) => s.route);
    assert.ok(routesCovered.includes('my-day'), 'Must cover Today (my-day)');
    assert.ok(routesCovered.includes('calendar'), 'Must cover Timetable (calendar)');
    assert.ok(routesCovered.includes('adaptive-planner'), 'Must cover Planner (adaptive-planner)');
    assert.ok(routesCovered.includes('goals'), 'Must cover Goals (goals)');
    assert.ok(routesCovered.includes('task-inbox'), 'Must cover Inbox & Notes (task-inbox)');
    assert.ok(routesCovered.includes('focus'), 'Must cover Focus (focus)');
    assert.ok(routesCovered.includes('analytics'), 'Must cover Insights (analytics)');
    assert.ok(routesCovered.includes('settings'), 'Must cover Settings (settings)');

    // Ensure every step has required metadata
    BLOCKFLOW_TOUR_STEPS.forEach((step, idx) => {
      assert.equal(step.stepNumber, idx + 1);
      assert.ok(step.title.length > 5, `Step ${step.id} title must be descriptive`);
      assert.ok(step.description.length > 20, `Step ${step.id} description must explain functionality`);
      assert.ok(step.practicalUsage.includes('💡'), `Step ${step.id} must have usage guidance`);
      assert.ok(step.targetSelector.startsWith('[') || step.targetSelector.startsWith('.'), 'Valid selector format');
      assert.ok(typeof step.borderRadius === 'number' && step.borderRadius > 0);
      assert.ok(typeof step.padding === 'number' && step.padding > 0);
    });
  });

  await t.test('2. Step Types: Informational vs Action-Required Steps', () => {
    const actionSteps = BLOCKFLOW_TOUR_STEPS.filter((s) => s.type === 'action');
    const infoSteps = BLOCKFLOW_TOUR_STEPS.filter((s) => s.type === 'informational');

    assert.equal(actionSteps.length, 2, 'Must have exactly 2 action-required interactive steps');
    assert.equal(infoSteps.length, 7, 'Must have 7 informational steps');

    // Step 3 (Library) and Step 6 (Quick Capture) are interactive
    assert.equal(actionSteps[0].id, 'step-library');
    assert.ok(actionSteps[0].expectedActionSelector, 'Action step must define expectedActionSelector');
    assert.ok(actionSteps[0].actionPrompt?.includes('👉'), 'Action step must provide clear user prompt');

    assert.equal(actionSteps[1].id, 'step-inbox');
    assert.ok(actionSteps[1].expectedActionSelector, 'Action step must define expectedActionSelector');
    assert.ok(actionSteps[1].actionPrompt?.includes('👉'), 'Action step must provide clear user prompt');
  });

  await t.test('3. Desktop Tooltip Anchoring & Viewport Space Clamping', () => {
    const viewport: ViewportDimensions = {
      width: 1440,
      height: 900,
      scrollX: 0,
      scrollY: 0,
    };
    const tooltipDimensions = { width: 380, height: 240 };

    // Target in center-left (like desktop sidebar navigation)
    const targetRect: DOMRect = {
      top: 150,
      bottom: 200,
      left: 20,
      right: 220,
      width: 200,
      height: 50,
      x: 20,
      y: 150,
      toJSON: () => ({}),
    };

    const coords = calculateTooltipCoords(targetRect, tooltipDimensions, 'right', viewport);
    assert.equal(coords.actualPlacement, 'right');
    assert.equal(coords.left, 220 + 14); // targetRect.right + margin
    assert.ok(coords.top >= 14 && coords.top <= 900 - 240 - 14);

    // Target near right edge -> falls back gracefully
    const rightEdgeTarget: DOMRect = {
      top: 200,
      bottom: 250,
      left: 1300,
      right: 1420,
      width: 120,
      height: 50,
      x: 1300,
      y: 200,
      toJSON: () => ({}),
    };

    const edgeCoords = calculateTooltipCoords(rightEdgeTarget, tooltipDimensions, 'right', viewport);
    assert.ok(edgeCoords.actualPlacement !== 'right', 'Should switch placement if right edge has no space');
    assert.ok(edgeCoords.left + tooltipDimensions.width <= 1440, 'Tooltip must stay within screen width');
  });

  await t.test('4. Mobile Viewport Docking (< 640px)', () => {
    const mobileViewport: ViewportDimensions = {
      width: 390, // iPhone 14/15 width
      height: 844,
      scrollX: 0,
      scrollY: 0,
    };
    const tooltipDimensions = { width: 350, height: 220 };

    const targetRect: DOMRect = {
      top: 100,
      bottom: 150,
      left: 20,
      right: 370,
      width: 350,
      height: 50,
      x: 20,
      y: 100,
      toJSON: () => ({}),
    };

    const coords = calculateTooltipCoords(targetRect, tooltipDimensions, 'bottom', mobileViewport);
    assert.equal(coords.actualPlacement, 'bottom');
    assert.ok(coords.left >= 14);
    assert.ok(coords.left + tooltipDimensions.width <= 390);
    assert.equal(coords.arrowOffsetPercent, 50, 'Arrow should be centered on mobile');
  });

  await t.test('5. findTourTargetElement Tolerance & Safe Diagnostics', () => {
    // Non-existent selector returns null cleanly without throwing
    const result = findTourTargetElement('[data-tour="non-existent-selector-999"]');
    assert.equal(result, null);

    // Invalid selector syntax handled safely
    const invalidResult = findTourTargetElement(':::invalid-syntax');
    assert.equal(invalidResult, null);
  });
});
